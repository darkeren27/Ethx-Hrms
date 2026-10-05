import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  UserCheck, 
  ShieldCheck, 
  MapPin, 
  Laptop, 
  Search, 
  Filter, 
  Edit3, 
  History, 
  Info,
  Building2,
  FileSpreadsheet,
  CalendarCheck2,
  AlertCircle,
  Users,
  ListFilter,
  GraduationCap
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { hrmsService } from '../../services/hrmsService';
import { 
  AttendanceRecord, 
  Employee, 
  LeaveApplication, 
  ActualAttendanceStatus, 
  ActualWorkMode 
} from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { 
  isAuthorizedAttendanceLeaveAdmin, 
  INTERNSHIP_START_DATE, 
  INTERNSHIP_END_DATE,
  PersonnelCategoryFilter,
  getPersonnelCategory,
  getScheduledWorkMode
} from '../../services/attendanceScheduleService';
import { InternMonthlyAttendanceView } from './InternMonthlyAttendanceView';
import { EmployeeAttendanceView } from './EmployeeAttendanceView';
import { INITIAL_EMPLOYEES } from '../../lib/mockData';

export const AttendanceRosterPage: React.FC = () => {
  const { user } = useAuth();
  
  // Authorized HR Admin Check (ID-bound to Niky Sharma emp-005 / ETHX-005 or recognized identity)
  const isAdmin = isAuthorizedAttendanceLeaveAdmin(user?.id || user?.employeeId, user?.name);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [dailyRoster, setDailyRoster] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [isPunching, setIsPunching] = useState(false);
  const [punchFeedback, setPunchFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // View Mode: 'DailyRoster' (All 21 Personnel) vs 'AllRecords' (Historical Logs) vs 'InternMonthly' (Cohort 8)
  const [viewMode, setViewMode] = useState<'DailyRoster' | 'AllRecords' | 'InternMonthly'>('DailyRoster');
  const [selectedRosterDate, setSelectedRosterDate] = useState<string>('2026-09-28');

  // Robust Intern Self-Service Scope Check
  const isUserIntern =
    user?.engagementCategory === 'Intern' ||
    user?.designation === 'Unpaid Intern' ||
    (user?.name && user.name.toLowerCase().includes('krishna')) ||
    getPersonnelCategory(undefined, user?.name).key === 'Intern' ||
    (user?.employeeId &&
      [
        'emp-014', 'emp-015', 'emp-016', 'emp-017', 'emp-018', 'emp-019', 'emp-020', 'emp-021',
        'ETHX-014', 'ETHX-015', 'ETHX-016', 'ETHX-017', 'ETHX-018', 'ETHX-019', 'ETHX-020', 'ETHX-021',
      ].includes(user.employeeId));

  // Resolved Authenticated Full-Time Employee
  const loggedInEmployee = useMemo(() => {
    const list = employees && employees.length > 0 ? employees : INITIAL_EMPLOYEES;
    const match = list.find(
      (e) =>
        (user?.employeeId && (e.employeeId === user.employeeId || e.id === user.employeeId)) ||
        (user?.id && (e.employeeId === user.id || e.id === user.id)) ||
        (user?.name && e.fullName.toLowerCase() === user.name.toLowerCase())
    );
    if (match) return match;
    const fallback = INITIAL_EMPLOYEES.find(
      (e) =>
        (user?.employeeId && (e.employeeId === user.employeeId || e.id === user.employeeId)) ||
        (user?.id && (e.employeeId === user.id || e.id === user.id)) ||
        (user?.name && e.fullName.toLowerCase() === user.name.toLowerCase())
    );
    if (fallback) return fallback;
    const kt = INITIAL_EMPLOYEES.find((e) => e.id === 'emp-021' || e.employeeId === 'ETHX-021');
    return kt || list[0] || INITIAL_EMPLOYEES[0];
  }, [employees, user]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PersonnelCategoryFilter>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [modeFilter, setModeFilter] = useState<string>('All');
  const [startDateFilter, setStartDateFilter] = useState<string>('2026-07-01');
  const [endDateFilter, setEndDateFilter] = useState<string>('2026-09-30');

  // Modals
  const [selectedTimelineEmp, setSelectedTimelineEmp] = useState<Employee | null>(null);
  const [timelineRecords, setTimelineRecords] = useState<AttendanceRecord[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editFormData, setEditFormData] = useState<{
    status: ActualAttendanceStatus;
    checkIn: string;
    checkOut: string;
    workHours: number;
    actualWorkMode: ActualWorkMode;
    reason: string;
  }>({
    status: 'Present',
    checkIn: '09:00 AM',
    checkOut: '06:00 PM',
    workHours: 8.0,
    actualWorkMode: 'WFO',
    reason: '',
  });
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);

  // Manual Attendance Modal State (Niky Sharma HR Authority)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualFormData, setManualFormData] = useState<{
    employeeId: string;
    date: string;
    status: ActualAttendanceStatus;
    actualWorkMode: ActualWorkMode;
    checkIn: string;
    checkOut: string;
    workHours: number;
    reason: string;
  }>({
    employeeId: 'ETHX-008',
    date: '2026-09-28',
    status: 'Present',
    actualWorkMode: 'WFO',
    checkIn: '09:00 AM',
    checkOut: '06:00 PM',
    workHours: 8.0,
    reason: '',
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const loadData = async () => {
    try {
      const callerId = user?.employeeId || user?.id || 'ETHX-005';
      const callerName = user?.name || 'Niky Sharma';
      const [fetchedRecords, fetchedEmployees, fetchedLeaves, fetchedDaily] = await Promise.all([
        hrmsService.getAttendanceRecords(callerId, callerName),
        hrmsService.getEmployees(),
        hrmsService.getLeaveApplications(callerId),
        hrmsService.getDailyOrganizationRoster(selectedRosterDate, callerId, callerName),
      ]);
      setRecords(fetchedRecords);
      setEmployees(fetchedEmployees);
      setLeaves(fetchedLeaves);
      setDailyRoster(fetchedDaily);
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Failed to load attendance records.');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Reload daily roster when selectedRosterDate changes
  useEffect(() => {
    const callerId = user?.employeeId || user?.id || 'ETHX-005';
    const callerName = user?.name || 'Niky Sharma';
    hrmsService.getDailyOrganizationRoster(selectedRosterDate, callerId, callerName).then((res) => {
      if (res && res.length > 0) setDailyRoster(res);
    }).catch(() => {});
  }, [selectedRosterDate, user]);

  const handlePunch = async (type: 'IN' | 'OUT') => {
    setIsPunching(true);
    setErrorFeedback(null);
    try {
      const rec = await hrmsService.punchAttendance(
        user?.employeeId || 'ETHX-005',
        user?.name || 'Niky Sharma',
        user?.department || 'Human Resources',
        type
      );
      setPunchFeedback(`Successfully logged punch ${type} at ${rec.checkIn || rec.checkOut}!`);
      await loadData();
      setTimeout(() => setPunchFeedback(null), 4000);
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Failed to register punch.');
      setTimeout(() => setErrorFeedback(null), 5000);
    } finally {
      setIsPunching(false);
    }
  };

  // Open individual day-wise calendar timeline
  const handleOpenTimeline = async (emp: Employee) => {
    if (!isAdmin && emp.employeeId !== user?.employeeId && emp.id !== user?.id) {
      setErrorFeedback('Access Denied: Only designated HR administrator (Niky Sharma) can view other personnel history.');
      return;
    }
    setSelectedTimelineEmp(emp);
    setIsTimelineLoading(true);
    try {
      const callerId = user?.id || user?.employeeId || '';
      const history = await hrmsService.getAttendanceHistory(callerId, emp.employeeId, startDateFilter, endDateFilter);
      setTimelineRecords(history);
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Failed to generate attendance timeline.');
    } finally {
      setIsTimelineLoading(false);
    }
  };

  // Open correction modal
  const handleOpenCorrection = (record: AttendanceRecord) => {
    if (!isAdmin) {
      setErrorFeedback('Permission Denied: Only designated HR administrator (Niky Sharma) can make authorized attendance corrections.');
      return;
    }
    setEditingRecord(record);
    setEditFormData({
      status: record.status as ActualAttendanceStatus,
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
      workHours: record.workHours || 8,
      actualWorkMode: (record.actualWorkMode as ActualWorkMode) || (record.scheduledWorkMode === 'WFH' ? 'WFH' : 'WFO'),
      reason: '',
    });
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!editFormData.reason.trim()) {
      setErrorFeedback('Validation Error: A mandatory justification reason is required for attendance correction.');
      return;
    }
    setIsSavingCorrection(true);
    try {
      const callerId = user?.id || user?.employeeId || '';
      await hrmsService.correctAttendance(
        editingRecord.id,
        {
          status: editFormData.status,
          checkIn: editFormData.checkIn || null,
          checkOut: editFormData.checkOut || null,
          workHours: Number(editFormData.workHours),
          actualWorkMode: editFormData.actualWorkMode,
          reason: editFormData.reason.trim(),
        },
        callerId
      );
      setPunchFeedback(`Attendance record #${editingRecord.id} successfully updated with audit history.`);
      setEditingRecord(null);
      await loadData();
      if (selectedTimelineEmp) {
        const history = await hrmsService.getAttendanceHistory(
          callerId,
          selectedTimelineEmp.employeeId,
          startDateFilter,
          endDateFilter
        );
        setTimelineRecords(history);
      }
      setTimeout(() => setPunchFeedback(null), 4000);
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Failed to save attendance correction.');
    } finally {
      setIsSavingCorrection(false);
    }
  };

  // Open manual attendance modal prefilled for a specific employee
  const handleOpenManualForEmployee = (
    empId: string,
    dateStr: string,
    currentStatus?: ActualAttendanceStatus,
    currentMode?: ActualWorkMode
  ) => {
    if (!isAdmin) {
      setErrorFeedback('Permission Denied: Only designated HR administrator (Niky Sharma) can mark manual attendance.');
      return;
    }
    const matched = employees.find((e) => e.employeeId === empId || e.id === empId);
    const isIntern = matched?.engagementCategory === 'Intern';
    const scheduled = getScheduledWorkMode(dateStr, isIntern);

    setManualFormData({
      employeeId: empId,
      date: dateStr,
      status: currentStatus && currentStatus !== 'Not Recorded' ? currentStatus : 'Present',
      actualWorkMode: currentMode || (scheduled.mode === 'WFH' ? 'WFH' : 'WFO'),
      checkIn: '09:00 AM',
      checkOut: '06:00 PM',
      workHours: 8.0,
      reason: '',
    });
    setIsManualModalOpen(true);
  };

  // Save manual attendance entry with mandatory HR justification
  const handleSaveManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFormData.reason.trim()) {
      setErrorFeedback('Validation Error: A mandatory justification reason is required for manual attendance entry.');
      return;
    }
    setIsSubmittingManual(true);
    try {
      const callerId = user?.employeeId || user?.id || 'ETHX-005';
      const targetEmp = employees.find(
        (e) => e.employeeId === manualFormData.employeeId || e.id === manualFormData.employeeId
      );
      const result = await hrmsService.markManualAttendance(
        manualFormData.employeeId,
        manualFormData.date,
        {
          status: manualFormData.status,
          actualWorkMode: manualFormData.actualWorkMode,
          checkIn: manualFormData.checkIn || null,
          checkOut: manualFormData.checkOut || null,
          workHours: Number(manualFormData.workHours) || 8.0,
          reason: manualFormData.reason.trim(),
        },
        callerId
      );
      setPunchFeedback(
        `Manual attendance for ${targetEmp?.fullName || result.employeeName} on ${result.date} successfully recorded by Niky Sharma.`
      );
      setIsManualModalOpen(false);
      await loadData();
      setTimeout(() => setPunchFeedback(null), 4000);
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Failed to record manual attendance.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Export filtered roster to CSV
  const handleExportCSV = () => {
    if (!isAdmin) {
      setErrorFeedback('Permission Denied: Only designated HR administrator (Niky Sharma) can export attendance records.');
      return;
    }
    const headers = [
      'Record ID',
      'Employee ID',
      'Employee Name',
      'Category',
      'Department',
      'Date',
      'Scheduled Work Mode',
      'Actual Attendance Status',
      'Actual Work Mode',
      'Check In',
      'Check Out',
      'Logged Hours',
      'Coverage Status',
      'Conflict Details',
      'Remarks',
    ];

    const rows = filteredRecords.map((r) => {
      const emp = employees.find((e) => e.employeeId === r.employeeId || e.id === r.employeeId);
      return [
        `"${r.id}"`,
        `"${r.employeeId}"`,
        `"${r.employeeName}"`,
        `"${emp?.engagementCategory || 'Staff'}"`,
        `"${r.department || ''}"`,
        `"${r.date}"`,
        `"${r.scheduledWorkMode || 'Standard'}"`,
        `"${r.status}"`,
        `"${r.actualWorkMode || 'Not Recorded'}"`,
        `"${r.checkIn || 'Not recorded'}"`,
        `"${r.checkOut || 'Not recorded'}"`,
        `"${r.workHours || 0}"`,
        `"${r.dataCoverage || 'Recorded'}"`,
        `"${(r.conflictDetails || '').replace(/"/g, '""')}"`,
        `"${(r.remarks || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ETHX_Attendance_Roster_${viewMode === 'DailyRoster' ? selectedRosterDate : startDateFilter + '_to_' + endDateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Source list depending on viewMode (Daily Roster has all 21 people; AllRecords has historical punches)
  const sourceRecords = useMemo(() => {
    if (!isAdmin) {
      // Non-admin sees ONLY their personal records
      return records.filter((r) => r.employeeId === user?.employeeId || r.employeeId === user?.id);
    }
    // For HR Admin, viewMode determines whether we show the Daily 21-person roster or the full historical ledger
    if (viewMode === 'DailyRoster') {
      if (dailyRoster.length >= 21) return dailyRoster;
      const dateRecords = records.filter((r) => r.date === selectedRosterDate);
      if (dateRecords.length >= 21) return dateRecords;
      return dailyRoster.length > 0 ? dailyRoster : records;
    }
    return records;
  }, [isAdmin, viewMode, dailyRoster, records, user, selectedRosterDate]);

  // Filtered Records (Strictly scoped by backend, refined by UI filters)
  const filteredRecords = useMemo(() => {
    return sourceRecords.filter((r) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = r.employeeName?.toLowerCase().includes(query);
        const matchesId = r.employeeId?.toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }

      // 2. Personnel Category Filter (Exact match on all verified 6 groups)
      if (categoryFilter !== 'All') {
        const matchedEmp = employees.find((e) => e.employeeId === r.employeeId || e.id === r.employeeId);
        const catInfo = getPersonnelCategory(matchedEmp, r.employeeName);
        if (catInfo.key !== categoryFilter) return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;

      // 4. Work Mode Filter
      if (modeFilter !== 'All') {
        if (modeFilter === 'Scheduled WFO' && r.scheduledWorkMode !== 'WFO') return false;
        if (modeFilter === 'Scheduled WFH' && r.scheduledWorkMode !== 'WFH') return false;
        if (modeFilter === 'Actual WFO' && r.actualWorkMode !== 'WFO') return false;
        if (modeFilter === 'Actual WFH' && r.actualWorkMode !== 'WFH') return false;
      }

      // 5. Date Range (only applied in AllRecords historical view)
      if (viewMode === 'AllRecords') {
        if (startDateFilter && r.date < startDateFilter) return false;
        if (endDateFilter && r.date > endDateFilter) return false;
      }

      return true;
    });
  }, [sourceRecords, employees, searchQuery, categoryFilter, statusFilter, modeFilter, viewMode, startDateFilter, endDateFilter]);

  // Dynamic Reconciled Summary Counts
  const totalCount = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === 'Present').length;
  const absentCount = filteredRecords.filter((r) => r.status === 'Absent').length;
  const leaveCount = filteredRecords.filter((r) => r.status === 'Approved Leave').length;
  const offHolidayCount = filteredRecords.filter((r) => r.status === 'Weekly Off' || r.status === 'Holiday').length;
  const notRecordedCount = filteredRecords.filter((r) => r.status === 'Not Recorded').length;
  const conflictsCount = filteredRecords.filter((r) => !!r.conflictDetails).length;

  const recordedDaysCount = totalCount - notRecordedCount;
  const dataCoveragePercent = totalCount > 0 ? ((recordedDaysCount / totalCount) * 100).toFixed(1) : '100.0';

  // Personal user metrics for employee view
  const userRecords = records.filter(
    (r) => r.employeeId === user?.employeeId || r.employeeId === user?.id
  );
  const userRecordedDays = userRecords.filter((r) => r.status !== 'Not Recorded').length;
  const userPresentDays = userRecords.filter((r) => r.status === 'Present').length;
  const userAttendanceRate =
    userRecordedDays > 0 ? ((userPresentDays / userRecordedDays) * 100).toFixed(1) + '%' : '100%';
  const userTotalHours = userRecords
    .filter((r) => r.workHours && r.status === 'Present')
    .reduce((sum, r) => sum + (r.workHours || 0), 0)
    .toFixed(1);

  const internEmployees = useMemo(() => {
    const source = employees && employees.length > 0 ? employees : INITIAL_EMPLOYEES;
    const allInterns = source.filter(
      (e) =>
        e.engagementCategory === 'Intern' ||
        e.designation === 'Unpaid Intern' ||
        e.employeeId.startsWith('ETHX-INT-') ||
        [
          'emp-014', 'emp-015', 'emp-016', 'emp-017', 'emp-018', 'emp-019', 'emp-020', 'emp-021',
          'ETHX-014', 'ETHX-015', 'ETHX-016', 'ETHX-017', 'ETHX-018', 'ETHX-019', 'ETHX-020', 'ETHX-021',
        ].includes(e.employeeId) ||
        [
          'emp-014', 'emp-015', 'emp-016', 'emp-017', 'emp-018', 'emp-019', 'emp-020', 'emp-021',
        ].includes(e.id)
    );
    if (!isAdmin) {
      // Security & Privacy: Employees and Interns see strictly their own records ONLY
      const selfIntern =
        allInterns.find(
          (i) =>
            (user?.employeeId && (i.employeeId === user.employeeId || i.id === user.employeeId)) ||
            (user?.id && (i.employeeId === user.id || i.id === user.id)) ||
            (user?.name && i.fullName.toLowerCase() === user.name.toLowerCase())
        ) ||
        allInterns.find((i) => i.id === 'emp-021' || i.employeeId === 'ETHX-021') ||
        allInterns[0];

      return selfIntern ? [selfIntern] : allInterns;
    }
    return allInterns;
  }, [employees, isAdmin, user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Access Control Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-ink">
              {isAdmin ? 'Attendance & Biometrics Command Roster' : 'My Attendance & Shift Ledger'}
            </h1>
            {isAdmin ? (
              <Badge variant="red" dot>
                Niky Sharma Authorized HR Admin
              </Badge>
            ) : (
              <Badge variant="neutral">
                Personal Ledger Scoped ({user?.employeeId || user?.id})
              </Badge>
            )}
          </div>
          <p className="text-sm text-brand-slate mt-1">
            {isAdmin
              ? 'Organization-wide verified punches across all 21 employees and interns, scheduled vs actual modes, audit corrections, and conflict resolution.'
              : 'Self-service shift timestamps, scheduled work modes, and web check-in logs.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setManualFormData({
                  employeeId: employees[0]?.employeeId || 'ETHX-INT-008',
                  date: selectedRosterDate || '2026-09-28',
                  status: 'Present',
                  actualWorkMode: 'WFO',
                  checkIn: '09:00 AM',
                  checkOut: '06:00 PM',
                  workHours: 8.0,
                  reason: '',
                });
                setIsManualModalOpen(true);
              }}
              className="flex items-center gap-1.5 border-brand-red/50 text-brand-red hover:bg-brand-red/10 font-bold"
            >
              <UserCheck className="w-4 h-4 text-brand-red" />
              Mark Manual Attendance
            </Button>
          )}

          {isAdmin && viewMode !== 'InternMonthly' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Export Scope CSV
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePunch('OUT')}
            isLoading={isPunching}
          >
            Punch Out
          </Button>

          <Button
            size="sm"
            onClick={() => handlePunch('IN')}
            isLoading={isPunching}
          >
            Web Check-in
          </Button>
        </div>
      </div>

      {/* View Mode Selector Tabs (For HR Admin) */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-brand-card rounded-xl border border-brand-border">
          <div className="flex flex-wrap items-center gap-1.5 bg-brand-dark p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setViewMode('DailyRoster')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'DailyRoster'
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-brand-ink hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Daily Company Roster (All 21 Personnel)
            </button>
            <button
              onClick={() => setViewMode('AllRecords')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'AllRecords'
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-brand-ink hover:bg-white/5'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              All Historical Logs ({records.length} Synchronized Records)
            </button>
            <button
              onClick={() => setViewMode('InternMonthly')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'InternMonthly'
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-brand-ink hover:bg-white/5'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              Intern Month-Wise Records (8 Cohort)
            </button>
          </div>

          {/* Date Picker for Daily Roster */}
          {viewMode === 'DailyRoster' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-brand-slate uppercase tracking-wider">Selected Date:</span>
              <input
                type="date"
                value={selectedRosterDate}
                onChange={(e) => setSelectedRosterDate(e.target.value)}
                className="bg-brand-dark-subtle border border-brand-border rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-brand-ink focus:outline-none focus:border-brand-red"
              />
            </div>
          )}
        </div>
      )}


      {/* Notifications */}
      {punchFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{punchFeedback}</span>
        </div>
      )}

      {errorFeedback && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* Conflicts Banner */}
      {isAdmin && conflictsCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold block">
                {conflictsCount} Attendance & Leave Ledger Conflict{conflictsCount > 1 ? 's' : ''} Detected
              </span>
              <span className="text-brand-slate text-[11px]">
                Punch registered on an approved leave date. Records have been flagged below for HR audit resolution.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setStatusFilter('Approved Leave')}
            className="text-xs"
          >
            Filter Conflicts
          </Button>
        </div>
      )}

      {/* Data Availability / Honest Historical Record Indicator */}
      <div className="p-3.5 rounded-xl bg-brand-dark-subtle/80 border border-brand-border text-brand-slate text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>
            <strong className="text-brand-ink">Data Availability Notice:</strong> Historical attendance tracking prior to current tracking period is marked honestly as <em>&quot;Not recorded&quot;</em>. Unknown joining dates remain unverified to prevent fabricated salaries or disciplinary deductions.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-brand-slate">Internship Active Scope:</span>
          <Badge variant="neutral">1 Jul 2026 – 30 Sep 2026</Badge>
        </div>
      </div>

      {/* Dynamic View: Month-Wise Intern Cohort Record vs 2-3 Year Employee Career View vs Admin Roster */}
      {isAdmin && viewMode === 'InternMonthly' ? (
        <InternMonthlyAttendanceView
          interns={internEmployees}
          allAttendance={records}
          allLeaves={leaves}
          isAdmin={true}
          onOpenCorrection={handleOpenCorrection}
          onOpenManualAttendance={handleOpenManualForEmployee}
        />
      ) : !isAdmin && isUserIntern ? (
        <InternMonthlyAttendanceView
          interns={internEmployees}
          allAttendance={records}
          allLeaves={leaves}
          isAdmin={false}
          defaultInternId={user?.employeeId || user?.id}
          onOpenCorrection={handleOpenCorrection}
          onOpenManualAttendance={handleOpenManualForEmployee}
        />
      ) : !isAdmin && !isUserIntern ? (
        <EmployeeAttendanceView
          employee={loggedInEmployee}
          allAttendance={records}
          allLeaves={leaves}
          onRefreshData={loadData}
        />
      ) : (
        <>
          {/* Summary KPI Strip */}
          {isAdmin ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                title={viewMode === 'DailyRoster' ? 'Active Personnel' : 'Total Records'}
            value={totalCount.toString()}
            subtitle={viewMode === 'DailyRoster' ? `Full roster on ${selectedRosterDate}` : 'Filtered historical records'}
            icon={Calendar}
            variant="default"
          />
          <StatCard
            title="Present"
            value={presentCount.toString()}
            subtitle="Verified punches"
            icon={CheckCircle}
            variant="emerald"
          />
          <StatCard
            title="Absent"
            value={absentCount.toString()}
            subtitle="Documented absence"
            icon={AlertTriangle}
            variant="red"
          />
          <StatCard
            title="Approved Leave"
            value={leaveCount.toString()}
            subtitle="HR/Director synchronized"
            icon={CalendarCheck2}
            variant="blue"
          />
          <StatCard
            title="Weekly Off / Hol."
            value={offHolidayCount.toString()}
            subtitle="Weekend & scheduled off"
            icon={Building2}
            variant="default"
          />
          <StatCard
            title="Data Coverage"
            value={`${dataCoveragePercent}%`}
            subtitle={`${notRecordedCount} unrecorded`}
            icon={UserCheck}
            variant="default"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Attendance Rate"
            value={userAttendanceRate}
            subtitle={`Basis: ${userPresentDays} of ${userRecordedDays || 1} recorded shifts`}
            icon={Clock}
            variant="emerald"
          />
          <StatCard
            title="Logged Work Hours"
            value={`${userTotalHours} hrs`}
            subtitle="From verified punches only"
            icon={CheckCircle}
            variant="blue"
          />
          <StatCard
            title="Scheduled Mode"
            value={user?.workLocation || 'WFO (Mon-Wed) / WFH (Thu-Fri)'}
            subtitle="Asia/Kolkata Work Calendar"
            icon={Laptop}
            variant="default"
          />
          <StatCard
            title="Account Scope"
            value={user?.employeeId || 'ETHX'}
            subtitle="Single Personal Identity"
            icon={UserCheck}
            variant="red"
          />
        </div>
      )}

      {/* Admin Filters & Search Control Bar */}
      {isAdmin && (
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-slate mb-1">
                Search Personnel
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-slate mb-1">
                Personnel Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red font-medium"
              >
                <option value="All">All Personnel (21 Master Roster)</option>
                <option value="Intern">Unpaid Interns (8 Cohort)</option>
                <option value="Employee">Permanent Staff (5)</option>
                <option value="HR">HR Administration (2 - Niky & Madhavi)</option>
                <option value="IT Leadership">IT Leadership (1 - Siva Kumar)</option>
                <option value="Company Director">Company Directors (3 - Ram, Rohan, Virender)</option>
                <option value="Contract">Contract Staff (2 - Archit & Rajnesh)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-slate mb-1">
                Attendance Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Approved Leave">Approved Leave</option>
                <option value="Weekly Off">Weekly Off</option>
                <option value="Holiday">Holiday</option>
                <option value="Not Recorded">Not Recorded</option>
              </select>
            </div>

            {/* Work Mode Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-slate mb-1">
                Work Mode
              </label>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              >
                <option value="All">All Modes</option>
                <option value="Scheduled WFO">Scheduled WFO</option>
                <option value="Scheduled WFH">Scheduled WFH</option>
                <option value="Actual WFO">Actual WFO</option>
                <option value="Actual WFH">Actual WFH</option>
              </select>
            </div>

            {/* Date Range Reset */}
            <div className="flex items-end">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All');
                  setStatusFilter('All');
                  setModeFilter('All');
                  setStartDateFilter('2026-07-01');
                  setEndDateFilter('2026-09-30');
                  setSelectedRosterDate('2026-09-28');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Attendance Roster Table */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle>
              {isAdmin
                ? viewMode === 'DailyRoster'
                  ? `Daily Company Shift Roster: ${selectedRosterDate}`
                  : 'Company Historical Attendance Ledger'
                : 'My Daily Attendance Ledger'}
            </CardTitle>
            <p className="text-[11px] text-brand-slate mt-0.5">
              {isAdmin
                ? viewMode === 'DailyRoster'
                  ? `Displaying all ${filteredRecords.length} personnel on ${selectedRosterDate} • 8 Interns, 5 Staff, 2 HR, 1 IT Lead, 3 Directors, 2 Contract`
                  : `Showing ${filteredRecords.length} synchronized ledger records across all 21 personnel`
                : `Showing ${filteredRecords.length} personal shift records`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-brand-slate">Showing Scope:</span>
            <Badge variant="neutral">
              {isAdmin ? '21 Master Personnel' : `${user?.name} (${user?.employeeId})`}
            </Badge>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-dark-subtle border-b border-brand-border text-brand-slate uppercase tracking-wider font-bold">
                {isAdmin && <th className="py-3 px-4">Personnel</th>}
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Scheduled Mode</th>
                <th className="py-3 px-4">Actual Status</th>
                <th className="py-3 px-4">Actual Mode</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Logged Hours</th>
                <th className="py-3 px-4">Data Coverage</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 10 : 8}
                    className="py-12 text-center text-brand-slate"
                  >
                    <Clock className="w-8 h-8 mx-auto text-brand-slate/40 mb-2" />
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const emp = employees.find(
                    (e) => e.employeeId === r.employeeId || e.id === r.employeeId
                  );
                  const catInfo = getPersonnelCategory(emp, r.employeeName);
                  const displayDept = emp?.department && emp.department !== 'Not provided' ? emp.department : r.department;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-brand-card-hover transition-colors ${
                        r.conflictDetails ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-brand-ink">{r.employeeName}</span>
                                <Badge variant={catInfo.badgeVariant} className="text-[10px] py-0 px-1.5 font-bold">
                                  {catInfo.label}
                                </Badge>
                              </div>
                              <span className="text-[11px] font-mono text-brand-slate">
                                {r.employeeId} • {displayDept}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="py-3 px-4 font-mono font-medium text-brand-slate whitespace-nowrap">
                        {r.date}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            r.scheduledWorkMode === 'WFO'
                              ? 'red'
                              : r.scheduledWorkMode === 'WFH'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {r.scheduledWorkMode || 'Standard'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <Badge variant={getStatusBadgeVariant(r.status)} dot>
                            {r.status}
                          </Badge>
                          {r.conflictDetails && (
                            <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              Conflict Detected
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-brand-slate">
                        {r.actualWorkMode ? (
                          <span className="font-medium text-brand-ink">{r.actualWorkMode}</span>
                        ) : (
                          <span className="text-brand-slate/50">Not recorded</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-brand-ink">
                        {r.checkIn || <span className="text-brand-slate/50">Not recorded</span>}
                      </td>

                      <td className="py-3 px-4 font-mono text-brand-slate">
                        {r.checkOut || <span className="text-brand-slate/50">—</span>}
                      </td>

                      <td className="py-3 px-4 font-semibold text-brand-ink">
                        {r.workHours ? `${r.workHours}h` : '—'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-medium ${
                            r.dataCoverage === 'Not Recorded'
                              ? 'text-amber-400/80 italic'
                              : r.dataCoverage === 'Pending'
                              ? 'text-sky-400 italic'
                              : 'text-emerald-400'
                          }`}
                        >
                          {r.dataCoverage || 'Recorded'}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {emp && (
                              <button
                                onClick={() => handleOpenTimeline(emp)}
                                className="p-1 rounded bg-brand-dark hover:bg-brand-red/20 text-brand-slate hover:text-brand-red transition-colors"
                                title="Open Day-wise Attendance History"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() =>
                                handleOpenManualForEmployee(
                                  r.employeeId,
                                  r.date,
                                  r.status,
                                  r.actualWorkMode
                                )
                              }
                              className="p-1 rounded bg-brand-dark hover:bg-sky-500/20 text-brand-slate hover:text-sky-400 transition-colors"
                              title="Mark / Adjust Manual Attendance"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenCorrection(r)}
                              className="p-1 rounded bg-brand-dark hover:bg-emerald-500/20 text-brand-slate hover:text-emerald-400 transition-colors"
                              title="Make Authorized Correction (Audit Trail)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
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
      </>
      )}

      {/* Individual Day-Wise Calendar Drawer / Modal */}
      {selectedTimelineEmp && (
        <Modal
          isOpen={!!selectedTimelineEmp}
          onClose={() => setSelectedTimelineEmp(null)}
          title={`Day-Wise Attendance Calendar: ${selectedTimelineEmp.fullName}`}
          subtitle={`${selectedTimelineEmp.employeeId} • ${selectedTimelineEmp.engagementCategory} • ${selectedTimelineEmp.department}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-brand-dark-subtle border border-brand-border rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between text-brand-slate">
                <span>Engagement Period:</span>
                <span className="font-semibold text-brand-ink">
                  {selectedTimelineEmp.engagementCategory === 'Intern'
                    ? '1 July 2026 – 30 September 2026'
                    : 'Verified Personnel Active Range (2+ Years Tenure)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-brand-slate">
                <span>Scheduled Work Policy:</span>
                <span className="font-semibold text-brand-ink">
                  {selectedTimelineEmp.engagementCategory === 'Intern'
                    ? 'Mon-Wed: WFO | Thu-Fri: WFH | Sat-Sun: Off'
                    : 'Standard On-Premises Pune HQ'}
                </span>
              </div>
            </div>

            {isTimelineLoading ? (
              <div className="py-12 text-center text-brand-slate text-xs">
                Generating verified calendar timeline...
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border border-brand-border rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-brand-dark-subtle sticky top-0 border-b border-brand-border">
                    <tr className="text-brand-slate uppercase font-bold text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Scheduled Mode</th>
                      <th className="py-2.5 px-3">Actual Status</th>
                      <th className="py-2.5 px-3">Punches</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {timelineRecords.map((t) => (
                      <tr key={t.date} className="hover:bg-brand-card-hover transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-brand-slate">
                          {t.date}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              t.scheduledWorkMode === 'WFO'
                                ? 'red'
                                : t.scheduledWorkMode === 'WFH'
                                ? 'info'
                                : 'neutral'
                            }
                            className="text-[10px]"
                          >
                            {t.scheduledWorkMode}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={getStatusBadgeVariant(t.status)} dot className="text-[10px]">
                            {t.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-brand-slate text-[11px]">
                          {t.checkIn ? `${t.checkIn} - ${t.checkOut || 'Active'}` : 'Not recorded'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isAdmin && (
                            <button
                              onClick={() => {
                                handleOpenCorrection(t);
                              }}
                              className="text-brand-red hover:underline text-[11px]"
                            >
                              Correct
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedTimelineEmp(null)}
              >
                Close Calendar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Authorized Attendance Correction Modal (Niky Sharma Only) */}
      {editingRecord && (
        <Modal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          title="Authorized Attendance Correction"
          subtitle={`Employee: ${editingRecord.employeeName} (${editingRecord.employeeId}) • Date: ${editingRecord.date}`}
        >
          <form onSubmit={handleSaveCorrection} className="space-y-4">
            <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-lg text-xs text-brand-red">
              <strong className="block mb-0.5">Mandatory Audit Logging:</strong>
              This correction will be permanently logged under Niky Sharma&apos;s HR account with timestamp, previous status, and the mandatory reason.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                  Attendance Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      status: e.target.value as ActualAttendanceStatus,
                    })
                  }
                  className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-2.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Approved Leave">Approved Leave</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Weekly Off">Weekly Off</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Not Recorded">Not Recorded</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                  Actual Work Mode
                </label>
                <select
                  value={editFormData.actualWorkMode}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      actualWorkMode: e.target.value as ActualWorkMode,
                    })
                  }
                  className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-2.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                >
                  <option value="WFO">Work From Office (WFO)</option>
                  <option value="WFH">Work From Home (WFH)</option>
                  <option value="Not Recorded">Not Recorded</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Check In"
                placeholder="09:00 AM"
                value={editFormData.checkIn}
                onChange={(e) => setEditFormData({ ...editFormData, checkIn: e.target.value })}
              />
              <Input
                label="Check Out"
                placeholder="06:00 PM"
                value={editFormData.checkOut}
                onChange={(e) => setEditFormData({ ...editFormData, checkOut: e.target.value })}
              />
              <Input
                label="Work Hours"
                type="number"
                step="0.5"
                value={editFormData.workHours}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, workHours: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                Mandatory Justification Reason <span className="text-brand-red">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={editFormData.reason}
                onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                placeholder="Provide official justification for this correction (e.g. Turnstile card read failure verified with Pune security logs)..."
                className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              />
            </div>

            {editingRecord.correctionHistory && editingRecord.correctionHistory.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-[11px] font-semibold text-brand-slate uppercase block mb-1.5">
                  Previous Audit History:
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto text-[11px] text-brand-slate">
                  {editingRecord.correctionHistory.map((h, idx) => (
                    <div key={idx} className="p-2 bg-brand-dark rounded border border-brand-border">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span>{h.actor}</span>
                        <span>{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-brand-ink font-medium mt-0.5">
                        {h.previousStatus} → {h.newStatus}
                      </div>
                      <div className="text-brand-slate italic mt-0.5">&quot;{h.reason}&quot;</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingRecord(null)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSavingCorrection}>
                Save Authorized Correction
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mark Manual Attendance Modal (Niky Sharma HR Administration) */}
      {isManualModalOpen && (
        <Modal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          title="Mark Manual Attendance (HR Administration)"
          subtitle="Authorized by Niky Sharma (emp-005 / ETHX-005) • Biometric Override & Direct Roster Entry"
        >
          <form onSubmit={handleSaveManualAttendance} className="space-y-4">
            <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-lg text-xs text-brand-red">
              <strong className="block mb-0.5">Authorized HR Biometric &amp; Shift Override:</strong>
              As designated HR Administrator, you can manually mark or adjust attendance for any of the 21 employees or interns. This entry will be permanently logged with Niky Sharma&apos;s audit trail.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                  Select Personnel (21 Master Roster) <span className="text-brand-red">*</span>
                </label>
                <select
                  value={manualFormData.employeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const matched = employees.find((emp) => emp.employeeId === empId || emp.id === empId);
                    const isIntern = matched?.engagementCategory === 'Intern';
                    const scheduled = getScheduledWorkMode(manualFormData.date, isIntern);
                    setManualFormData({
                      ...manualFormData,
                      employeeId: empId,
                      actualWorkMode: scheduled.mode === 'WFH' ? 'WFH' : 'WFO',
                    });
                  }}
                  className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-2.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red font-medium"
                >
                  <optgroup label="Unpaid Interns (8 Cohort Members)">
                    {employees
                      .filter((e) => e.engagementCategory === 'Intern' || e.employeeId.startsWith('ETHX-INT-'))
                      .map((e) => (
                        <option key={e.id} value={e.employeeId}>
                          {e.fullName} ({e.employeeId}) • Intern
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Permanent Staff (5)">
                    {employees
                      .filter(
                        (e) =>
                          e.engagementCategory === 'Employee' &&
                          !e.workLocation?.includes('WFH') &&
                          !['Archit Sharma', 'Rajnesh'].includes(e.fullName)
                      )
                      .map((e) => (
                        <option key={e.id} value={e.employeeId}>
                          {e.fullName} ({e.employeeId}) • Staff
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="HR Administration (2)">
                    {employees
                      .filter(
                        (e) =>
                          e.engagementCategory === 'HR' || ['Niky Sharma', 'Madhavi Singh'].includes(e.fullName)
                      )
                      .map((e) => (
                        <option key={e.id} value={e.employeeId}>
                          {e.fullName} ({e.employeeId}) • HR
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="IT Leadership & Directors (4)">
                    {employees
                      .filter(
                        (e) =>
                          e.engagementCategory === 'IT Leadership' || e.engagementCategory === 'Company Director'
                      )
                      .map((e) => (
                        <option key={e.id} value={e.employeeId}>
                          {e.fullName} ({e.employeeId}) • {e.engagementCategory}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Contract Staff (2)">
                    {employees
                      .filter(
                        (e) =>
                          e.employmentArrangement === 'Contract' || ['Archit Sharma', 'Rajnesh'].includes(e.fullName)
                      )
                      .map((e) => (
                        <option key={e.id} value={e.employeeId}>
                          {e.fullName} ({e.employeeId}) • Contract
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                  Shift Date <span className="text-brand-red">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={manualFormData.date}
                  onChange={(e) => setManualFormData({ ...manualFormData, date: e.target.value })}
                  className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-2.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                  Attendance Status <span className="text-brand-red">*</span>
                </label>
                <select
                  value={manualFormData.status}
                  onChange={(e) =>
                    setManualFormData({
                      ...manualFormData,
                      status: e.target.value as ActualAttendanceStatus,
                    })
                  }
                  className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-2.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Late">Late</option>
                  <option value="Approved Leave">Approved Leave</option>
                  <option value="Weekly Off">Weekly Off</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                  Actual Work Mode
                </label>
                <select
                  value={manualFormData.actualWorkMode}
                  onChange={(e) =>
                    setManualFormData({
                      ...manualFormData,
                      actualWorkMode: e.target.value as ActualWorkMode,
                    })
                  }
                  className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-2.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                >
                  <option value="WFO">Work From Office (WFO - Pune HQ)</option>
                  <option value="WFH">Work From Home (WFH - Remote)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Check In"
                placeholder="09:00 AM"
                value={manualFormData.checkIn}
                onChange={(e) => setManualFormData({ ...manualFormData, checkIn: e.target.value })}
              />
              <Input
                label="Check Out"
                placeholder="06:00 PM"
                value={manualFormData.checkOut}
                onChange={(e) => setManualFormData({ ...manualFormData, checkOut: e.target.value })}
              />
              <Input
                label="Logged Work Hours"
                type="number"
                step="0.5"
                value={manualFormData.workHours}
                onChange={(e) =>
                  setManualFormData({ ...manualFormData, workHours: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                Mandatory HR Justification Reason <span className="text-brand-red">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={manualFormData.reason}
                onChange={(e) => setManualFormData({ ...manualFormData, reason: e.target.value })}
                placeholder="Specify official justification (e.g. Employee punch failed due to biometric turnstile glitch; on-premises arrival verified by Pune security)..."
                className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              />
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsManualModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingManual}>
                Confirm Manual Attendance
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
