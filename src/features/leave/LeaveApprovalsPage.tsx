import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Check, 
  X, 
  Clock, 
  FileCheck2, 
  AlertTriangle, 
  AlertCircle, 
  Search, 
  Filter, 
  ShieldAlert, 
  Info, 
  Calendar, 
  UserCheck,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { hrmsService } from '../../services/hrmsService';
import { LeaveApplication, Employee, LeaveType, LeaveStatus } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import { 
  isAuthorizedAttendanceLeaveAdmin, 
  isAuthorizedAlternativeLeaveApprover,
  calculateWorkingDays,
  INTERNSHIP_END_DATE,
  getPersonnelCategory,
  PersonnelCategoryFilter
} from '../../services/attendanceScheduleService';

export const LeaveApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  
  const isAdmin = isAuthorizedAttendanceLeaveAdmin(user?.id || user?.employeeId, user?.name);
  const isDirector = isAuthorizedAlternativeLeaveApprover(user?.id || user?.employeeId, user?.name);

  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isApplyOpen, setIsApplyOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('apply') === 'true';
    }
    return false;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PersonnelCategoryFilter>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Reject Modal State
  const [rejectingLeave, setRejectingLeave] = useState<LeaveApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Approve Modal State
  const [approvingLeave, setApprovingLeave] = useState<LeaveApplication | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Current user's verified employee profile
  const currentEmp = employees.find(
    (e) => e.employeeId === user?.employeeId || e.id === user?.id
  );

  // Check if current user is an active employee or continuing staff member
  // Krishna Tiwari (ETHX-021) logs in as an Employee. Now that October 2026 has started,
  // staff employees are fully eligible to apply for time-off across October and upcoming months.
  const isStaffEmployee = user?.role === 'Employee' && (
    user?.employeeId === 'ETHX-021' ||
    user?.id === 'emp-021' ||
    user?.name?.toLowerCase().includes('krishna') ||
    currentEmp?.conversionDetails?.permanentEmploymentActive === true ||
    currentEmp?.engagementCategory !== 'Intern'
  );

  const isCurrentUserIntern = !isStaffEmployee && currentEmp?.engagementCategory === 'Intern';

  // Apply Form State
  const [formData, setFormData] = useState<{
    leaveType: LeaveType;
    fromDate: string;
    toDate: string;
    durationOption: 'Full Day' | 'Half Day (First Half)' | 'Half Day (Second Half)';
    reason: string;
    attachmentUrl: string;
  }>({
    leaveType: isCurrentUserIntern ? 'Unpaid Internship Leave' : 'Casual Leave',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    durationOption: 'Full Day',
    reason: '',
    attachmentUrl: '',
  });

  const loadData = async () => {
    try {
      const callerId = user?.id || user?.employeeId || '';
      const [fetchedLeaves, fetchedEmployees] = await Promise.all([
        hrmsService.getLeaveApplications(callerId),
        hrmsService.getEmployees(),
      ]);
      setLeaves(fetchedLeaves);
      setEmployees(fetchedEmployees);
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Failed to fetch leave records.');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Adjust default leave type when profile is recognized
  useEffect(() => {
    if (isCurrentUserIntern && (formData.leaveType === 'Annual Leave' || formData.leaveType === 'Casual Leave')) {
      setFormData((prev) => ({ ...prev, leaveType: 'Unpaid Internship Leave' }));
    } else if (isStaffEmployee && formData.leaveType === 'Unpaid Internship Leave') {
      setFormData((prev) => ({ ...prev, leaveType: 'Medical Leave' }));
    }
  }, [isCurrentUserIntern, isStaffEmployee]);

  // Dynamic working day calculation
  const calculatedDays = useMemo(() => {
    try {
      return calculateWorkingDays(formData.fromDate, formData.toDate, formData.durationOption);
    } catch {
      return 1;
    }
  }, [formData.fromDate, formData.toDate, formData.durationOption]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);

    // Validate date order
    if (formData.fromDate > formData.toDate) {
      setErrorFeedback('Validation Error: From Date cannot be after To Date.');
      return;
    }

    // Validate intern cutoff date (30 September 2026) for active unpaid cohort interns
    if (isCurrentUserIntern && formData.toDate > INTERNSHIP_END_DATE) {
      setErrorFeedback(
        `Validation Error: Internship engagement period concludes on ${INTERNSHIP_END_DATE}. Cannot apply for leave beyond engagement end date.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const callerId = user?.id || user?.employeeId || '';
      const created = await hrmsService.applyLeave(
        {
          employeeId: user?.employeeId || currentEmp?.employeeId || 'ETHX-021',
          employeeName: user?.name || currentEmp?.fullName || 'Krishna Tiwari',
          department: user?.department || currentEmp?.department || 'IT & Engineering',
          applicantCategory: isStaffEmployee ? 'Employee' : isCurrentUserIntern ? 'Intern' : 'Employee',
          leaveType: formData.leaveType,
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          durationOption: formData.durationOption,
          reason: formData.reason.trim(),
          attachmentUrl: formData.attachmentUrl || null,
        },
        callerId
      );

      setLeaves([created, ...leaves]);
      setIsApplyOpen(false);
      setFormData({
        leaveType: isCurrentUserIntern ? 'Unpaid Internship Leave' : 'Casual Leave',
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        durationOption: 'Full Day',
        reason: '',
        attachmentUrl: '',
      });

      if (created.status === 'Pending Director Approval') {
        setFeedback(
          'Leave application submitted. Self-approval is blocked for Niky Sharma; application routed to Company Director (Ram Chaturvedi).'
        );
      } else {
        setFeedback('Leave application submitted successfully. Forwarded to HR Administrator (Niky Sharma) for review.');
      }
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Failed to submit leave application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!approvingLeave) return;
    setIsApproving(true);
    setErrorFeedback(null);
    try {
      const callerId = user?.id || user?.employeeId || '';
      const updated = await hrmsService.updateLeaveStatus(
        approvingLeave.id,
        'Approved',
        callerId,
        approvalRemarks.trim() || undefined
      );

      setLeaves(leaves.map((l) => (l.id === approvingLeave.id ? updated : l)));
      setApprovingLeave(null);
      setApprovalRemarks('');

      if (updated.conflictWithAttendance) {
        setFeedback(`Leave #${updated.id} Approved. Warning: Conflict detected with existing attendance punches and flagged for HR.`);
      } else {
        setFeedback(`Leave #${updated.id} Approved successfully. Attendance ledger updated.`);
      }
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Failed to approve leave application.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingLeave) return;
    if (!rejectionReason.trim()) {
      setErrorFeedback('Validation Error: A mandatory rejection reason is required.');
      return;
    }

    setIsRejecting(true);
    setErrorFeedback(null);
    try {
      const callerId = user?.id || user?.employeeId || '';
      const updated = await hrmsService.updateLeaveStatus(
        rejectingLeave.id,
        'Rejected',
        callerId,
        undefined,
        rejectionReason.trim()
      );

      setLeaves(leaves.map((l) => (l.id === rejectingLeave.id ? updated : l)));
      setRejectingLeave(null);
      setRejectionReason('');
      setFeedback(`Leave #${updated.id} Rejected with logged reason.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Failed to reject leave application.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!confirm('Are you sure you want to cancel this leave application? If approved, attendance ledger effects will be reversed.')) {
      return;
    }
    try {
      const callerId = user?.id || user?.employeeId || '';
      const cancelled = await hrmsService.cancelLeave(leaveId, callerId);
      setLeaves(leaves.map((l) => (l.id === leaveId ? cancelled : l)));
      setFeedback(`Leave application #${leaveId} has been cancelled.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setErrorFeedback(err?.message || 'Failed to cancel leave.');
    }
  };

  // Filtered Leave Applications
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = l.employeeName?.toLowerCase().includes(q);
        const matchesId = l.employeeId?.toLowerCase().includes(q);
        const matchesAppId = l.id?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesAppId) return false;
      }

      // 2. Personnel Category Filter
      if (categoryFilter !== 'All') {
        const matchedEmp = employees.find((e) => e.employeeId === l.employeeId || e.id === l.employeeId);
        const catInfo = getPersonnelCategory(matchedEmp, l.employeeName);
        if (catInfo.key !== categoryFilter) return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Pending' && !l.status.includes('Pending')) return false;
        if (statusFilter !== 'Pending' && l.status !== statusFilter) return false;
      }

      return true;
    });
  }, [leaves, searchQuery, categoryFilter, statusFilter]);

  // Dynamic counts for KPI strip
  const totalPending = leaves.filter((l) => l.status.includes('Pending')).length;
  const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;
  const internLeavesCount = leaves.filter((l) => l.applicantCategory === 'Intern').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Access Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-ink">
              {isAdmin ? 'Leave Management & Executive Approvals' : isDirector ? 'Executive Director Leave Oversight' : 'My Leaves & Time-off Requests'}
            </h1>
            {isAdmin ? (
              <Badge variant="red" dot>
                Niky Sharma Authorized HR Admin
              </Badge>
            ) : isDirector ? (
              <Badge variant="warning" dot>
                Ram Chaturvedi Director Approver
              </Badge>
            ) : (
              <Badge variant="neutral">
                Personal Applications Scoped ({user?.employeeId || user?.id})
              </Badge>
            )}
          </div>
          <p className="text-sm text-brand-slate mt-1">
            {isAdmin
              ? 'Review pending time-off requests across employees and interns, enforce leave policies, and reconcile attendance ledgers.'
              : 'Submit time-off requests, track approval status, and manage personal leave balance.'}
          </p>
        </div>

        {!isAdmin && !isDirector && (
          <Button size="sm" onClick={() => setIsApplyOpen(true)} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Apply for Leave
          </Button>
        )}
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorFeedback && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* Policy Compliance & Engagement Scope Banner */}
      <div className="p-3.5 rounded-xl bg-brand-dark-subtle/80 border border-brand-border text-brand-slate text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>
            {isStaffEmployee ? (
              <>
                <strong className="text-brand-ink">Staff Employee Leave Policy:</strong> Full-time and continuing personnel are eligible for Casual Leave, Sick Leave, Medical Leave, and Annual Leave across October 2026 and upcoming months. Applications are routed to HR Administration for review.
              </>
            ) : (
              <>
                <strong className="text-brand-ink">Leave Policy Compliance:</strong> Unpaid interns have no paid annual leave entitlements; time off is recorded as Unpaid Internship Leave or Academic Leave. All internship leave dates must fall on or before 30 September 2026.
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-brand-slate">{isStaffEmployee ? 'Engagement Period:' : 'Internship End Date:'}</span>
          <Badge variant={isStaffEmployee ? 'success' : 'neutral'}>{isStaffEmployee ? 'Q4 Active (Oct 2026+)' : INTERNSHIP_END_DATE}</Badge>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {isAdmin || isDirector ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-slate uppercase font-bold">Pending Reviews</span>
              <Badge variant={totalPending > 0 ? 'red' : 'neutral'} dot={totalPending > 0}>
                {totalPending > 0 ? 'Action Required' : 'Up to Date'}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-ink">{totalPending}</span>
              <span className="text-xs text-brand-slate">Applications awaiting review</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-slate uppercase font-bold">Approved Leaves</span>
              <Badge variant="success">Synchronized</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-ink">{approvedCount}</span>
              <span className="text-xs text-brand-slate">Attendance ledger updated</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-slate uppercase font-bold">Intern Requests</span>
              <Badge variant="warning">Unpaid Cohort</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-ink">{internLeavesCount}</span>
              <span className="text-xs text-brand-slate">Unpaid / Academic time-off</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-slate uppercase font-bold">Rejected / Closed</span>
              <Badge variant="neutral">Audited</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-ink">{rejectedCount}</span>
              <span className="text-xs text-brand-slate">With mandatory reason logged</span>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isCurrentUserIntern ? (
            <>
              <Card className="p-4">
                <span className="text-xs text-brand-slate uppercase font-bold block mb-1">
                  Internship Engagement
                </span>
                <span className="text-2xl font-bold text-brand-ink">Unpaid Cohort</span>
                <span className="text-xs text-brand-slate block mt-1">
                  1 July 2026 – 30 September 2026
                </span>
              </Card>
              <Card className="p-4">
                <span className="text-xs text-brand-slate uppercase font-bold block mb-1">
                  Unpaid Time-Off Logged
                </span>
                <span className="text-2xl font-bold text-brand-ink">
                  {leaves
                    .filter((l) => l.status === 'Approved')
                    .reduce((sum, l) => sum + (l.totalDays || 0), 0)}{' '}
                  Days
                </span>
                <span className="text-xs text-brand-slate block mt-1">Approved internship leaves</span>
              </Card>
              <Card className="p-4">
                <span className="text-xs text-brand-slate uppercase font-bold block mb-1">
                  Pending Applications
                </span>
                <span className="text-2xl font-bold text-brand-ink">{totalPending}</span>
                <span className="text-xs text-brand-slate block mt-1">Awaiting Niky Sharma&apos;s review</span>
              </Card>
            </>
          ) : (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-slate uppercase font-bold">Annual Leave</span>
                  <Badge variant="red">
                    {Math.max(
                      0,
                      18 -
                        leaves
                          .filter((l) => l.leaveType === 'Annual Leave' && l.status === 'Approved')
                          .reduce((acc, l) => acc + (l.totalDays || 0), 0)
                    )}{' '}
                    Days Left
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-brand-ink">
                    {Math.max(
                      0,
                      18 -
                        leaves
                          .filter((l) => l.leaveType === 'Annual Leave' && l.status === 'Approved')
                          .reduce((acc, l) => acc + (l.totalDays || 0), 0)
                    )}
                  </span>
                  <span className="text-xs text-brand-slate">/ 18 standard annual allocation</span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-slate uppercase font-bold">Sick Leave</span>
                  <Badge variant="success">
                    {Math.max(
                      0,
                      7 -
                        leaves
                          .filter((l) => l.leaveType === 'Sick Leave' && l.status === 'Approved')
                          .reduce((acc, l) => acc + (l.totalDays || 0), 0)
                    )}{' '}
                    Days Left
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-brand-ink">
                    {Math.max(
                      0,
                      7 -
                        leaves
                          .filter((l) => l.leaveType === 'Sick Leave' && l.status === 'Approved')
                          .reduce((acc, l) => acc + (l.totalDays || 0), 0)
                    )}
                  </span>
                  <span className="text-xs text-brand-slate">/ 7 standard sick days</span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-slate uppercase font-bold">Pending Review</span>
                  <Badge variant="warning">{totalPending}</Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-brand-ink">{totalPending}</span>
                  <span className="text-xs text-brand-slate">Time-off requests in review</span>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Admin Filters & Search */}
      {(isAdmin || isDirector) && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-slate mb-1">
                Search Applicant
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, ID, or Leave ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-brand-slate mb-1">
                Applicant Type
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
                Workflow Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Review (All)</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Pending Director Approval">Pending Director Approval</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Applications Table */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle>
              {isAdmin ? 'Organization Leave Applications Registry' : 'My Leave Application Registry'}
            </CardTitle>
            <p className="text-[11px] text-brand-slate mt-0.5">
              Showing {filteredLeaves.length} leave application records
            </p>
          </div>
          <Badge variant="neutral">
            {isAdmin ? '21 Master Personnel' : `${user?.name} (${user?.employeeId})`}
          </Badge>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-dark-subtle border-b border-brand-border text-brand-slate uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Leave ID</th>
                {(isAdmin || isDirector) && <th className="py-3 px-4">Applicant</th>}
                <th className="py-3 px-4">Type & Duration</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">
                  {isAdmin || isDirector ? 'HR Decision & Actions' : 'Actions / Status'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin || isDirector ? 8 : 7}
                    className="py-10 text-center text-brand-slate"
                  >
                    No leave applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => {
                  const isIntern = l.applicantCategory === 'Intern';
                  const isSelf =
                    l.employeeId === user?.employeeId ||
                    l.employeeId === user?.id ||
                    l.employeeName === user?.name;
                  const isNikyApplication =
                    l.employeeId === 'ETHX-005' || l.employeeId === 'emp-005';

                  return (
                    <tr key={l.id} className="hover:bg-brand-card-hover transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-brand-slate">
                        <div>{l.id}</div>
                        <div className="text-[10px] text-brand-slate/60">{l.appliedOn}</div>
                      </td>

                      {(isAdmin || isDirector) && (
                        <td className="py-3 px-4">
                          {(() => {
                            const emp = employees.find(
                              (e) => e.employeeId === l.employeeId || e.id === l.employeeId
                            );
                            const catInfo = getPersonnelCategory(emp, l.employeeName);
                            const displayDept = emp?.department && emp.department !== 'Not provided' ? emp.department : l.department;

                            return (
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-brand-ink">{l.employeeName}</span>
                                  <Badge variant={catInfo.badgeVariant} className="text-[10px] py-0 px-1.5 font-bold">
                                    {catInfo.label}
                                  </Badge>
                                </div>
                                <span className="text-[11px] font-mono text-brand-slate">
                                  {l.employeeId} • {displayDept}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      )}

                      <td className="py-3 px-4">
                        <span className="font-semibold text-brand-ink block">{l.leaveType}</span>
                        <span className="text-[11px] text-brand-slate">
                          {l.durationOption || 'Full Day'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-brand-slate whitespace-nowrap">
                        <div className="font-medium text-brand-ink">
                          {l.fromDate} → {l.toDate}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-brand-ink">{l.totalDays}d</td>

                      <td className="py-3 px-4 text-brand-slate max-w-xs">
                        <div className="truncate font-medium text-brand-ink">{l.reason}</div>
                        {l.rejectionReason && (
                          <div className="text-[10px] text-red-400 mt-0.5">
                            Rejection Note: {l.rejectionReason}
                          </div>
                        )}
                        {l.conflictWithAttendance && (
                          <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            Punch recorded on approved date
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(l.status)} dot>
                          {l.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {/* Action buttons based on Role and Status */}
                        {l.status === 'Pending' || l.status === 'Pending Director Approval' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Guard: Self-Approval Prevention */}
                            {isNikyApplication && isAdmin ? (
                              <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                                <span>Self-approval blocked (Director Review)</span>
                              </div>
                            ) : (isAdmin && l.status === 'Pending') ||
                              (isDirector && l.status === 'Pending Director Approval') ? (
                              <>
                                <button
                                  onClick={() => setApprovingLeave(l)}
                                  className="p-1.5 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                                  title="Approve Leave"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setRejectingLeave(l)}
                                  className="p-1.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                                  title="Reject Leave (Mandatory Reason)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : null}

                            {/* Self Cancel Option */}
                            {isSelf && (
                              <button
                                onClick={() => handleCancel(l.id)}
                                className="text-[11px] text-brand-slate hover:text-red-400 underline ml-1"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-brand-slate">
                            {l.decidedBy ? (
                              <div>
                                <span className="block text-[10px] text-brand-slate/70">
                                  Decided by {l.decidedBy}
                                </span>
                                {l.decisionDate && (
                                  <span className="text-[9px] text-brand-slate/50">
                                    {new Date(l.decisionDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span>Archived</span>
                            )}
                            {isSelf && l.status === 'Approved' && (
                              <button
                                onClick={() => handleCancel(l.id)}
                                className="text-[11px] text-red-400/80 hover:text-red-400 hover:underline block mt-0.5"
                              >
                                Cancel Leave
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Submit Time-Off Request"
        subtitle={`Applicant: ${user?.name || 'Krishna Tiwari'} (${user?.employeeId || 'ETHX-021'}) • ${
          isStaffEmployee ? 'Staff Employee' : isCurrentUserIntern ? 'Unpaid Intern Cohort' : 'Staff Employee'
        }`}
      >
        <form onSubmit={handleApply} className="space-y-4">
          {/* Policy Notice in Modal */}
          {isStaffEmployee ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
              <strong className="block mb-0.5">Staff Employee Leave Policy:</strong>
              October 2026 and upcoming months active. Eligible for Casual Leave, Medical Leave, Sick Leave, Annual Leave, or Unpaid Time-Off. Applications route directly to HR Administrator (Niky Sharma) for approval.
            </div>
          ) : isCurrentUserIntern ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
              <strong className="block mb-0.5">Unpaid Internship Policy:</strong>
              Unpaid interns are eligible for Unpaid Internship Leave, Academic Leave, or Medical Leave. Paid leave accruals are not supported. Final eligible engagement date: {INTERNSHIP_END_DATE}.
            </div>
          ) : user?.employeeId === 'ETHX-005' || user?.id === 'emp-005' ? (
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs text-sky-300">
              <strong className="block mb-0.5">Executive Governance Notice:</strong>
              Niky Sharma cannot self-approve her own time off. This request will be routed directly to Company Director (Ram Chaturvedi).
            </div>
          ) : null}

          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
              Leave Type <span className="text-brand-red">*</span>
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) =>
                setFormData({ ...formData, leaveType: e.target.value as LeaveType })
              }
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-2.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
            >
              {isCurrentUserIntern ? (
                <>
                  <option value="Unpaid Internship Leave">Unpaid Internship Leave</option>
                  <option value="Academic Leave">Academic Leave (College / Exams)</option>
                  <option value="Medical Leave">Medical Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </>
              ) : (
                <>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Medical Leave">Medical Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Annual Leave">Annual Leave (Paid Vacation)</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </>
              )}
            </select>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Date *"
              type="date"
              required
              value={formData.fromDate}
              min={isCurrentUserIntern ? '2026-07-01' : undefined}
              max={isCurrentUserIntern ? INTERNSHIP_END_DATE : undefined}
              onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
            />
            <Input
              label="To Date *"
              type="date"
              required
              value={formData.toDate}
              min={formData.fromDate}
              max={isCurrentUserIntern ? INTERNSHIP_END_DATE : undefined}
              onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
            />
          </div>

          {/* Duration Option */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                Duration Option
              </label>
              <select
                value={formData.durationOption}
                onChange={(e) =>
                  setFormData({ ...formData, durationOption: e.target.value as any })
                }
                className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-2.5 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              >
                <option value="Full Day">Full Day</option>
                <option value="Half Day (First Half)">Half Day (First Half)</option>
                <option value="Half Day (Second Half)">Half Day (Second Half)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                Calculated Working Days
              </label>
              <div className="p-2.5 bg-brand-dark rounded-lg border border-brand-border text-xs font-bold text-brand-ink">
                {calculatedDays} Working Day{calculatedDays !== 1 ? 's' : ''} (Excludes Weekends)
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
              Reason for Absence <span className="text-brand-red">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide context for approval (e.g. University mid-term examination)..."
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
            />
          </div>

          {/* Supporting Document / Attachment URL */}
          <Input
            label="Supporting Document URL (Optional)"
            placeholder="https://drive.google.com/... or medical cert reference"
            value={formData.attachmentUrl}
            onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
          />

          <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsApplyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve Confirmation Modal */}
      {approvingLeave && (
        <Modal
          isOpen={!!approvingLeave}
          onClose={() => setApprovingLeave(null)}
          title="Approve Leave Application"
          subtitle={`Applicant: ${approvingLeave.employeeName} (${approvingLeave.employeeId}) • ${approvingLeave.totalDays} Days (${approvingLeave.fromDate} → ${approvingLeave.toDate})`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
              <strong className="block mb-0.5">Ledger Reconciliation:</strong>
              Approving this application will automatically set the attendance status to &quot;Approved Leave&quot; for the requested dates. If any punch already exists on these dates, it will be flagged as a conflict for HR review.
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                Approval Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Add optional notes for the employee..."
                className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              />
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setApprovingLeave(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                isLoading={isApproving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal with Mandatory Reason */}
      {rejectingLeave && (
        <Modal
          isOpen={!!rejectingLeave}
          onClose={() => setRejectingLeave(null)}
          title="Reject Leave Application"
          subtitle={`Applicant: ${rejectingLeave.employeeName} (${rejectingLeave.employeeId}) • ${rejectingLeave.fromDate} → ${rejectingLeave.toDate}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-lg text-xs text-brand-red">
              <strong className="block mb-0.5">Mandatory Rejection Justification:</strong>
              You must provide a clear reason for rejecting this leave application. This reason will be logged in the permanent audit trail and visible to the applicant.
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-slate mb-1.5">
                Rejection Reason <span className="text-brand-red">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State specific reason for rejection (e.g., Critical sprint milestone coverage, overlapping team leaves)..."
                className="w-full bg-brand-dark-subtle border border-brand-border rounded-lg p-3 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              />
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRejectingLeave(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={isRejecting}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
