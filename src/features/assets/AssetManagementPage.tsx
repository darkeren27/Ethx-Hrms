import React, { useState, useEffect, useMemo } from 'react';
import {
  Laptop,
  ShieldCheck,
  CheckCircle2,
  Search,
  Cpu,
  Download,
  Plus,
  Filter,
  AlertCircle,
  Wrench,
  X,
  Copy,
  Check,
  Sparkles,
  Calendar,
  FileText,
  HelpCircle,
  HardDrive,
  Activity,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { hrmsService } from '../../services/hrmsService';
import { AssetRecord } from '../../types/hrms';
import { useAuth } from '../../context/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const BRAND_COLORS: Record<string, string> = {
  ASUS: '#0284c7', // Electric Blue for Asus Vivobook
  HP: '#e11d2e', // Crimson Red for HP Enterprise
  Apple: '#a855f7',
  Lenovo: '#f59e0b',
};

export const AssetManagementPage: React.FC = () => {
  const { user, role } = useAuth();
  const isEmployee = role === 'Employee';

  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeAsset, setActiveAsset] = useState<AssetRecord | null>(null);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState<boolean>(false);
  const [provisionSuccessMsg, setProvisionSuccessMsg] = useState<string | null>(null);

  // New Asset Form State
  const [newAsset, setNewAsset] = useState({
    assetCode: '',
    assetName: '',
    brand: 'HP',
    model: '',
    specifications: '',
    serialNumber: '',
    assignedTo: '',
    assignedEmployeeName: '',
    assignedDepartment: 'IT & Engineering',
    status: 'In Use' as const,
  });

  useEffect(() => {
    hrmsService.getAssets().then(setAssets);
  }, []);

  // Filtered Assets based on user role and interactive filters
  const visibleAssets = useMemo(() => {
    let list = assets;
    if (isEmployee) {
      list = list.filter(
        (a) => a.assignedTo === user?.employeeId || a.assignedEmployeeName === user?.name
      );
    }

    return list.filter((a) => {
      const matchBrand = selectedBrand === 'All' || a.brand === selectedBrand;
      const matchStatus = selectedStatus === 'All' || a.status === selectedStatus;
      const matchDept = selectedDept === 'All' || (a.assignedDepartment && a.assignedDepartment.includes(selectedDept));
      const matchSearch =
        searchTerm === '' ||
        a.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.assignedEmployeeName && a.assignedEmployeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.brand && a.brand.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchBrand && matchStatus && matchDept && matchSearch;
    });
  }, [assets, isEmployee, user, selectedBrand, selectedStatus, selectedDept, searchTerm]);

  // User's own assigned workstation (for dedicated personal custody view)
  const myAsset = useMemo(() => {
    return (
      assets.find(
        (a) =>
          a.assignedTo === user?.employeeId ||
          a.assignedTo === user?.id ||
          (user?.name && a.assignedEmployeeName?.toLowerCase() === user.name.toLowerCase())
      ) || assets[0]
    );
  }, [assets, user]);

  // Metric Computations
  const totalCount = assets.length;
  const asusInternAssets = assets.filter((a) => a.brand === 'ASUS' && a.status === 'In Use');
  const hpEmployeeAssets = assets.filter((a) => a.brand === 'HP' && a.status === 'In Use');
  const availableCount = assets.filter((a) => a.status === 'Available').length;
  const maintenanceCount = assets.filter((a) => a.status === 'Under Maintenance').length;

  // Chart Data: Brand Distribution
  const brandChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach((a) => {
      const b = a.brand || 'Other';
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: BRAND_COLORS[name] || '#64748b',
    }));
  }, [assets]);

  // Chart Data: Department Allocation
  const deptChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'Cloud Lab (Interns)': 0,
      'IT & Engineering': 0,
      'Human Resources': 0,
      'Contract Ops': 0,
      'Executive Board': 0,
      'IT Reserve': 0,
    };

    assets.forEach((a) => {
      if (a.status === 'Available' || a.status === 'Under Maintenance') {
        counts['IT Reserve']++;
      } else if (a.assignedDepartment?.includes('Cloud Lab')) {
        counts['Cloud Lab (Interns)']++;
      } else if (a.assignedDepartment?.includes('Engineering')) {
        counts['IT & Engineering']++;
      } else if (a.assignedDepartment?.includes('Human')) {
        counts['Human Resources']++;
      } else if (a.assignedDepartment?.includes('Contract')) {
        counts['Contract Ops']++;
      } else if (a.assignedDepartment?.includes('Executive')) {
        counts['Executive Board']++;
      } else {
        counts['IT & Engineering']++;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name: name.replace(' (Interns)', ''),
      count,
    }));
  }, [assets]);

  const handleCopySerial = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Asset Code,Device Name,Brand,Model,Serial Number,Assigned Employee,Employee ID,Department,Status,Condition'];
    const rows = visibleAssets.map((a) =>
      `"${a.assetCode}","${a.assetName}","${a.brand || 'HP'}","${a.model || ''}","${a.serialNumber}","${a.assignedEmployeeName || 'Unassigned'}","${a.assignedTo || ''}","${a.assignedDepartment || ''}","${a.status}","${a.condition || 'Good'}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ETHX_Asset_Hardware_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: AssetRecord = {
      id: `AST-CUSTOM-${Date.now()}`,
      assetCode: newAsset.assetCode || `ETHX-${newAsset.brand.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      assetName: newAsset.assetName || `${newAsset.brand} ${newAsset.model || 'Enterprise Laptop'}`,
      category: 'Laptop',
      brand: newAsset.brand,
      model: newAsset.model || 'Standard Workstation',
      specifications: newAsset.specifications || 'Intel Core i5 • 16GB RAM • 512GB SSD',
      serialNumber: newAsset.serialNumber || `SN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      assignedTo: newAsset.assignedTo,
      assignedEmployeeName: newAsset.assignedEmployeeName,
      assignedDepartment: newAsset.assignedDepartment,
      allocatedDate: new Date().toISOString().split('T')[0],
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyExpiry: '2027-10-01',
      status: newAsset.status,
      condition: 'Brand New',
    };

    const updated = [newRecord, ...assets];
    setAssets(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ethx_assets', JSON.stringify(updated));
    }

    setProvisionSuccessMsg(`Asset ${newRecord.assetCode} successfully provisioned!`);
    setIsProvisionModalOpen(false);
    setTimeout(() => setProvisionSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Banner & Hero Section */}
      <div className="relative rounded-2xl p-6 bg-gradient-to-r from-[#0d1322] via-[#111827] to-[#1c0f1c] border border-white/10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider">
                <Laptop className="w-3.5 h-3.5 text-sky-400" />
                Enterprise Hardware Ledger
              </span>
              <span className="text-slate-400 text-xs font-mono">• 100% Custody Parity</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              {isEmployee ? 'My Allocated Workstation & IT Custody' : 'Workforce Asset Management & Hardware Fleet'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isEmployee
                ? `Authorized corporate workstation custody for ${user?.name || 'Krishna Tiwari'} (${user?.employeeId || 'ETHX-021'}). Device specifications, BitLocker encryption telemetry, and IT support.`
                : 'Comprehensive hardware telemetry: Asus Vivobook intern cohort deployment, HP Enterprise employee fleet, warranty schedules, and MDM compliance.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold shadow-lg hover:border-white/20 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-brand-red" />
              <span>{isEmployee ? 'Download Custody Pass (CSV)' : 'Export Asset Roster (CSV)'}</span>
            </button>
            {!isEmployee && (
              <button
                onClick={() => setIsProvisionModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold shadow-glow-red-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Provision New Device</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Alert Toast */}
        {provisionSuccessMsg && (
          <div className="relative z-10 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{provisionSuccessMsg}</span>
            </div>
            <button onClick={() => setProvisionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Interactive Filtering Toolbar — Strictly reserved for HR / IT Administrators */}
        {!isEmployee && (
          <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Filter Fleet:
              </span>

              {/* Brand Filter */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-black/40 border border-white/10 text-slate-200 rounded-lg px-3 py-1.5 focus:border-brand-red focus:outline-none text-xs"
              >
                <option value="All">All Hardware Brands ({totalCount})</option>
                <option value="ASUS">ASUS Vivobook — Interns (8)</option>
                <option value="HP">HP Enterprise — Employees (15)</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-black/40 border border-white/10 text-slate-200 rounded-lg px-3 py-1.5 focus:border-brand-red focus:outline-none text-xs"
              >
                <option value="All">All Statuses ({totalCount})</option>
                <option value="In Use">In Active Custody ({totalCount - availableCount - maintenanceCount})</option>
                <option value="Available">Available in IT Store ({availableCount})</option>
                <option value="Under Maintenance">Under Maintenance ({maintenanceCount})</option>
              </select>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-black/40 border border-white/10 text-slate-200 rounded-lg px-3 py-1.5 focus:border-brand-red focus:outline-none text-xs"
              >
                <option value="All">All Departments</option>
                <option value="Cloud Lab">Cloud Lab (Interns)</option>
                <option value="Engineering">IT &amp; Engineering</option>
                <option value="Human">Human Resources</option>
                <option value="Contract">Contract Operations</option>
                <option value="Executive">Executive Board</option>
              </select>
            </div>

            {/* Real-time Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tag, serial, employee, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>
        )}
      </div>

      {/* Hardware Telemetry / KPI Cards: Scoped to Employee Custody vs Executive Fleet */}
      {isEmployee ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Allocated Workstation"
            value={myAsset ? myAsset.assetName : 'Workstation Assigned'}
            subtitle={myAsset ? `${myAsset.brand} • ${myAsset.model || 'Standard Build'}` : 'Authorized Workstation'}
            icon={Laptop}
            variant={myAsset?.brand === 'ASUS' ? 'blue' : 'red'}
            change={{ value: myAsset ? myAsset.assetCode : 'Active', isPositive: true }}
          />
          <StatCard
            title="Custody Status"
            value={myAsset ? myAsset.status : 'Active Custody'}
            subtitle={`Allocated to ${user?.name || 'Krishna Tiwari'}`}
            icon={ShieldCheck}
            variant="emerald"
            change={{ value: '100% Compliant', isPositive: true }}
          />
          <StatCard
            title="MDM & Endpoint Security"
            value="BitLocker Active"
            subtitle="TPM 2.0 & Intune Managed"
            icon={Shield}
            variant="emerald"
            change={{ value: 'Zero Vulnerabilities', isPositive: true }}
          />
          <StatCard
            title="Enterprise Warranty"
            value={myAsset?.warrantyExpiry ? `Exp: ${myAsset.warrantyExpiry}` : 'Active (3-Yr Care)'}
            subtitle={`${myAsset?.brand || 'OEM'} Next-Day Care`}
            icon={Wrench}
            variant="default"
            change={{ value: '24/7 IT Helpdesk', isPositive: true }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Inventory"
            value={`${totalCount} Units`}
            subtitle="Workstations & Hardware"
            icon={Laptop}
            variant="red"
            change={{ value: '100% Accounted', isPositive: true }}
          />
          <StatCard
            title="Intern Asus Fleet"
            value={`${asusInternAssets.length} Vivobooks`}
            subtitle="Assigned to 8 Interns"
            icon={Cpu}
            variant="blue"
            change={{ value: '100% Deployed', isPositive: true }}
          />
          <StatCard
            title="Employee HP Fleet"
            value={`${hpEmployeeAssets.length} HP Units`}
            subtitle="Enterprise Workstations"
            icon={ShieldCheck}
            variant="red"
            change={{ value: 'Core Staff & Exec', isPositive: true }}
          />
          <StatCard
            title="Available in Reserve"
            value={`${availableCount} Spares`}
            subtitle="Ready for Instant Allocation"
            icon={Layers}
            variant="emerald"
            change={{ value: 'IT Store Pune', isPositive: true }}
          />
          <StatCard
            title="MDM Security State"
            value="100% Active"
            subtitle="BitLocker & TPM 2.0"
            icon={Shield}
            variant="emerald"
            change={{ value: 'Zero Breaches', isPositive: true }}
          />
          <StatCard
            title="Service / Repair"
            value={`${maintenanceCount} Unit`}
            subtitle="Diagnostics in Progress"
            icon={Wrench}
            variant="default"
            change={{ value: 'SLA < 48h', isPositive: true }}
          />
        </div>
      )}

      {/* Fleet Distribution Visual Analytics - Strictly for HR / IT Admins */}
      {!isEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Brand & Fleet Distribution Donut */}
          <div className="lg:col-span-5">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader>
                <div>
                  <CardTitle>Hardware Fleet Topology by Brand</CardTitle>
                  <p className="text-xs text-brand-slate mt-0.5">Asus Vivobook vs. HP Enterprise Systems</p>
                </div>
              </CardHeader>

              <div className="relative h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={brandChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="#0b0f19"
                      strokeWidth={3}
                    >
                      {brandChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0b0f19',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-white font-display">{totalCount}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Units</span>
                </div>
              </div>

              <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-around text-center text-xs">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>ASUS Vivobooks</span>
                  </div>
                  <span className="text-base font-extrabold text-white mt-0.5">{asusInternAssets.length + 1}</span>
                  <span className="text-[10px] text-slate-400">8 Interns + 1 Spare</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-red" />
                    <span>HP Laptops</span>
                  </div>
                  <span className="text-base font-extrabold text-white mt-0.5">{hpEmployeeAssets.length + 2}</span>
                  <span className="text-[10px] text-slate-400">Employees &amp; Exec</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Department Allocation Bar Chart */}
          <div className="lg:col-span-7">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader>
                <div>
                  <CardTitle>Hardware Distribution by Department</CardTitle>
                  <p className="text-xs text-brand-slate mt-0.5">Device deployment density across business units</p>
                </div>
              </CardHeader>

              <div className="h-60 w-full pt-3 px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0b0f19',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#e11d2e" radius={[4, 4, 0, 0]} name="Assigned Devices" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-black/20 border-t border-white/5 flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">Custody Compliance Rate: <strong className="text-emerald-400">100%</strong></span>
                <span className="text-slate-400">Avg Device Age: <strong className="text-white">1.1 Years</strong></span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Main Hardware Section: Role-gated */}
      {isEmployee ? (
        <div className="space-y-6">
          {myAsset ? (
            <Card className="p-6 relative overflow-hidden border-white/10 bg-gradient-to-br from-[#0c121e] to-[#121929]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-white/10">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-4 rounded-2xl border ${
                      myAsset.brand === 'ASUS'
                        ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <Laptop className="w-9 h-9" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/20">
                        {myAsset.assetCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          myAsset.brand === 'ASUS'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {myAsset.brand}
                      </span>
                      <Badge variant={myAsset.status === 'In Use' ? 'success' : 'info'}>
                        {myAsset.status}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Custody Verified
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white font-display">{myAsset.assetName}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Model: {myAsset.model || 'Enterprise Deployment'} • Allocated to {user?.name} ({user?.employeeId})
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Serial Number</span>
                      <span className="text-xs font-mono font-bold text-white">{myAsset.serialNumber}</span>
                    </div>
                    <button
                      onClick={() => handleCopySerial(myAsset.serialNumber)}
                      className="p-1 hover:text-white text-slate-400 rounded transition-colors"
                      title="Copy Serial Number"
                    >
                      {copiedSerial === myAsset.serialNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveAsset(myAsset)}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all"
                  >
                    View Full Specs
                  </button>
                </div>
              </div>

              {/* Hardware & Security Telemetry Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    <span>Hardware Specifications</span>
                  </div>
                  <p className="text-xs font-semibold text-white leading-relaxed">
                    {myAsset.specifications || 'Intel Core i5 / AMD Ryzen • 16GB RAM • 512GB SSD'}
                  </p>
                </div>

                <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>BitLocker Drive Encryption</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-300">XTS-AES 256-bit Active</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">TPM 2.0 Hardware Key Root</span>
                </div>

                <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-red" />
                    <span>Custody Allocation Period</span>
                  </div>
                  <p className="text-xs font-semibold text-white">
                    Since: {myAsset.allocatedDate || 'March 2024'}
                  </p>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Warranty Valid to: {myAsset.warrantyExpiry || 'October 2027'}
                  </span>
                </div>

                <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>IT Support SLA</span>
                  </div>
                  <p className="text-xs font-semibold text-white">Pune Enterprise NOC</p>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Response Guarantee &lt; 2 Hours</span>
                </div>
              </div>

              {/* Custody Compliance & Helpdesk Notice */}
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-white block">Corporate IT Custody Acknowledgment</span>
                    <span className="text-slate-400">
                      Workstation custody is registered to your corporate identity. Unauthorized resale, transfer, or disabling MDM is strictly prohibited.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`IT ticket generated for asset ${myAsset.assetCode}. An IT engineer will reach out to ${user?.name}.`)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all whitespace-nowrap"
                  >
                    Report IT Issue
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 rounded-lg bg-brand-red hover:bg-brand-red-hover text-white text-xs font-semibold transition-all whitespace-nowrap"
                  >
                    Download Pass
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Laptop className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-white">No Hardware Allocated</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No workstation is currently assigned to employee ID {user?.employeeId || 'ETHX-021'}. Please reach out to your HR administrator or IT Helpdesk.
              </p>
            </Card>
          )}
        </div>
      ) : (
        /* Main Hardware Custody Ledger (Admin view with all company fleet) */
        <Card className="p-0 overflow-hidden">
          <CardHeader className="p-4 border-b border-white/5 mb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Company IT Asset &amp; Workstation Custody Ledger</CardTitle>
              <p className="text-xs text-brand-slate mt-0.5">
                Showing {visibleAssets.length} of {totalCount} total hardware assets
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold text-[11px]">
                <Cpu className="w-3 h-3" />
                8 Asus Vivobook Interns
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red font-semibold text-[11px]">
                <Laptop className="w-3 h-3" />
                HP Employee Fleet
              </span>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-dark-subtle/80 border-b border-brand-border text-brand-slate uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Asset Code</th>
                  <th className="py-3 px-4">Brand &amp; Device</th>
                  <th className="py-3 px-4">Hardware Specifications</th>
                  <th className="py-3 px-4">Assigned Personnel</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Custody Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-brand-slate">
                      <Laptop className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-white">No hardware matches your filter criteria</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting the search or brand filter above.</p>
                    </td>
                  </tr>
                ) : (
                  visibleAssets.map((a) => {
                    const isAsus = a.brand === 'ASUS';
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setActiveAsset(a)}
                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-brand-red group-hover:text-brand-red-hover transition-colors">
                            {a.assetCode}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isAsus
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {a.brand || 'HP'}
                            </span>
                            <div>
                              <div className="font-bold text-white group-hover:text-brand-ink">{a.assetName}</div>
                              <div className="text-[10px] text-slate-400">{a.model}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                          {a.specifications ? (
                            <span className="truncate block" title={a.specifications}>
                              {a.specifications}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Standard Enterprise Build</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {a.assignedEmployeeName ? (
                            <div>
                              <div className="font-semibold text-white">{a.assignedEmployeeName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {a.assignedTo} • {a.assignedDepartment || 'General'}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 italic bg-white/5 px-2 py-0.5 rounded">
                              IT Reserve Spare
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-slate-300">
                            <span>{a.serialNumber}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySerial(a.serialNumber);
                              }}
                              className="p-1 hover:text-white text-slate-500 rounded transition-colors"
                              title="Copy Serial Number"
                            >
                              {copiedSerial === a.serialNumber ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              a.status === 'In Use'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : a.status === 'Available'
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                a.status === 'In Use'
                                  ? 'bg-emerald-400'
                                  : a.status === 'Available'
                                  ? 'bg-sky-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                            {a.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAsset(a);
                            }}
                            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all text-[11px] font-medium"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Asset Inspection Slide-over / Modal */}
      {activeAsset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f1422] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setActiveAsset(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl border ${
                  activeAsset.brand === 'ASUS'
                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                <Laptop className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/20">
                    {activeAsset.assetCode}
                  </span>
                  <Badge variant={activeAsset.status === 'In Use' ? 'success' : 'info'}>
                    {activeAsset.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{activeAsset.assetName}</h3>
                <p className="text-xs text-slate-400">{activeAsset.model || 'Enterprise Workstation'}</p>
              </div>
            </div>

            {/* Hardware Specification Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-black/40 p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Manufacturer / Brand</span>
                <span className="font-semibold text-white">{activeAsset.brand || 'HP'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Hardware Condition</span>
                <span className="font-semibold text-emerald-400">{activeAsset.condition || 'Excellent'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Detailed Specifications</span>
                <span className="font-mono text-slate-200">{activeAsset.specifications || 'Standard specifications'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Serial Number</span>
                <span className="font-mono font-bold text-white">{activeAsset.serialNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Warranty Expiry</span>
                <span className="text-slate-200">{activeAsset.warrantyExpiry || 'Active 3-Year Onsite'}</span>
              </div>
            </div>

            {/* Custody Information */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs">
              <span className="font-bold text-slate-300 block text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Custody &amp; Assignment Verification
              </span>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Assigned Custodian:</span>
                <span className="font-bold text-white">{activeAsset.assignedEmployeeName || 'Unassigned (IT Store)'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Employee Code:</span>
                <span className="font-mono text-brand-red font-semibold">{activeAsset.assignedTo || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Department Unit:</span>
                <span className="text-slate-200">{activeAsset.assignedDepartment || 'General Operations'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Security Encryption:</span>
                <span className="text-emerald-400 font-semibold">BitLocker / TPM 2.0 Enrolled</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveAsset(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Custody Agreement verified and dispatched for ${activeAsset.assignedEmployeeName || activeAsset.assetCode}`);
                }}
                className="px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold shadow-glow-red-sm"
              >
                Print Custody Undertaking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision New Device Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f1422] border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-red" />
                <h3 className="text-base font-bold text-white">Provision New IT Workstation</h3>
              </div>
              <button onClick={() => setIsProvisionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Hardware Brand</label>
                  <select
                    value={newAsset.brand}
                    onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs focus:border-brand-red focus:outline-none"
                  >
                    <option value="ASUS">ASUS (Vivobook Series)</option>
                    <option value="HP">HP (ProBook / EliteBook / ZBook)</option>
                    <option value="Apple">Apple (MacBook Pro)</option>
                    <option value="Lenovo">Lenovo (ThinkPad)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Device Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Vivobook 15 or ProBook 450"
                    value={newAsset.model}
                    onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs focus:border-brand-red focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Hardware Specifications</label>
                <input
                  type="text"
                  placeholder="e.g. Intel Core i5 • 16GB RAM • 512GB SSD"
                  value={newAsset.specifications}
                  onChange={(e) => setNewAsset({ ...newAsset, specifications: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs focus:border-brand-red focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Asset Code (Tag)</label>
                  <input
                    type="text"
                    placeholder="e.g. ETHX-VIVO-022"
                    value={newAsset.assetCode}
                    onChange={(e) => setNewAsset({ ...newAsset, assetCode: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs focus:border-brand-red focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Hardware Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ASUS-VB-99881"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs focus:border-brand-red focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Assign to Custodian Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Employee or Intern Name"
                    value={newAsset.assignedEmployeeName}
                    onChange={(e) => setNewAsset({ ...newAsset, assignedEmployeeName: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs focus:border-brand-red focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Employee ID (Code)</label>
                  <input
                    type="text"
                    placeholder="e.g. ETHX-022"
                    value={newAsset.assignedTo}
                    onChange={(e) => setNewAsset({ ...newAsset, assignedTo: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs focus:border-brand-red focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Department Allocation</label>
                <select
                  value={newAsset.assignedDepartment}
                  onChange={(e) => setNewAsset({ ...newAsset, assignedDepartment: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-xs focus:border-brand-red focus:outline-none"
                >
                  <option value="IT & Engineering (Cloud Lab)">IT &amp; Engineering (Cloud Lab Interns)</option>
                  <option value="IT & Engineering">IT &amp; Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Contract Operations">Contract Operations</option>
                  <option value="Executive Board">Executive Board</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold shadow-glow-red-sm"
                >
                  Complete Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
