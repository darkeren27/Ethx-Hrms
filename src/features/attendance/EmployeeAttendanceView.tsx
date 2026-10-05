import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building2,
  Laptop,
  FileSpreadsheet,
  CalendarCheck2,
  List,
  Grid,
  Award,
  Sparkles,
  Plane,
  HeartPulse,
  Coffee,
  Play,
  Square,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import {
  Employee,
  AttendanceRecord,
  LeaveApplication,
  ActualAttendanceStatus,
  ActualWorkMode,
} from '../../types/hrms';
import { hrmsService } from '../../services/hrmsService';
import {
  EMPLOYEE_NAV_PERIODS,
  EmployeePeriodConfig,
  calculateEmployeeTenure,
  getEmployeeLeaveBalance,
  generateIndividualAttendanceTimeline,
  getScheduledWorkMode,
} from '../../services/attendanceScheduleService';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_EMPLOYEES } from '../../lib/mockData';

export interface EmployeeAttendanceViewProps {
  employee: Employee;
  allAttendance: AttendanceRecord[];
  allLeaves: LeaveApplication[];
  onRefreshData?: () => void;
}

export const EmployeeAttendanceView: React.FC<EmployeeAttendanceViewProps> = ({
  employee,
  allAttendance,
  allLeaves,
  onRefreshData,
}) => {
  const { user } = useAuth();

  // Resolved safe employee identity
  const currentEmployee: Employee = useMemo(() => {
    if (employee) return employee;
    const list = INITIAL_EMPLOYEES;
    const match = list.find(
      (e) =>
        (user?.employeeId && (e.employeeId === user.employeeId || e.id === user.employeeId)) ||
        (user?.id && (e.employeeId === user.id || e.id === user.id)) ||
        (user?.name && e.fullName.toLowerCase() === user.name.toLowerCase())
    );
    if (match) return match;
    return INITIAL_EMPLOYEES[0];
  }, [employee, user]);

  // Period Selection (Defaults to Current Month: September 2026)
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('2026-09');
  const [displayMode, setDisplayMode] = useState<'Table' | 'Grid'>('Table');
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'WEEKDAYS' | 'WEEKENDS' | 'PRESENT' | 'LEAVE'>('ALL');
  const [searchDateQuery, setSearchDateQuery] = useState<string>('');
  const [isPunching, setIsPunching] = useState<boolean>(false);
  const [punchFeedback, setPunchFeedback] = useState<string | null>(null);

  // Tenure & Leave Balances
  const tenure = useMemo(() => calculateEmployeeTenure(currentEmployee), [currentEmployee]);
  const leaveBalances = useMemo(() => getEmployeeLeaveBalance(currentEmployee), [currentEmployee]);

  // Selected Period Config
  const currentPeriodConfig = useMemo(() => {
    return (
      EMPLOYEE_NAV_PERIODS.find((p) => p.key === selectedPeriodKey) ||
      EMPLOYEE_NAV_PERIODS[0]
    );
  }, [selectedPeriodKey]);

  // Timeline for this employee and period
  const timelineRecords = useMemo(() => {
    return generateIndividualAttendanceTimeline(
      currentEmployee,
      currentPeriodConfig.startDate,
      currentPeriodConfig.endDate,
      allAttendance,
      allLeaves
    );
  }, [currentEmployee, currentPeriodConfig, allAttendance, allLeaves]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    let workingDays = 0;
    let weekendHolidays = 0;
    let publicHolidays = 0;
    let daysPresent = 0;
    let wfoPresentDays = 0;
    let wfhPresentDays = 0;
    let approvedLeaveDays = 0;
    let unrecordedDays = 0;
    let totalWorkHours = 0;

    timelineRecords.forEach((r) => {
      const d = new Date(r.date + 'T00:00:00+05:30');
      const day = d.getDay();
      const isWeekend = day === 0 || day === 6 || r.scheduledWorkMode === 'Weekly Off';
      const isWeekdayHoliday = !isWeekend && r.scheduledWorkMode === 'Holiday';

      if (isWeekend) {
        weekendHolidays++;
      } else if (isWeekdayHoliday) {
        publicHolidays++;
      } else {
        workingDays++;
      }

      if (r.status === 'Present') {
        daysPresent++;
        totalWorkHours += r.workHours || 0;
        if (r.actualWorkMode === 'WFO' || r.scheduledWorkMode === 'WFO') {
          wfoPresentDays++;
        } else {
          wfhPresentDays++;
        }
      } else if (r.status === 'Approved Leave') {
        approvedLeaveDays++;
      } else if (r.status === 'Not Recorded') {
        unrecordedDays++;
      }
    });

    const recordedDays = workingDays - unrecordedDays;
    const attendanceRate =
      recordedDays > 0
        ? ((daysPresent / recordedDays) * 100).toFixed(1) + '%'
        : daysPresent > 0
        ? '100.0%'
        : '0.0%';

    return {
      totalDays: timelineRecords.length,
      workingDays,
      weekendHolidays,
      publicHolidays,
      daysPresent,
      wfoPresentDays,
      wfhPresentDays,
      approvedLeaveDays,
      unrecordedDays,
      totalWorkHours: Number(totalWorkHours.toFixed(1)),
      attendanceRate,
    };
  }, [timelineRecords]);

  // Today's Status
  const todayStr = '2026-09-28';
  const todayRecord = useMemo(() => {
    return allAttendance.find(
      (r) => (r.employeeId === currentEmployee.employeeId || r.employeeId === currentEmployee.id) && r.date === todayStr
    );
  }, [allAttendance, currentEmployee, todayStr]);

  const isCheckedInToday = !!todayRecord && !!todayRecord.checkIn;
  const isCheckedOutToday = !!todayRecord && !!todayRecord.checkOut;

  // Web Clock-in / Clock-out handler
  const handlePunchToday = async () => {
    setIsPunching(true);
    setPunchFeedback(null);
    try {
      const dept = currentEmployee.department && currentEmployee.department !== 'Not provided' ? currentEmployee.department : 'Engineering & Operations';
      if (!isCheckedInToday) {
        await hrmsService.punchAttendance(currentEmployee.employeeId, currentEmployee.fullName, dept, 'IN');
        setPunchFeedback(`Success: Clock-in recorded at ${new Date().toLocaleTimeString()} for ${todayStr}.`);
      } else if (!isCheckedOutToday) {
        await hrmsService.punchAttendance(currentEmployee.employeeId, currentEmployee.fullName, dept, 'OUT');
        setPunchFeedback(`Success: Clock-out recorded at ${new Date().toLocaleTimeString()} for ${todayStr}.`);
      }
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setPunchFeedback(`Error: ${err.message || 'Failed to record punch'}`);
    } finally {
      setIsPunching(false);
    }
  };

  // Filtered Records
  const filteredTimeline = useMemo(() => {
    return timelineRecords.filter((r) => {
      const d = new Date(r.date + 'T00:00:00+05:30');
      const isWeekend = d.getDay() === 0 || d.getDay() === 6 || r.scheduledWorkMode === 'Weekly Off';

      if (ledgerFilter === 'WEEKDAYS' && isWeekend) return false;
      if (ledgerFilter === 'WEEKENDS' && !isWeekend) return false;
      if (ledgerFilter === 'PRESENT' && r.status !== 'Present') return false;
      if (ledgerFilter === 'LEAVE' && r.status !== 'Approved Leave') return false;

      if (searchDateQuery.trim()) {
        const q = searchDateQuery.toLowerCase();
        const matchesDate = r.date.includes(q);
        const matchesMode = (r.actualWorkMode || r.scheduledWorkMode || '').toLowerCase().includes(q);
        const matchesStatus = r.status.toLowerCase().includes(q);
        if (!matchesDate && !matchesMode && !matchesStatus) return false;
      }
      return true;
    });
  }, [timelineRecords, ledgerFilter, searchDateQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Employee Name',
      'Tenure',
      'Date',
      'Day of Week',
      'Scheduled Mode',
      'Actual Status',
      'Actual Mode',
      'Check In',
      'Check Out',
      'Work Hours',
      'Conflict / Remarks',
      'Data Coverage',
    ];

    const rows = timelineRecords.map((r) => {
      const d = new Date(r.date + 'T00:00:00+05:30');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const note = r.conflictDetails || r.remarks || '';

      return [
        `"${currentEmployee.employeeId}"`,
        `"${currentEmployee.fullName}"`,
        `"${tenure.tenureDisplay}"`,
        `"${r.date}"`,
        `"${dayName}"`,
        `"${r.scheduledWorkMode}"`,
        `"${r.status}"`,
        `"${r.actualWorkMode || ''}"`,
        `"${r.checkIn || ''}"`,
        `"${r.checkOut || ''}"`,
        r.workHours || 0,
        `"${note}"`,
        `"${r.dataCoverage || 'Recorded'}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `ETHX_${(currentEmployee.fullName || user?.name || 'Employee').replace(/\s+/g, '_')}_${currentPeriodConfig.key}_Attendance_Ledger.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const initials = (currentEmployee.fullName || user?.name || 'Employee')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Executive Career & Tenure Banner (2 to 3 Years Service) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-card via-brand-dark-subtle to-brand-card border border-brand-border/80 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-red/20 to-brand-red/5 border border-brand-red/40 flex items-center justify-center text-brand-red font-bold text-lg font-mono shadow-glow-red-sm">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-brand-ink">{currentEmployee.fullName || user?.name || 'Employee'}</h2>
                <Badge variant="neutral" className="text-xs font-mono">
                  {currentEmployee.employeeId || 'ETHX-EMP'}
                </Badge>
                <Badge variant="neutral" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold">
                  Permanent Staff
                </Badge>
                <Badge variant="warning" className="text-xs font-bold flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Tenure: {tenure.tenureDisplay}
                </Badge>
              </div>
              <p className="text-xs text-brand-slate mt-1 max-w-2xl leading-relaxed">
                Designation: <strong className="text-brand-ink">{currentEmployee.designation || 'Permanent Staff'}</strong> • Department: <strong className="text-brand-ink">{currentEmployee.department && currentEmployee.department !== 'Not provided' ? currentEmployee.department : 'Engineering & Operations'}</strong> • Joined: <span className="font-mono text-brand-ink font-semibold">{tenure.joiningDateStr}</span> (2–3 Years Veteran Contributor)
              </p>
            </div>
          </div>

          {/* Web Clock-in / Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Web Clock-In Widget */}
            <div className="p-2.5 rounded-xl bg-brand-dark border border-white/5 flex items-center gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-slate block">Today ({todayStr})</span>
                <span className="text-xs font-bold text-brand-ink flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isCheckedInToday ? 'bg-emerald-400 animate-pulse' : 'bg-brand-slate'}`} />
                  {isCheckedOutToday
                    ? `Clocked Out (${todayRecord?.checkOut})`
                    : isCheckedInToday
                    ? `Clocked In (${todayRecord?.checkIn})`
                    : 'Shift Not Started'}
                </span>
              </div>
              <Button
                size="sm"
                variant={isCheckedInToday && !isCheckedOutToday ? 'secondary' : 'primary'}
                onClick={handlePunchToday}
                isLoading={isPunching}
                disabled={isCheckedOutToday}
                className="text-xs flex items-center gap-1 font-bold"
              >
                {!isCheckedInToday ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Web Check-In
                  </>
                ) : !isCheckedOutToday ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    Web Clock-Out
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Shift Complete
                  </>
                )}
              </Button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs flex items-center gap-1.5 font-bold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Export Period CSV
            </Button>
          </div>
        </div>

        {/* Corporate Hybrid Work & Paid Leave Quotas */}
        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-brand-dark/50 border border-white/5">
            <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-brand-slate text-[10px] uppercase font-bold block">Mon – Wed Policy</span>
              <strong className="text-brand-ink text-xs truncate">WFO • Pune HQ Main Campus</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-brand-dark/50 border border-white/5">
            <Laptop className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-brand-slate text-[10px] uppercase font-bold block">Thu – Fri Policy</span>
              <strong className="text-brand-ink text-xs truncate">WFH • Approved Remote</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <CalendarCheck2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-amber-400/80 text-[10px] uppercase font-bold block">Weekend Policy</span>
              <strong className="text-amber-300 text-xs truncate">Saturday &amp; Sunday (Weekly Off)</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-brand-dark/50 border border-white/5">
            <Plane className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-brand-slate text-[10px] uppercase font-bold block">Paid Annual Leaves</span>
              <strong className="text-sky-300 text-xs truncate">
                {leaveBalances.annualLeaveRemaining} / {leaveBalances.annualLeaveTotal} Days Remaining
              </strong>
            </div>
          </div>
        </div>
      </div>

      {punchFeedback && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          punchFeedback.startsWith('Success')
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{punchFeedback}</span>
        </div>
      )}

      {/* Multi-Period & Month Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-brand-card rounded-xl border border-brand-border">
        <div className="flex flex-wrap items-center gap-1.5 bg-brand-dark p-1 rounded-lg border border-white/5">
          {EMPLOYEE_NAV_PERIODS.map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriodKey(period.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                selectedPeriodKey === period.key
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-brand-ink hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{period.label}</span>
            </button>
          ))}
        </div>

        {/* View Mode Switcher (Shift Ledger Table vs Calendar Grid) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-brand-dark p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setDisplayMode('Table')}
              className={`p-1.5 rounded text-xs transition-all flex items-center gap-1 ${
                displayMode === 'Table'
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-brand-ink'
              }`}
              title="Shift Ledger Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Shift Ledger</span>
            </button>
            <button
              onClick={() => setDisplayMode('Grid')}
              className={`p-1.5 rounded text-xs transition-all flex items-center gap-1 ${
                displayMode === 'Grid'
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-brand-ink'
              }`}
              title="Monthly Calendar Grid"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip for Selected Period */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Period Days"
          value={metrics.totalDays.toString()}
          subtitle={`${currentPeriodConfig.label}`}
          icon={Calendar}
          variant="default"
        />
        <StatCard
          title="Working Days"
          value={metrics.workingDays.toString()}
          subtitle="Mon–Fri business shifts"
          icon={Building2}
          variant="default"
        />
        <StatCard
          title="Weekend Holidays"
          value={metrics.weekendHolidays.toString()}
          subtitle="Saturday & Sunday (0 hrs)"
          icon={CalendarCheck2}
          variant="default"
        />
        <StatCard
          title="Shifts Present"
          value={metrics.daysPresent.toString()}
          subtitle={`${metrics.wfoPresentDays} WFO • ${metrics.wfhPresentDays} WFH`}
          icon={CheckCircle}
          variant="emerald"
        />
        <StatCard
          title="Paid Leaves"
          value={metrics.approvedLeaveDays.toString()}
          subtitle="Annual / Casual / Sick"
          icon={Plane}
          variant="blue"
        />
        <StatCard
          title="Attendance Rate"
          value={metrics.attendanceRate}
          subtitle={`${metrics.totalWorkHours} total hours logged`}
          icon={Clock}
          variant="emerald"
        />
      </div>

      {/* Shift Ledger Table Mode */}
      {displayMode === 'Table' && (
        <Card className="p-0 overflow-hidden">
          <CardHeader className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle>
                Personal Shift Attendance Ledger • {currentPeriodConfig.label}
              </CardTitle>
              <p className="text-xs text-brand-slate mt-0.5">
                Displaying day-wise punches, scheduled modes, hours, and audit notes strictly for your personal account ({currentEmployee.employeeId || 'Personal'}).
              </p>
            </div>

            {/* Quick Filter Ribbon */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-slate mr-1">Filter:</span>
              <button
                onClick={() => setLedgerFilter('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  ledgerFilter === 'ALL'
                    ? 'bg-brand-red text-white'
                    : 'bg-brand-dark border border-white/5 text-brand-slate hover:text-brand-ink'
                }`}
              >
                All Days ({timelineRecords.length})
              </button>
              <button
                onClick={() => setLedgerFilter('WEEKDAYS')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  ledgerFilter === 'WEEKDAYS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-brand-dark border border-white/5 text-brand-slate hover:text-brand-ink'
                }`}
              >
                Weekdays Only ({metrics.workingDays})
              </button>
              <button
                onClick={() => setLedgerFilter('WEEKENDS')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  ledgerFilter === 'WEEKENDS'
                    ? 'bg-amber-600 text-white'
                    : 'bg-brand-dark border border-white/5 text-amber-400 hover:text-amber-300'
                }`}
              >
                Weekend Holidays ({metrics.weekendHolidays})
              </button>
              <button
                onClick={() => setLedgerFilter('PRESENT')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  ledgerFilter === 'PRESENT'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand-dark border border-white/5 text-brand-slate hover:text-brand-ink'
                }`}
              >
                Present ({metrics.daysPresent})
              </button>
              <button
                onClick={() => setLedgerFilter('LEAVE')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  ledgerFilter === 'LEAVE'
                    ? 'bg-sky-600 text-white'
                    : 'bg-brand-dark border border-white/5 text-brand-slate hover:text-brand-ink'
                }`}
              >
                Leaves ({metrics.approvedLeaveDays})
              </button>
            </div>
          </CardHeader>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-dark-subtle border-b border-brand-border text-brand-slate uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Scheduled Mode</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Actual Mode</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Work Hours</th>
                  <th className="py-3 px-4">Data Coverage</th>
                  <th className="py-3 px-4">Ledger Notes / Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredTimeline.map((r) => {
                  const d = new Date(r.date + 'T00:00:00+05:30');
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6 || r.scheduledWorkMode === 'Weekly Off';
                  const isPresent = r.status === 'Present';
                  const isLeave = r.status === 'Approved Leave';
                  const isPublicHoliday = r.scheduledWorkMode === 'Holiday' || r.status === 'Holiday';

                  return (
                    <tr
                      key={r.date}
                      className={`hover:bg-brand-card-hover transition-colors ${
                        isWeekend ? 'bg-amber-500/[0.03]' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold text-brand-ink">{r.date}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`font-semibold ${
                            isWeekend ? 'text-amber-400 font-bold' : 'text-brand-slate'
                          }`}
                        >
                          {dayName}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {isWeekend ? (
                          <Badge variant="warning" className="text-[10px]">
                            Weekly Off
                          </Badge>
                        ) : isPublicHoliday ? (
                          <Badge variant="neutral" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30">
                            Public Holiday
                          </Badge>
                        ) : (
                          <Badge
                            variant={r.scheduledWorkMode === 'WFO' ? 'info' : 'success'}
                            className="text-[10px]"
                          >
                            {r.scheduledWorkMode === 'WFO' ? 'WFO (Pune HQ)' : 'WFH (Remote)'}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {isWeekend ? (
                          <span className="text-amber-300 font-semibold flex items-center gap-1">
                            <CalendarCheck2 className="w-3 h-3" />
                            Weekend Holiday
                          </span>
                        ) : isPresent ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Present
                          </span>
                        ) : isLeave ? (
                          <span className="text-sky-400 font-bold flex items-center gap-1">
                            <Plane className="w-3 h-3" />
                            Approved Leave
                          </span>
                        ) : isPublicHoliday ? (
                          <span className="text-purple-300 font-semibold">Public Holiday</span>
                        ) : (
                          <span className="text-brand-slate/60">Not Recorded</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-brand-slate font-medium">
                        {r.actualWorkMode || (isPresent ? r.scheduledWorkMode : '—')}
                      </td>
                      <td className="py-2.5 px-4 text-brand-slate">
                        {r.checkIn || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-brand-slate">
                        {r.checkOut || '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`font-bold ${r.workHours && r.workHours > 0 ? 'text-brand-ink' : 'text-brand-slate/40'}`}>
                          {r.workHours ? `${r.workHours.toFixed(1)}h` : '0h'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            r.dataCoverage === 'Recorded'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-white/5 text-brand-slate'
                          }`}
                        >
                          {r.dataCoverage || 'Recorded'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-brand-slate font-sans">
                        {r.conflictDetails ? (
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            {r.conflictDetails}
                          </span>
                        ) : r.remarks ? (
                          <span>{r.remarks}</span>
                        ) : isWeekend ? (
                          <span className="text-amber-400/80">Designated weekend holiday (0 work hours)</span>
                        ) : (
                          <span className="text-brand-slate/40">Standard shift verified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Calendar Grid Mode */}
      {displayMode === 'Grid' && (
        <Card className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <h3 className="font-bold text-sm text-brand-ink flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-red" />
                Monthly Calendar Grid ({currentPeriodConfig.label})
              </h3>
              <p className="text-xs text-brand-slate mt-0.5">
                7-day Monday through Sunday calendar. Saturdays &amp; Sundays are permanent Weekend Holidays.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-blue-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> WFO
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> WFH
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Weekend Off
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-brand-slate uppercase tracking-wider pb-2 border-b border-white/5">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-amber-400">Sat</div>
            <div className="text-amber-400">Sun</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {timelineRecords.map((r) => {
              const d = new Date(r.date + 'T00:00:00+05:30');
              const dayNum = d.getDate();
              const isWeekend = d.getDay() === 0 || d.getDay() === 6 || r.scheduledWorkMode === 'Weekly Off';
              const isPresent = r.status === 'Present';
              const isLeave = r.status === 'Approved Leave';
              const isPublicHoliday = r.scheduledWorkMode === 'Holiday' || r.status === 'Holiday';

              return (
                <div
                  key={r.date}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between min-h-[92px] transition-all ${
                    isWeekend
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : isPresent
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isLeave
                      ? 'bg-sky-500/10 border-sky-500/30'
                      : isPublicHoliday
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-brand-card border-brand-border/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-brand-ink">{dayNum}</span>
                    {isWeekend ? (
                      <span className="text-[9px] font-bold px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Off
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold ${
                          r.scheduledWorkMode === 'WFO' ? 'text-blue-400' : 'text-emerald-400'
                        }`}
                      >
                        {r.scheduledWorkMode}
                      </span>
                    )}
                  </div>

                  <div className="my-1">
                    {isWeekend ? (
                      <div className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                        <CalendarCheck2 className="w-2.5 h-2.5" />
                        Weekend Holiday
                      </div>
                    ) : isPresent ? (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          {r.actualWorkMode || r.scheduledWorkMode}
                        </span>
                        <div className="text-[9px] font-mono text-brand-slate">
                          {r.checkIn || '09:00 AM'} • {r.workHours || 8}h
                        </div>
                      </div>
                    ) : isLeave ? (
                      <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
                        <Plane className="w-2.5 h-2.5" />
                        Paid Leave
                      </span>
                    ) : isPublicHoliday ? (
                      <span className="text-[10px] font-bold text-purple-300">Public Holiday</span>
                    ) : (
                      <span className="text-[10px] text-brand-slate/60">Not Recorded</span>
                    )}
                  </div>

                  <div className="text-[9px] font-mono text-brand-slate/60 text-right">
                    {r.date}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
