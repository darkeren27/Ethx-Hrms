import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Building2,
  Laptop,
  FileSpreadsheet,
  Download,
  Info,
  CalendarCheck2,
  ShieldCheck,
  Edit3,
  Users,
  Grid,
  List,
  Sparkles,
  Award,
  GraduationCap,
  Search,
  Filter,
  TrendingUp,
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
  INTERN_COHORT_MONTHS,
  InternMonthConfig,
  calculateInternMonthlyMetrics,
  generateIndividualAttendanceTimeline,
  getScheduledWorkMode,
  INTERNSHIP_START_DATE,
  INTERNSHIP_END_DATE,
} from '../../services/attendanceScheduleService';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_EMPLOYEES } from '../../lib/mockData';

export interface InternMonthlyAttendanceViewProps {
  interns: Employee[];
  allAttendance: AttendanceRecord[];
  allLeaves: LeaveApplication[];
  isAdmin: boolean;
  onOpenCorrection?: (record: AttendanceRecord) => void;
  onOpenManualAttendance?: (employeeId: string, dateStr: string) => void;
  defaultInternId?: string;
}

export const InternMonthlyAttendanceView: React.FC<InternMonthlyAttendanceViewProps> = ({
  interns,
  allAttendance,
  allLeaves,
  isAdmin,
  onOpenCorrection,
  onOpenManualAttendance,
  defaultInternId,
}) => {
  const { user } = useAuth();

  // Active Intern Selection ('COHORT_ALL' for Cohort Comparison, or an employeeId)
  const initialInternId = useMemo(() => {
    const list = interns && interns.length > 0 ? interns : INITIAL_EMPLOYEES;
    if (defaultInternId) {
      const match = list.find((i) => i.employeeId === defaultInternId || i.id === defaultInternId);
      if (match) return match.employeeId;
    }
    if (!isAdmin && user) {
      const match = list.find(
        (i) =>
          (user.employeeId && (i.employeeId === user.employeeId || i.id === user.employeeId)) ||
          (user.id && (i.employeeId === user.id || i.id === user.id)) ||
          i.fullName.toLowerCase() === (user.name || '').toLowerCase()
      );
      if (match) return match.employeeId;
      if (user.name?.toLowerCase().includes('krishna')) {
        return 'ETHX-021';
      }
    }
    return list[0]?.employeeId || 'ETHX-021';
  }, [defaultInternId, isAdmin, user, interns]);

  const [selectedInternId, setSelectedInternId] = useState<string>(initialInternId);

  // For non-admin intern, enforce activeInternId strictly to their own verified identity
  const activeInternId = useMemo(() => {
    if (!isAdmin) return initialInternId;
    return selectedInternId;
  }, [isAdmin, initialInternId, selectedInternId]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-09'); // Default to September 2026
  const [displayMode, setDisplayMode] = useState<'Table' | 'Grid'>('Table');
  const [timelineRecords, setTimelineRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Quick Ledger Filter
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'WEEKDAYS' | 'WEEKENDS' | 'PRESENT' | 'LEAVE'>('ALL');
  const [searchDateQuery, setSearchDateQuery] = useState<string>('');

  // Selected Month Config
  const currentMonthConfig = useMemo(() => {
    return (
      INTERN_COHORT_MONTHS.find((m) => m.key === selectedMonthKey) ||
      INTERN_COHORT_MONTHS[2] // September
    );
  }, [selectedMonthKey]);

  // Selected Intern
  const selectedIntern: Employee = useMemo(() => {
    const list = interns && interns.length > 0 ? interns : INITIAL_EMPLOYEES;
    const found = list.find(
      (i) =>
        i.employeeId === activeInternId ||
        i.id === activeInternId ||
        (user?.employeeId && (i.employeeId === user.employeeId || i.id === user.employeeId)) ||
        (user?.id && (i.employeeId === user.id || i.id === user.id)) ||
        (user?.name && i.fullName.toLowerCase() === user.name.toLowerCase())
    );
    if (found) return found;
    if (user?.name?.toLowerCase().includes('krishna')) {
      const kt = INITIAL_EMPLOYEES.find((e) => e.id === 'emp-021' || e.employeeId === 'ETHX-021');
      if (kt) return kt;
    }
    return list[0] || INITIAL_EMPLOYEES[20];
  }, [interns, activeInternId, user]);

  // Load timeline for selected intern and month
  useEffect(() => {
    if (!selectedIntern) return;
    setIsLoading(true);
    const records = generateIndividualAttendanceTimeline(
      selectedIntern,
      currentMonthConfig.startDate,
      currentMonthConfig.endDate,
      allAttendance,
      allLeaves
    );
    setTimelineRecords(records);
    setIsLoading(false);
  }, [selectedIntern, currentMonthConfig, allAttendance, allLeaves]);

  // Computed metrics for the selected intern in the selected month
  const monthlyMetrics = useMemo(() => {
    return calculateInternMonthlyMetrics(timelineRecords, currentMonthConfig);
  }, [timelineRecords, currentMonthConfig]);

  // Cohort-wide metrics summary for all 8 interns in the selected month (HR Admin only)
  const cohortComparison = useMemo(() => {
    if (!isAdmin) return [];
    return interns.map((intern) => {
      const records = generateIndividualAttendanceTimeline(
        intern,
        currentMonthConfig.startDate,
        currentMonthConfig.endDate,
        allAttendance,
        allLeaves
      );
      const metrics = calculateInternMonthlyMetrics(records, currentMonthConfig);
      return {
        intern,
        metrics,
      };
    });
  }, [isAdmin, interns, currentMonthConfig, allAttendance, allLeaves]);

  // Filtered timeline records based on ledger filter & search query
  const filteredTimelineRecords = useMemo(() => {
    return timelineRecords.filter((r) => {
      const d = new Date(r.date + 'T00:00:00+05:30');
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      if (searchDateQuery.trim()) {
        const q = searchDateQuery.toLowerCase();
        const matchesDate = r.date.includes(q);
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d.getDay()];
        if (!matchesDate && !dayName.includes(q)) return false;
      }

      if (ledgerFilter === 'WEEKDAYS' && isWeekend) return false;
      if (ledgerFilter === 'WEEKENDS' && !isWeekend) return false;
      if (ledgerFilter === 'PRESENT' && r.status !== 'Present') return false;
      if (ledgerFilter === 'LEAVE' && r.status !== 'Approved Leave') return false;

      return true;
    });
  }, [timelineRecords, ledgerFilter, searchDateQuery]);

  // Export current month ledger to CSV
  const handleExportCSV = () => {
    if (!selectedIntern) return;
    const headers = [
      'Date',
      'Day of Week',
      'Intern ID',
      'Intern Name',
      'Department',
      'Scheduled Mode',
      'Actual Status',
      'Actual Work Mode',
      'Check In',
      'Check Out',
      'Logged Hours',
      'Weekend / Holiday Note',
      'Data Coverage',
    ];

    const rows = timelineRecords.map((r) => {
      const d = new Date(r.date + 'T00:00:00+05:30');
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const note = isWeekend ? 'Weekend Holiday (Weekly Off)' : r.remarks || '';

      return [
        `"${r.date}"`,
        `"${dayName}"`,
        `"${selectedIntern?.employeeId || ''}"`,
        `"${selectedIntern?.fullName || user?.name || 'Intern'}"`,
        `"${selectedIntern?.department || 'Engineering & Cloud'}"`,
        `"${r.scheduledWorkMode}"`,
        `"${r.status}"`,
        `"${r.actualWorkMode || 'None'}"`,
        `"${r.checkIn || 'Not recorded'}"`,
        `"${r.checkOut || 'Not recorded'}"`,
        `"${r.workHours || 0}"`,
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
      `ETHX_${(selectedIntern?.fullName || user?.name || 'Intern').replace(/\s+/g, '_')}_${currentMonthConfig.key}_Attendance_Ledger.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Executive Command Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-card via-brand-dark-subtle to-brand-card border border-brand-border/80 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-brand-ink flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                {isAdmin
                  ? 'Intern Month-Wise Attendance Command Center'
                  : 'My 3-Month Internship Attendance Record (July – September 2026)'}
              </h2>
              <Badge variant="warning" className="text-[11px] font-bold">
                {isAdmin ? '8 Cohort Interns' : 'Personal Intern Record'}
              </Badge>
              <Badge variant="neutral" className="text-[11px] font-mono">
                1 Jul 2026 – 30 Sep 2026
              </Badge>
            </div>
            <p className="text-xs text-brand-slate mt-1 max-w-3xl leading-relaxed">
              {isAdmin
                ? 'Official month-by-month attendance ledger, hybrid work policy adherence (Mon–Wed: Pune HQ, Thu–Fri: Remote), and weekly off tracking.'
                : `Verified day-by-day attendance history from 1 July 2026 to 30 September 2026 for ${selectedIntern?.fullName || user?.name || 'Intern'}.`}
              <strong className="text-amber-300 font-semibold ml-1">Saturday and Sunday are designated Weekend Holidays (Weekly Off)</strong> with zero scheduled work.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && onOpenManualAttendance && selectedIntern && selectedInternId !== 'COHORT_ALL' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenManualAttendance(selectedIntern?.employeeId || '', currentMonthConfig.startDate)}
                className="text-xs flex items-center gap-1.5 border-brand-red/50 text-brand-red hover:bg-brand-red/10 font-bold"
              >
                <UserCheck className="w-3.5 h-3.5 text-brand-red" />
                Mark Manual Attendance
              </Button>
            )}

            {selectedInternId !== 'COHORT_ALL' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
                className="text-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Export Month CSV
              </Button>
            )}

            {selectedInternId !== 'COHORT_ALL' && (
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
                  <span className="text-[10px] font-bold">Ledger</span>
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
            )}
          </div>
        </div>

        {/* Corporate Hybrid Work & Holiday Policy Micro-Strip */}
        <div className="mt-3.5 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-brand-dark/50 border border-white/5">
            <Building2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-brand-slate text-[10px] uppercase font-bold block">Mon – Wed Policy</span>
              <strong className="text-brand-ink text-xs truncate">WFO • Pune HQ Campus</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-brand-dark/50 border border-white/5">
            <Laptop className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-brand-slate text-[10px] uppercase font-bold block">Thu – Fri Policy</span>
              <strong className="text-brand-ink text-xs truncate">WFH • Remote Approved</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <CalendarCheck2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-amber-400/80 text-[10px] uppercase font-bold block">Weekend Policy</span>
              <strong className="text-amber-300 text-xs truncate">Saturday &amp; Sunday Holiday</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-brand-dark/50 border border-white/5">
            <Award className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-brand-slate text-[10px] uppercase font-bold block">Evaluation Status</span>
              <strong className="text-brand-ink text-xs truncate">October 2026 Conversion</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-brand-card rounded-xl border border-brand-border">
        <div className="flex flex-wrap items-center gap-1.5 bg-brand-dark p-1 rounded-lg border border-white/5">
          {INTERN_COHORT_MONTHS.map((month) => (
            <button
              key={month.key}
              onClick={() => setSelectedMonthKey(month.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                selectedMonthKey === month.key
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-brand-ink hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{month.label}</span>
            </button>
          ))}
        </div>

        <div className="text-[11px] font-semibold text-brand-slate px-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentMonthConfig.phaseTitle} ({currentMonthConfig.startDate} → {currentMonthConfig.endDate})</span>
        </div>
      </div>

      {/* Intern Selector Ribbon (For HR Admin or cohort navigation) */}
      {isAdmin && (
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-slate flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Select Intern (8 Confirmed Cohort Members)
            </span>
            <button
              onClick={() => setSelectedInternId('COHORT_ALL')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                selectedInternId === 'COHORT_ALL'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber-sm'
                  : 'text-brand-slate hover:text-brand-ink hover:bg-white/5 border border-transparent'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Compare All 8 Interns Side-by-Side
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {interns.map((intern) => {
              const isSelected = selectedInternId === intern.employeeId;
              const initials = intern.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <button
                  key={intern.id}
                  onClick={() => setSelectedInternId(intern.employeeId)}
                  className={`p-2 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-brand-red/10 border-brand-red text-brand-ink shadow-glow-red-sm ring-1 ring-brand-red/40'
                      : 'bg-brand-dark-subtle border-brand-border/60 hover:border-brand-border text-brand-slate hover:text-brand-ink'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                        isSelected ? 'bg-brand-red text-white' : 'bg-brand-card text-brand-slate'
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate text-brand-ink">
                        {intern.fullName}
                      </div>
                      <div className="text-[10px] font-mono text-brand-slate truncate">
                        {intern.employeeId}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Cohort All Comparison View OR Single Intern View */}
      {isAdmin && selectedInternId === 'COHORT_ALL' ? (
        <Card className="p-0 overflow-hidden">
          <CardHeader className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>
                All 8 Interns: Monthly Attendance Comparison ({currentMonthConfig.label})
              </CardTitle>
              <p className="text-xs text-brand-slate mt-0.5">
                Complete overview across all 8 cohort interns for {currentMonthConfig.label} ({currentMonthConfig.totalDays} calendar days, {currentMonthConfig.phaseTitle})
              </p>
            </div>
            <Badge variant="warning">8 Cohort Members</Badge>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-dark-subtle border-b border-brand-border text-brand-slate uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Intern</th>
                  <th className="py-3 px-4">Working Days</th>
                  <th className="py-3 px-4">Weekend Holidays</th>
                  <th className="py-3 px-4">Present (WFO)</th>
                  <th className="py-3 px-4">Present (WFH)</th>
                  <th className="py-3 px-4">Total Present</th>
                  <th className="py-3 px-4">Approved Leaves</th>
                  <th className="py-3 px-4">Total Hours</th>
                  <th className="py-3 px-4">Attendance Rate</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cohortComparison.map(({ intern, metrics }) => (
                  <tr key={intern.id} className="hover:bg-brand-card-hover transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-bold text-brand-ink flex items-center gap-1.5">
                          <span>{intern.fullName}</span>
                          <Badge variant="warning" className="text-[9px] py-0 px-1 font-bold">
                            Intern
                          </Badge>
                        </div>
                        <span className="text-[11px] font-mono text-brand-slate">
                          {intern.employeeId} • {intern.department || 'Engineering & Cloud'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{metrics.workingDays}d</td>
                    <td className="py-3 px-4 font-mono text-amber-300 font-semibold">
                      {metrics.weekendHolidays}d (Sat/Sun)
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-400 font-semibold">
                      {metrics.wfoPresentDays}d WFO
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                      {metrics.wfhPresentDays}d WFH
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-ink">
                      {metrics.daysPresent}d
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-400 font-medium">
                      {metrics.approvedLeaveDays}d
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-ink">
                      {metrics.totalWorkHours}h
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <Badge
                          variant={
                            parseFloat(metrics.attendanceRate) >= 90
                              ? 'success'
                              : parseFloat(metrics.attendanceRate) >= 75
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {metrics.attendanceRate}
                        </Badge>
                        <div className="w-20 bg-brand-dark rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, parseFloat(metrics.attendanceRate) || 0))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedInternId(intern.employeeId)}
                        className="text-xs"
                      >
                        Open Month Ledger
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <>
          {/* Executive Intern Profile Card */}
          {selectedIntern && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-card via-brand-dark-subtle to-brand-card border border-brand-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-base font-mono shadow-glow-amber-sm">
                  {(selectedIntern?.fullName || user?.name || 'Intern')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-brand-ink">{selectedIntern?.fullName || user?.name || 'Intern'}</h3>
                    <Badge variant="warning" className="font-bold">
                      Unpaid Intern (₹0 Stipend)
                    </Badge>
                    <Badge variant="neutral" className="font-mono">
                      {selectedIntern?.employeeId || 'ETHX-021'}
                    </Badge>
                  </div>
                  <p className="text-xs text-brand-slate mt-1">
                    Department: <strong className="text-brand-ink">{selectedIntern?.department || 'Engineering & Cloud'}</strong> • Reporting: <strong className="text-brand-ink">Siva Kumar (IT Director)</strong> • Tenure: <span className="font-mono text-brand-ink">1 Jul 2026 – 30 Sep 2026</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-dark border border-white/5 text-right">
                  <span className="text-[10px] uppercase font-bold text-brand-slate block">
                    Permanent Conversion
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                    <CheckCircle className="w-3 h-3" />
                    Eligible: Oct 2026 Review
                  </span>
                </div>

                {isAdmin && onOpenManualAttendance && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenManualAttendance(selectedIntern?.employeeId || '', currentMonthConfig.startDate)}
                    className="text-xs flex items-center gap-1.5 border-brand-red/50 text-brand-red hover:bg-brand-red/10 font-bold"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-brand-red" />
                    Mark Manual Attendance
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Monthly KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              title="Total Month Days"
              value={monthlyMetrics.totalDays.toString()}
              subtitle={`${currentMonthConfig.label} calendar`}
              icon={Calendar}
              variant="default"
            />
            <StatCard
              title="Working Days"
              value={monthlyMetrics.workingDays.toString()}
              subtitle="Mon–Fri scheduled shifts"
              icon={Building2}
              variant="default"
            />
            <StatCard
              title="Weekend Holidays"
              value={monthlyMetrics.weekendHolidays.toString()}
              subtitle="Sat & Sun (Weekly Off)"
              icon={CalendarCheck2}
              variant="default"
            />
            <StatCard
              title="Days Present"
              value={monthlyMetrics.daysPresent.toString()}
              subtitle={`${monthlyMetrics.wfoPresentDays} WFO / ${monthlyMetrics.wfhPresentDays} WFH`}
              icon={CheckCircle}
              variant="emerald"
            />
            <StatCard
              title="Approved Leave"
              value={monthlyMetrics.approvedLeaveDays.toString()}
              subtitle="0 deduction on unpaid"
              icon={CalendarDays}
              variant="blue"
            />
            <StatCard
              title="Attendance Rate"
              value={monthlyMetrics.attendanceRate}
              subtitle={`${monthlyMetrics.totalWorkHours}h logged hours`}
              icon={Clock}
              variant="emerald"
            />
          </div>

          {/* Month Ledger Table or Calendar Grid */}
          {displayMode === 'Table' ? (
            <Card className="p-0 overflow-hidden">
              <CardHeader className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle>
                    {selectedIntern?.fullName || user?.name || 'Intern'} • {currentMonthConfig.label} Day-Wise Shift Ledger
                  </CardTitle>
                  <p className="text-[11px] text-brand-slate mt-0.5">
                    Showing {filteredTimelineRecords.length} of {timelineRecords.length} days • Mon–Wed WFO, Thu–Fri WFH, Sat &amp; Sun Weekend Holidays
                  </p>
                </div>

                {/* Ledger Quick Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3 h-3 text-brand-slate absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search date or day..."
                      value={searchDateQuery}
                      onChange={(e) => setSearchDateQuery(e.target.value)}
                      className="bg-brand-dark-subtle border border-brand-border rounded-lg pl-7 pr-2 py-1 text-xs text-brand-ink focus:outline-none focus:border-brand-red w-36"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-brand-dark p-0.5 rounded-lg border border-white/5">
                    <button
                      onClick={() => setLedgerFilter('ALL')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        ledgerFilter === 'ALL' ? 'bg-brand-red text-white' : 'text-brand-slate hover:text-brand-ink'
                      }`}
                    >
                      All ({timelineRecords.length})
                    </button>
                    <button
                      onClick={() => setLedgerFilter('WEEKDAYS')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        ledgerFilter === 'WEEKDAYS' ? 'bg-brand-red text-white' : 'text-brand-slate hover:text-brand-ink'
                      }`}
                    >
                      Weekdays ({monthlyMetrics.workingDays})
                    </button>
                    <button
                      onClick={() => setLedgerFilter('WEEKENDS')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        ledgerFilter === 'WEEKENDS' ? 'bg-brand-red text-white' : 'text-brand-slate hover:text-brand-ink'
                      }`}
                    >
                      Weekends ({monthlyMetrics.weekendHolidays})
                    </button>
                    <button
                      onClick={() => setLedgerFilter('PRESENT')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        ledgerFilter === 'PRESENT' ? 'bg-brand-red text-white' : 'text-brand-slate hover:text-brand-ink'
                      }`}
                    >
                      Present ({monthlyMetrics.daysPresent})
                    </button>
                  </div>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-brand-dark-subtle border-b border-brand-border text-brand-slate uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Scheduled Mode</th>
                      <th className="py-3 px-4">Actual Status</th>
                      <th className="py-3 px-4">Actual Mode</th>
                      <th className="py-3 px-4">Check In</th>
                      <th className="py-3 px-4">Check Out</th>
                      <th className="py-3 px-4">Logged Hours</th>
                      <th className="py-3 px-4">Weekend / Holiday Policy</th>
                      <th className="py-3 px-4">Data Coverage</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTimelineRecords.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 11 : 10} className="py-12 text-center text-brand-slate">
                          <Clock className="w-8 h-8 mx-auto text-brand-slate/40 mb-2" />
                          No days match the active filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTimelineRecords.map((r) => {
                        const d = new Date(r.date + 'T00:00:00+05:30');
                        const dayIndex = d.getDay();
                        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
                        const isWeekend = dayIndex === 0 || dayIndex === 6;
                        const isPublicHoliday = r.scheduledWorkMode === 'Holiday';

                        return (
                          <tr
                            key={r.id}
                            className={`hover:bg-brand-card-hover transition-colors ${
                              isWeekend
                                ? 'bg-amber-500/[0.03]'
                                : isPublicHoliday
                                ? 'bg-purple-500/[0.04]'
                                : r.conflictDetails
                                ? 'bg-amber-500/5'
                                : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-semibold text-brand-ink">
                              {r.date}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`font-semibold ${
                                  isWeekend
                                    ? 'text-amber-400'
                                    : dayIndex <= 3
                                    ? 'text-blue-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {dayName}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {isWeekend ? (
                                <Badge variant="warning" className="text-[10px] py-0 px-1.5 font-bold">
                                  Weekend Holiday
                                </Badge>
                              ) : isPublicHoliday ? (
                                <Badge variant="purple" className="text-[10px] py-0 px-1.5 font-bold">
                                  Public Holiday
                                </Badge>
                              ) : r.scheduledWorkMode === 'WFO' ? (
                                <Badge variant="red" className="text-[10px] py-0 px-1.5 font-bold">
                                  WFO (Office)
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-[10px] py-0 px-1.5 font-bold">
                                  WFH (Home)
                                </Badge>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 font-bold ${
                                  r.status === 'Present'
                                    ? 'text-emerald-400'
                                    : r.status === 'Approved Leave'
                                    ? 'text-sky-400'
                                    : isWeekend
                                    ? 'text-amber-400'
                                    : isPublicHoliday
                                    ? 'text-purple-400'
                                    : 'text-brand-slate'
                                }`}
                              >
                                {r.status === 'Present' && <CheckCircle className="w-3.5 h-3.5" />}
                                {r.status === 'Approved Leave' && <CalendarDays className="w-3.5 h-3.5" />}
                                {isWeekend && <CalendarCheck2 className="w-3.5 h-3.5" />}
                                {r.status === 'Not Recorded' && <Clock className="w-3.5 h-3.5 text-brand-slate/60" />}
                                {isWeekend ? 'Weekend Holiday (Off)' : r.status}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-mono text-brand-slate">
                                {r.actualWorkMode || (isWeekend ? 'Off' : '—')}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono text-brand-slate">
                              {r.checkIn || '—'}
                            </td>

                            <td className="py-3 px-4 font-mono text-brand-slate">
                              {r.checkOut || '—'}
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-brand-ink">
                              {r.workHours ? `${r.workHours}h` : '0h'}
                            </td>

                            <td className="py-3 px-4 text-brand-slate">
                              {isWeekend ? (
                                <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                                  <CalendarCheck2 className="w-3 h-3 flex-shrink-0" />
                                  Saturday &amp; Sunday Holiday (Weekly Off)
                                </span>
                              ) : r.remarks ? (
                                <span className="text-[11px] text-purple-300 font-medium">{r.remarks}</span>
                              ) : (
                                <span className="text-[11px] text-brand-slate/60">Standard scheduled shift</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`text-[11px] font-semibold ${
                                  r.dataCoverage === 'Recorded' ? 'text-emerald-400' : 'text-brand-slate'
                                }`}
                              >
                                {r.dataCoverage}
                              </span>
                            </td>

                            {isAdmin && (
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {onOpenManualAttendance && (
                                    <button
                                      onClick={() => onOpenManualAttendance(selectedIntern?.employeeId || '', r.date)}
                                      className="p-1 rounded bg-brand-dark hover:bg-sky-500/20 text-brand-slate hover:text-sky-400 transition-colors border border-brand-border/60"
                                      title="Mark / Adjust Manual Attendance for this Date"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {onOpenCorrection && (
                                    <button
                                      onClick={() => onOpenCorrection(r)}
                                      className="p-1 rounded bg-brand-dark hover:bg-emerald-500/20 text-brand-slate hover:text-emerald-400 transition-colors border border-brand-border/60"
                                      title="Authorized HR Correction with Audit Reason"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* Monthly Calendar Grid View */
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-brand-ink">
                    {selectedIntern?.fullName || user?.name || 'Intern'} • {currentMonthConfig.label} Calendar Grid
                  </h3>
                  <p className="text-xs text-brand-slate">
                    7-Day weekly visual matrix (Mon–Wed WFO, Thu–Fri WFH, Sat–Sun Weekend Holiday)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                    <span className="font-semibold text-amber-300">Weekend Holiday (Off)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-sky-500" />
                    <span>Approved Leave</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-slate-700" />
                    <span>Not Recorded</span>
                  </div>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-brand-slate">
                <div className="py-1 text-blue-400 bg-blue-500/10 rounded">Mon (WFO)</div>
                <div className="py-1 text-blue-400 bg-blue-500/10 rounded">Tue (WFO)</div>
                <div className="py-1 text-blue-400 bg-blue-500/10 rounded">Wed (WFO)</div>
                <div className="py-1 text-emerald-400 bg-emerald-500/10 rounded">Thu (WFH)</div>
                <div className="py-1 text-emerald-400 bg-emerald-500/10 rounded">Fri (WFH)</div>
                <div className="py-1 text-amber-400 bg-amber-500/15 rounded border border-amber-500/30">Sat (Holiday)</div>
                <div className="py-1 text-amber-400 bg-amber-500/15 rounded border border-amber-500/30">Sun (Holiday)</div>
              </div>

              {/* Day Tiles */}
              <div className="grid grid-cols-7 gap-2">
                {/* Lead-in padding days for first week */}
                {(() => {
                  const firstDateStr = timelineRecords[0]?.date || `${currentMonthConfig.startDate}`;
                  const firstDay = new Date(firstDateStr + 'T00:00:00+05:30').getDay();
                  const leadPadding = (firstDay + 6) % 7;
                  return Array.from({ length: leadPadding }).map((_, i) => (
                    <div
                      key={`pad-${i}`}
                      className="min-h-[85px] rounded-xl bg-black/10 border border-white/5 opacity-30"
                    />
                  ));
                })()}

                {timelineRecords.map((r) => {
                  const d = new Date(r.date + 'T00:00:00+05:30');
                  const dayNum = d.getDate();
                  const dayIndex = d.getDay();
                  const isWeekend = dayIndex === 0 || dayIndex === 6;
                  const isPresent = r.status === 'Present';
                  const isLeave = r.status === 'Approved Leave';
                  const isPublicHoliday = r.scheduledWorkMode === 'Holiday';

                  return (
                    <div
                      key={r.id}
                      className={`min-h-[85px] p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isWeekend
                          ? 'bg-amber-500/[0.05] border-amber-500/30 text-amber-300'
                          : isPublicHoliday
                          ? 'bg-purple-500/[0.05] border-purple-500/30'
                          : isPresent
                          ? 'bg-emerald-500/[0.04] border-emerald-500/25'
                          : isLeave
                          ? 'bg-sky-500/[0.04] border-sky-500/25'
                          : 'bg-brand-dark-subtle border-brand-border/60'
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
                          <span className="text-[10px] font-bold text-sky-400">
                            Approved Leave
                          </span>
                        ) : isPublicHoliday ? (
                          <span className="text-[10px] font-bold text-purple-300">
                            Public Holiday
                          </span>
                        ) : (
                          <span className="text-[10px] text-brand-slate/60">Not Recorded</span>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="text-right flex items-center justify-end gap-1 pt-1 border-t border-white/5">
                          {onOpenManualAttendance && (
                            <button
                              onClick={() => onOpenManualAttendance(selectedIntern?.employeeId || '', r.date)}
                              className="text-[9px] text-sky-400 hover:underline"
                              title="Manual attendance"
                            >
                              Punch
                            </button>
                          )}
                          {onOpenCorrection && (
                            <button
                              onClick={() => onOpenCorrection(r)}
                              className="text-[9px] text-brand-slate hover:text-brand-ink hover:underline"
                              title="Audit edit"
                            >
                              Audit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
