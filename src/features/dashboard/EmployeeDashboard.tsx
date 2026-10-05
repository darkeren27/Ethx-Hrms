import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  CalendarDays, 
  FileText, 
  Target, 
  ArrowRight, 
  Award, 
  Briefcase,
  Laptop,
  CheckCircle2,
  Play,
  Square,
  Sparkles,
  MapPin,
  Wifi,
  ChevronRight,
  TrendingUp,
  Download,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { hrmsService } from '../../services/hrmsService';
import { PerformanceGoal, AttendanceRecord, LeaveApplication, AssetRecord, SalarySlip } from '../../types/hrms';
import { formatCurrency } from '../../lib/utils';
import { Link } from 'react-router-dom';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [punchToast, setPunchToast] = useState<string | null>(null);
  const [isPunching, setIsPunching] = useState(false);

  const empId = user?.employeeId || 'ETHX-003';

  // Live seconds ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadUserData = () => {
    if (!user) return;
    hrmsService.getGoals(empId).then(setGoals);
    hrmsService.getAttendanceRecords().then((records) => {
      setAttendance(records.filter((r) => r.employeeId === empId || r.employeeName === user.name));
    });
    hrmsService.getLeaveApplications().then((allLeaves) => {
      setLeaves(allLeaves.filter((l) => l.employeeId === empId || l.employeeName === user.name));
    });
    hrmsService.getAssets().then((allAssets) => {
      setAssets(allAssets.filter((a) => a.assignedTo === empId || a.assignedEmployeeName === user.name));
    });
    hrmsService.getSalarySlips().then((allSlips) => {
      setSalarySlips(allSlips.filter((s) => s.employeeId === empId || s.employeeName === user.name));
    });
  };

  useEffect(() => {
    loadUserData();
  }, [user, empId]);

  // Today's punch status and shift elapsed calculation
  const todayStr = currentTime.toISOString().split('T')[0];
  const todayRecord = attendance.find(r => r.date === todayStr);
  const isPunchedIn = !!todayRecord && !todayRecord.checkOut;

  // Calculate elapsed shift time dynamically
  const elapsedShiftTime = useMemo(() => {
    if (!todayRecord || !todayRecord.checkIn) return '00h 00m 00s';
    try {
      const [timePart, modifier] = todayRecord.checkIn.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const punchDate = new Date();
      punchDate.setHours(hours, minutes, 0, 0);

      const diffMs = Math.max(0, currentTime.getTime() - punchDate.getTime());
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

      return `${String(diffHrs).padStart(2, '0')}h ${String(diffMins).padStart(2, '0')}m ${String(diffSecs).padStart(2, '0')}s`;
    } catch {
      return '04h 15m 30s';
    }
  }, [todayRecord, currentTime]);

  // Interactive Web Punch IN / OUT
  const handleTogglePunch = async () => {
    if (!user) return;
    setIsPunching(true);
    try {
      if (isPunchedIn) {
        await hrmsService.punchAttendance(empId, user.name, user.department || 'Engineering', 'OUT');
        setPunchToast('Biometric Shift Punch Out recorded successfully.');
      } else {
        await hrmsService.punchAttendance(empId, user.name, user.department || 'Engineering', 'IN');
        setPunchToast('Biometric Shift Punch In recorded successfully at ' + new Date().toLocaleTimeString());
      }
      loadUserData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPunching(false);
      setTimeout(() => setPunchToast(null), 4000);
    }
  };

  // Interactive OKR progress increment
  const handleBoostGoal = async (goalId: string, currentProgress: number) => {
    const nextVal = Math.min(100, currentProgress + 5);
    await hrmsService.updateGoalProgress(goalId, nextVal);
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress: nextVal, status: nextVal >= 100 ? 'Completed' : 'In Progress' } : g));
  };

  // Dynamic greeting based on current local hour
  const currentHour = currentTime.getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  // Dynamic attendance metrics
  const presentCount = attendance.filter((a) => a.status === 'Present').length;
  const totalDaysLogged = attendance.length;
  const attendanceRate = totalDaysLogged > 0 ? ((presentCount / totalDaysLogged) * 100).toFixed(1) + '%' : '100%';

  // Leave balance calculations
  const approvedLeavesDays = leaves
    .filter((l) => l.status === 'Approved')
    .reduce((acc, l) => acc + (l.totalDays || 1), 0);
  const totalLeaveAllocation = 18;
  const availableLeave = Math.max(0, totalLeaveAllocation - approvedLeavesDays);

  // Performance calculations
  const avgGoalProgress = goals.length > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) : 92;
  const rating = ((avgGoalProgress / 100) * 5).toFixed(1);

  // Asset custody
  const assetCount = assets.length;
  const assetNames = assets.map((a) => a.assetName).join(', ');

  // Latest payslip
  const latestSlip = salarySlips[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive ESS Personal Command Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-brand-card via-brand-card-hover to-brand-card border border-brand-border/80 shadow-card-dark relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-radial-gradient pointer-events-none opacity-60" />

        {/* Real-time connectivity and digital clock ticker */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/5 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              EMPLOYEE SELF-SERVICE WORKSTATION
            </div>
            <span className="text-xs text-brand-slate font-medium hidden sm:inline-block">
              Location: <span className="text-brand-ink font-semibold">{user?.workLocation || 'Pune HQ (Main Campus)'}</span>
            </span>
            <span className="text-xs text-brand-slate font-medium hidden md:inline-block">
              Network: <span className="text-emerald-400 font-semibold">Node ETHX-PN-04 • Secure TLS</span>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-brand-slate">
            <Clock className="w-3.5 h-3.5 text-brand-red" />
            <span className="text-brand-ink font-semibold">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-brand-slate/60">•</span>
            <span>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* User Info & Primary ESS Action Links */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full border border-brand-red/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-red" />
                Staff Portal
              </span>
              <span className="text-xs text-brand-slate font-mono">
                ID: {empId}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-ink mt-2 tracking-tight">
              {greeting}, {user?.name} 👋
            </h1>
            <p className="text-xs sm:text-sm text-brand-slate mt-1 max-w-xl">
              {user?.designation || 'Enterprise Team Member'} • {user?.department || 'Operations'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/leave">
              <Button variant="outline" size="sm" className="hover:bg-white/5">
                <CalendarDays className="w-4 h-4 mr-1.5 text-brand-slate" />
                Request Time Off
              </Button>
            </Link>
            <Link to="/attendance">
              <Button size="sm" className="btn-sheen shadow-glow-red-sm">
                <Clock className="w-4 h-4 mr-1.5" />
                Detailed Attendance
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Shift Stopwatch & Biometric Punch Widget Strip */}
        <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isPunchedIn ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-brand-red/15 text-brand-red border border-brand-red/30'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-brand-ink">Live Shift Stopwatch</h4>
                  <span className={`w-2 h-2 rounded-full ${isPunchedIn ? 'bg-emerald-400 animate-pulse' : 'bg-brand-slate'}`} />
                </div>
                <p className="text-xs font-mono font-bold text-brand-red mt-0.5">
                  {isPunchedIn ? elapsedShiftTime : 'Shift Not Active'}
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePunch}
              disabled={isPunching}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isPunchedIn 
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
              }`}
            >
              {isPunchedIn ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Clock Out
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Clock In
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-brand-ink">Q3 OKR Health Velocity</h4>
                <p className="text-[11px] text-brand-slate">Average sprint completion</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-brand-ink">{avgGoalProgress}%</span>
              <span className="text-[10px] text-emerald-400 block font-semibold">On Track</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-brand-ink">Available Annual Leave</h4>
                <p className="text-[11px] text-brand-slate">Paid time-off balance</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-brand-ink">{availableLeave}</span>
              <span className="text-[10px] text-brand-slate block font-medium">of 18 Days</span>
            </div>
          </div>
        </div>
      </div>

      {punchToast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-glow-red-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{punchToast}</span>
          </div>
          <button onClick={() => setPunchToast(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ESS Metric Cards (Dynamically computed for current user) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Reliability"
          value={attendanceRate}
          subtitle={`${presentCount} of ${totalDaysLogged || 1} shifts logged present`}
          icon={Clock}
          variant="emerald"
        />
        <StatCard
          title="Available Leave Quota"
          value={`${availableLeave} Days`}
          subtitle={`${approvedLeavesDays} days utilized of 18 allocated`}
          icon={CalendarDays}
          variant="blue"
        />
        <StatCard
          title="Performance Rating"
          value={`${rating} / 5.0`}
          subtitle={`${goals.filter((g) => g.status === 'Completed').length} of ${goals.length || 3} Goals Finished`}
          icon={Award}
          variant="red"
        />
        <StatCard
          title="Allocated Hardware"
          value={`${assetCount} ${assetCount === 1 ? 'Device' : 'Devices'}`}
          subtitle={assetNames || 'Allocated Hardware in Custody'}
          icon={Laptop}
          variant="default"
        />
      </div>

      {/* Center 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Active OKRs & Sprint Deliverables */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-red" />
                  <CardTitle>My Strategic Goals & OKRs (Q3 2026)</CardTitle>
                </div>
                <p className="text-xs text-brand-slate mt-0.5">Assigned quarterly deliverables with live progress sync</p>
              </div>
              <Link to="/performance" className="text-xs text-brand-red hover:underline font-semibold flex items-center gap-1">
                View All OKRs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>

            <div className="space-y-4">
              {goals.length === 0 ? (
                <p className="text-xs text-brand-slate py-8 text-center">No active performance goals assigned.</p>
              ) : (
                goals.map((g) => (
                  <div key={g.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-brand-ink">{g.title}</h4>
                          <Badge variant={g.status === 'Completed' ? 'success' : 'warning'}>
                            {g.status}
                          </Badge>
                          <span className="text-[10px] font-mono text-brand-slate bg-white/5 px-2 py-0.5 rounded">
                            {g.category || 'Strategic'}
                          </span>
                        </div>
                        <p className="text-xs text-brand-slate mt-1 leading-relaxed">{g.description}</p>
                      </div>

                      <button
                        onClick={() => handleBoostGoal(g.id, g.progress)}
                        disabled={g.progress >= 100}
                        className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-brand-red/20 text-brand-slate hover:text-brand-red border border-white/5 transition-all flex items-center gap-1 flex-shrink-0"
                        title="Increment progress +5%"
                      >
                        <TrendingUp className="w-3 h-3" />
                        +5%
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-brand-slate">Target Completion</span>
                        <span className="text-brand-ink font-mono">{g.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-brand-dark overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-brand-red to-brand-red-hover rounded-full transition-all duration-500 shadow-glow-red-sm"
                          style={{ width: `${g.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Pay & Direct Deposit Snapshot */}
          <Card>
            <CardHeader>
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-red" />
                  <CardTitle>Recent Compensation & Payslip Summary</CardTitle>
                </div>
                <p className="text-xs text-brand-slate mt-0.5">Automated direct wire breakdown & tax withholding statement</p>
              </div>
              <Link to="/payroll" className="text-xs text-brand-red hover:underline font-semibold flex items-center gap-1">
                Statement Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-brand-slate font-mono block">
                  Pay Period: {latestSlip ? `${latestSlip.month} ${latestSlip.year}` : 'August 2026'}
                </span>
                <h4 className="text-xl font-extrabold text-brand-ink mt-0.5">
                  {latestSlip ? formatCurrency(latestSlip.netPay) : '$8,645.00'} Net Deposited
                </h4>
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Dispatched via Direct ACH Wire ({latestSlip?.bankAccount || 'HDFC Corporate ••••4819'})
                </p>
              </div>

              <Link to="/payroll">
                <Button size="sm" variant="secondary" className="hover:border-brand-red/40 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-brand-red" />
                  Download Payslip PDF
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Col: Calendar, Holidays, Support */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-red" />
                  <CardTitle>Upcoming Corporate Holidays</CardTitle>
                </div>
                <p className="text-xs text-brand-slate mt-0.5">Pune Campus & Federal Observed</p>
              </div>
            </CardHeader>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-brand-ink">Gandhi Jayanti</h5>
                  <p className="text-[11px] text-brand-slate">National Observance Holiday</p>
                </div>
                <span className="text-xs font-semibold text-brand-red bg-brand-red/10 border border-brand-red/20 px-2.5 py-1 rounded-lg">
                  Oct 02
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-brand-ink">Diwali & Deepavali Break</h5>
                  <p className="text-[11px] text-brand-slate">Corporate Festival Holiday</p>
                </div>
                <span className="text-xs font-semibold text-brand-slate bg-white/5 px-2.5 py-1 rounded-lg">
                  Nov 01 - 03
                </span>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-b from-brand-card to-brand-card-hover border border-brand-border">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-brand-red" />
              <CardTitle className="text-sm text-brand-ink">People Operations Concierge</CardTitle>
            </div>
            <p className="text-xs text-brand-slate leading-relaxed mb-4">
              Need assistance with medical health insurance, tax deductions, or workstation ergonomic allowances?
            </p>
            <a href="mailto:people@ethxsoftcon.com">
              <Button variant="secondary" size="sm" className="w-full">
                Contact HR Operations
              </Button>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
};
