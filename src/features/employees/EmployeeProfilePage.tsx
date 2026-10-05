import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Clock,
  CalendarDays,
  Banknote,
  Target,
  FileText,
  Laptop,
  Briefcase,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Award,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { hrmsService } from '../../services/hrmsService';
import { Employee, SalarySlip, AttendanceRecord, LeaveApplication, PerformanceGoal } from '../../types/hrms';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { AccessRestricted } from '../../components/ui/AccessRestricted';

export const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const isEmployee = role === 'Employee';

  type ProfileTabKey = 'overview' | 'internship' | 'attendance' | 'leave' | 'payroll' | 'performance' | 'documents' | 'assets' | 'career';

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('overview');
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);

  useEffect(() => {
    hrmsService.getEmployees().then((list) => {
      // If user is Employee and no valid ID passed or trying to access someone else, default to own user
      const targetId = isEmployee ? (user?.employeeId || user?.id || id) : id;
      const found = list.find((e) => e.id === targetId || e.employeeId === targetId) || 
                    (isEmployee ? list.find((e) => e.id === user?.id || e.employeeId === user?.employeeId) : list[0]);
      setEmployee(found || null);
    });
    hrmsService.getSalarySlips().then(setSalarySlips);
    hrmsService.getAttendanceRecords().then(setAttendance);
    hrmsService.getLeaveApplications().then(setLeaves);
    hrmsService.getGoals().then(setGoals);
  }, [id, isEmployee, user]);

  if (!employee) {
    return (
      <div className="p-12 text-center text-brand-slate">
        <p>Loading employee record from ERPNext...</p>
      </div>
    );
  }

  // RBAC Data Privacy Gate: Employees may ONLY view their own personal dossier
  const isOwnRecord =
    employee.id === user?.id ||
    employee.employeeId === user?.employeeId ||
    employee.email === user?.email;

  if (isEmployee && !isOwnRecord) {
    return (
      <AccessRestricted
        allowedRoles={['HR Admin', 'System Administrator']}
        customMessage="Data Confidentiality Gate: In compliance with corporate RBAC policies, employees are authorized to view exclusively their own personnel dossier. Access to other employees' profiles, contracts, and compensation is restricted to HR Administrators."
      />
    );
  }

  // Filter data specifically to this employee
  const employeeSalarySlips = salarySlips.filter(
    (s) => s.employeeId === employee.employeeId || s.employeeName === employee.fullName
  );
  const employeeAttendance = attendance.filter(
    (a) => a.employeeId === employee.employeeId || a.employeeName === employee.fullName
  );
  const employeeLeaves = leaves.filter(
    (l) => l.employeeId === employee.employeeId || l.employeeName === employee.fullName
  );
  const employeeGoals = goals.filter(
    (g) => !g.employeeId || g.employeeId === employee.employeeId
  );

  const isIntern = employee.engagementCategory === 'Intern' || Boolean(employee.internshipDetails);

  const tabs: Array<{ key: ProfileTabKey; label: string; icon: any }> = [
    { key: 'overview', label: 'Overview', icon: User },
    ...(isIntern ? [{ key: 'internship' as ProfileTabKey, label: 'Internship Lifecycle', icon: GraduationCap }] : []),
    { key: 'attendance', label: 'Attendance', icon: Clock },
    { key: 'leave', label: 'Leave', icon: CalendarDays },
    { key: 'payroll', label: 'Payroll & Terms', icon: Banknote },
    { key: 'performance', label: 'Performance', icon: Target },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'assets', label: 'Assets', icon: Laptop },
    { key: 'career', label: 'Career History', icon: Briefcase },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <Link
        to={isEmployee ? '/dashboard' : '/employees'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-slate hover:text-brand-red transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {isEmployee ? 'Back to My Workspace' : 'Back to Employee Directory'}
      </Link>

      {/* Hero Profile Header */}
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-red via-brand-red-hover to-transparent" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <img
              src={employee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt={employee.fullName}
              className="w-24 h-24 rounded-2xl object-cover ring-2 ring-brand-red/50 shadow-glow-red-sm"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-brand-ink">{employee.fullName}</h1>
                <Badge variant={getStatusBadgeVariant(employee.status)} dot>
                  {employee.status}
                </Badge>
              </div>
              <p className="text-sm text-brand-red font-semibold mt-0.5">{employee.designation}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-brand-slate mt-2">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-brand-slate" />
                  {employee.department}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-slate" />
                  {employee.workLocation}
                </span>
                <span className="font-mono text-brand-slate">ID: {employee.employeeId}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
            <div className="text-center px-3">
              <p className="text-xs text-brand-slate">Attendance</p>
              <p className="text-xl font-extrabold text-brand-ink mt-0.5">{employee.metrics?.attendanceRate || 96.4}%</p>
            </div>
            <div className="text-center px-3 border-l border-white/5">
              <p className="text-xs text-brand-slate">Leave Balance</p>
              <p className="text-xl font-extrabold text-brand-red mt-0.5">{employee.metrics?.leaveBalance || 14} Days</p>
            </div>
            <div className="text-center px-3 border-l border-white/5">
              <p className="text-xs text-brand-slate">Performance</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-0.5">{employee.metrics?.performanceScore || 88}%</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto border-t border-white/5 mt-6 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-brand-ink hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Tab Content Display */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal & Contact Information</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-brand-slate">Email Address</span>
                <span className="text-brand-ink font-semibold">{employee.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-brand-slate">Phone</span>
                <span className="text-brand-ink font-semibold">{employee.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-brand-slate">Reporting Manager</span>
                <span className="text-brand-ink font-semibold">{employee.managerName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-brand-slate">Date of Joining / Window</span>
                <span className="text-brand-ink font-semibold">
                  {isIntern ? '1 Jul 2026 – 30 Sep 2026 (Inclusive)' : (employee.joiningDate === 'Not provided' ? 'Not provided' : formatDate(employee.joiningDate))}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-brand-slate">Engagement Category</span>
                <span className="text-brand-ink font-semibold">{employee.engagementCategory || 'Employee'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-brand-slate">Organisational Role</span>
                <span className="text-brand-ink font-semibold">{employee.organisationalRole || 'Not provided'}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts & Banking</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-brand-slate">Emergency Contact</span>
                <span className="text-brand-ink font-semibold">
                  {employee.emergencyContact?.name || 'Not provided'} {employee.emergencyContact?.relationship ? `(${employee.emergencyContact.relationship})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-brand-slate">Emergency Phone</span>
                <span className="text-brand-ink font-semibold">{employee.emergencyContact?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-brand-slate">Bank Account</span>
                <span className="text-brand-ink font-semibold">
                  {employee.bankInfo?.bankName || 'Not provided'} {employee.bankInfo?.accountNumber ? `(${employee.bankInfo.accountNumber})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-brand-slate">Tax Identifier / PAN</span>
                <span className="text-brand-ink font-mono">{employee.bankInfo?.panOrTaxId || 'Not provided'}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Internship Lifecycle & Evaluation Tab */}
      {activeTab === 'internship' && isIntern && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full border border-brand-red/20 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-red" />
                  Confirmed Cohort Roster: Unpaid Intern
                </span>
              </div>
              <h3 className="text-xl font-bold text-brand-ink mt-2">
                Internship Lifecycle & Conversion Dossier
              </h3>
              <p className="text-xs text-brand-slate mt-1">
                Scheduled Period: 1 July 2026 – 30 September 2026 (Inclusive) • Timezone: IST (Asia/Kolkata)
              </p>
            </div>
            <div>
              <Link to="/internships">
                <Button size="sm" className="btn-sheen shadow-glow-red-sm">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open in Governance Hub
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-brand-slate font-bold uppercase block">Date-Based State</span>
              <span className="text-sm font-bold text-brand-ink mt-1 block">
                {employee.internshipDetails?.dateState || 'Within internship period'}
              </span>
              <span className="text-[11px] text-brand-slate mt-0.5 block">1 Jul – 30 Sep 2026</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-brand-slate font-bold uppercase block">Administrative Outcome</span>
              <span className="text-sm font-bold text-brand-ink mt-1 block">
                {employee.internshipDetails?.administrativeOutcome || 'Completion pending'}
              </span>
              <span className="text-[11px] text-brand-slate mt-0.5 block">Subject to management action</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-brand-slate font-bold uppercase block">Compensation Terms</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block">
                Unpaid (Stipend: ₹0)
              </span>
              <span className="text-[11px] text-brand-slate mt-0.5 block">Excluded from salary payroll</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Employment Opportunity Terms:</strong> This intern may be considered for permanent employment from October 2026 onward, based on performance evaluation and management approval. This is a potential opportunity, not a guaranteed conversion. Reaching 30 September 2026 does not automatically make them a permanent employee.
            </div>
          </div>

          {employee.conversionDetails && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-2">
              <span className="font-bold text-emerald-300 block">Permanent Employment Conversion Record</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-brand-slate block text-[10px]">Status</span>
                  <span className="font-bold text-emerald-300">
                    {employee.conversionDetails.permanentEmploymentActive ? 'Active Permanent Employee' : 'Joining Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-brand-slate block text-[10px]">Effective Date</span>
                  <span className="font-bold text-brand-ink">{employee.conversionDetails.effectiveJoiningDate || '2026-10-01'}</span>
                </div>
                <div>
                  <span className="text-brand-slate block text-[10px]">Authorized By</span>
                  <span className="font-bold text-brand-ink">{employee.conversionDetails.convertedBy || 'HR Management'}</span>
                </div>
                <div>
                  <span className="text-brand-slate block text-[10px]">Original Cohort Window</span>
                  <span className="font-bold text-brand-ink">{employee.conversionDetails.originalInternshipPeriod || '1 Jul – 30 Sep 2026'}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'payroll' && (
        <Card>
          <CardHeader>
            <CardTitle>Compensation & Salary Structure</CardTitle>
          </CardHeader>
          <div className="p-4 rounded-xl bg-brand-card-hover border border-white/5 mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-brand-slate">
                {isIntern && !employee.conversionDetails?.permanentEmploymentActive
                  ? 'Internship Compensation Status'
                  : 'Annual Fixed CTC'}
              </p>
              <h3 className="text-2xl font-bold text-brand-ink mt-0.5">
                {isIntern && !employee.conversionDetails?.permanentEmploymentActive
                  ? 'Unpaid (Stipend: ₹0)'
                  : employee.baseSalary != null
                  ? formatCurrency(employee.baseSalary)
                  : 'Not provided'}
              </h3>
              <p className="text-xs text-brand-slate mt-0.5">
                {isIntern && !employee.conversionDetails?.permanentEmploymentActive
                  ? 'Strictly excluded from salary payroll during the unpaid internship'
                  : employee.baseSalary != null
                  ? 'Compensation active under verified salary structure'
                  : 'Salary terms unspecified (unknown, not zero)'}
              </p>
            </div>
            {isIntern && !employee.conversionDetails?.permanentEmploymentActive && (
              <Badge variant="neutral" dot>
                Payroll Ineligible
              </Badge>
            )}
          </div>
          <div className="divide-y divide-white/5">
            {employeeSalarySlips.length === 0 ? (
              <p className="py-6 text-center text-xs text-brand-slate">No salary statements recorded for this employee.</p>
            ) : (
              employeeSalarySlips.map((slip) => (
                <div key={slip.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-brand-ink">{slip.month} {slip.year}</h4>
                    <p className="text-brand-slate">Paid on {slip.postingDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-ink">{formatCurrency(slip.netPay)}</p>
                    <Badge variant="success">Dispatched</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance Punch Records</CardTitle>
          </CardHeader>
          <div className="divide-y divide-white/5">
            {employeeAttendance.length === 0 ? (
              <p className="py-6 text-center text-xs text-brand-slate">No attendance punches recorded.</p>
            ) : (
              employeeAttendance.slice(0, 10).map((att) => (
                <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-brand-ink">{att.date}</h4>
                    <p className="text-brand-slate">{att.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-brand-ink">In: {att.checkIn} • {att.workHours}h</p>
                    <Badge variant={getStatusBadgeVariant(att.status)}>{att.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'leave' && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Applications & Balance Ledger</CardTitle>
          </CardHeader>
          <div className="divide-y divide-white/5">
            {employeeLeaves.length === 0 ? (
              <p className="py-6 text-center text-xs text-brand-slate">No leave applications on file.</p>
            ) : (
              employeeLeaves.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-brand-ink">{l.leaveType} ({l.totalDays} Days)</h4>
                    <p className="text-brand-slate">{l.fromDate} → {l.toDate} • Reason: {l.reason}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusBadgeVariant(l.status)} dot>{l.status}</Badge>
                    <span className="text-[10px] text-brand-slate block mt-1">Applied: {l.appliedOn}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'performance' && (
        <Card>
          <CardHeader>
            <CardTitle>Active OKRs & Goal Progress</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {employeeGoals.length === 0 ? (
              <p className="py-6 text-center text-xs text-brand-slate">No goals assigned yet.</p>
            ) : (
              employeeGoals.map((g) => (
                <div key={g.id} className="p-3.5 rounded-xl bg-brand-card-hover border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-brand-ink text-xs">{g.title}</h4>
                    <p className="text-[11px] text-brand-slate">{g.description}</p>
                  </div>
                  <div className="text-right pl-4">
                    <span className="text-sm font-bold text-brand-red">{g.progress}%</span>
                    <span className="text-[10px] text-brand-slate block">Due: {g.dueDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'assets' && (
        <Card>
          <CardHeader>
            <CardTitle>Allocated IT Hardware & Security Passes</CardTitle>
          </CardHeader>
          <div className="divide-y divide-white/5">
            {employee.assignedAssets?.map((ast) => (
              <div key={ast.assetId} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-brand-ink">{ast.name}</h4>
                  <p className="text-brand-slate">Assigned on {ast.assignedDate}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-brand-red bg-brand-red/10 px-2 py-0.5 rounded text-[11px] block mb-1">
                    {ast.assetId}
                  </span>
                  <Badge variant="success">Assigned</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
