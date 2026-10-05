import React, { useState } from 'react';
import { 
  Building, 
  Users, 
  DollarSign, 
  Briefcase, 
  TrendingUp, 
  Plus, 
  Search, 
  X, 
  ExternalLink, 
  MapPin, 
  CheckCircle2, 
  Layers, 
  Eye, 
  Sparkles 
} from 'lucide-react';
import { DepartmentDetail } from '../types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Link } from 'react-router-dom';

interface DepartmentDirectoryProps {
  departments: DepartmentDetail[];
  onAddDepartment: (newDept: DepartmentDetail) => void;
}

export const DepartmentDirectory: React.FC<DepartmentDirectoryProps> = ({
  departments,
  onAddDepartment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRosterDept, setSelectedRosterDept] = useState<DepartmentDetail | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Department Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formHeadName, setFormHeadName] = useState('');
  const [formHeadId, setFormHeadId] = useState('');
  const [formHeadcount, setFormHeadcount] = useState('10');
  const [formBudget, setFormBudget] = useState('150000');
  const [formOpenPositions, setFormOpenPositions] = useState('2');
  const [formDescription, setFormDescription] = useState('');
  const [formSubUnits, setFormSubUnits] = useState('');
  const [formLocations, setFormLocations] = useState('Pune HQ (Main Campus), Contract WFH');

  // Filtered departments
  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.headName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Overall statistics
  const totalHeadcount = departments.reduce((acc, d) => acc + d.headcount, 0);
  const totalMonthlyBudget = departments.reduce((acc, d) => acc + d.monthlyBudget, 0);
  const totalOpenings = departments.reduce((acc, d) => acc + d.openPositions, 0);
  const avgHealth = Math.round(departments.reduce((acc, d) => acc + d.healthScore, 0) / (departments.length || 1));

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    const newDept: DepartmentDetail = {
      id: `DEP-${formCode.toUpperCase().replace(/\s+/g, '')}`,
      name: formName.trim(),
      code: formCode.toUpperCase().trim(),
      headOfDepartment: formHeadId.trim() || 'ETHX-001',
      headName: formHeadName.trim() || 'Ram Chaturvedi',
      headAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      headcount: parseInt(formHeadcount) || 5,
      openPositions: parseInt(formOpenPositions) || 1,
      monthlyBudget: parseInt(formBudget) || 100000,
      annualBudget: (parseInt(formBudget) || 100000) * 12,
      budgetSpent: ((parseInt(formBudget) || 100000) * 12) * 0.75,
      healthScore: 95,
      locations: formLocations.split(',').map(l => l.trim()).filter(Boolean),
      description: formDescription.trim() || 'Enterprise operational unit for organizational execution.',
      subUnits: formSubUnits.split(',').map(s => s.trim()).filter(Boolean)
    };

    onAddDepartment(newDept);
    setIsAddModalOpen(false);
    // Reset
    setFormName('');
    setFormCode('');
    setFormHeadName('');
    setFormHeadId('');
    setFormDescription('');
    setFormSubUnits('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Total Divisions</span>
            <span className="text-2xl font-extrabold text-brand-ink">{departments.length} Units</span>
          </div>
          <div className="p-2.5 rounded-xl bg-brand-red/15 text-brand-red">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Allocated Headcount</span>
            <span className="text-2xl font-extrabold text-brand-ink">{totalHeadcount} Staff</span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Monthly Burn</span>
            <span className="text-2xl font-extrabold text-brand-red">
              ${(totalMonthlyBudget / 1000).toFixed(0)}k/mo
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Department Health</span>
            <span className="text-2xl font-extrabold text-emerald-400">{avgHealth}% Index</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control bar: Search & Add Department button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search departments or directors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-card border border-brand-border rounded-xl pl-9 pr-4 py-2 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-slate hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          Create New Department
        </Button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDepts.map((dept) => {
          const spendPct = Math.round((dept.budgetSpent / dept.annualBudget) * 100) || 72;
          return (
            <div
              key={dept.id}
              className="bg-brand-card border border-brand-border/80 rounded-2xl p-5 shadow-card-dark hover:border-brand-red/50 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-red/10 text-brand-red border border-brand-red/20 group-hover:scale-105 transition-transform">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-brand-ink group-hover:text-brand-red transition-colors">
                        {dept.name}
                      </h3>
                      <span className="text-[11px] font-mono text-brand-slate">
                        Code: {dept.code} • ID: {dept.id}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {dept.healthScore}% Health
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-brand-slate/90 line-clamp-2 leading-relaxed">
                  {dept.description}
                </p>

                {/* Director Profile Row */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <img
                    src={dept.headAvatar}
                    alt={dept.headName}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-brand-border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-brand-slate block">
                      Department Director
                    </span>
                    <h4 className="text-xs font-bold text-brand-ink truncate">
                      {dept.headName}
                    </h4>
                    <span className="text-[10px] font-mono text-brand-red">
                      {dept.headOfDepartment}
                    </span>
                  </div>
                </div>

                {/* Metric Strip */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-brand-slate block">Headcount</span>
                    <span className="font-bold text-brand-ink mt-0.5 block">{dept.headcount} Staff</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-brand-slate block">Open Reqs</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">+{dept.openPositions} Open</span>
                  </div>
                </div>

                {/* Budget Gauge */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-slate">Annual Fiscal Spend</span>
                    <span className="font-mono font-bold text-brand-ink">
                      ${(dept.budgetSpent / 1000000).toFixed(2)}M / ${(dept.annualBudget / 1000000).toFixed(2)}M ({spendPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-brand-dark overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        spendPct > 90 ? 'bg-amber-400' : 'bg-gradient-to-r from-brand-red to-brand-red-hover'
                      }`}
                      style={{ width: `${Math.min(spendPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Sub-units tags */}
                {dept.subUnits && dept.subUnits.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {dept.subUnits.map((unit, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-brand-slate border border-white/5"
                      >
                        {unit}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedRosterDept(dept)}
                  className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Inspect Department Roster
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Roster Inspection Modal */}
      {selectedRosterDept && (
        <Modal
          isOpen={!!selectedRosterDept}
          onClose={() => setSelectedRosterDept(null)}
          title={`${selectedRosterDept.name} — Staff Roster`}
          subtitle={`Department Code: ${selectedRosterDept.code} • Head of Department: ${selectedRosterDept.headName}`}
          maxWidth="2xl"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-brand-slate pb-2 border-b border-white/10">
              <span>{selectedRosterDept.headcount} active personnel recorded in ERPNext Master</span>
              <span className="text-emerald-400 font-bold">+{selectedRosterDept.openPositions} Open Requisitions</span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-brand-red/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedRosterDept.headAvatar}
                    alt={selectedRosterDept.headName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-red"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-brand-ink">{selectedRosterDept.headName}</h4>
                      <Badge variant="red">Director (L8)</Badge>
                    </div>
                    <span className="text-[11px] text-brand-slate block mt-0.5">
                      Executive Department Lead • {selectedRosterDept.headOfDepartment}
                    </span>
                  </div>
                </div>
                <Link to={`/employees/${selectedRosterDept.headOfDepartment}`}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Profile
                  </Button>
                </Link>
              </div>

              {/* Sample members of this department */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center font-bold text-brand-ink text-xs">
                    RS
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-ink">Lead Architect & Senior Staff</h4>
                    <span className="text-[11px] text-brand-slate block mt-0.5">
                      Architecture, Delivery Governance & Cloud Pipelines
                    </span>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center font-bold text-brand-ink text-xs">
                    TM
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-ink">Specialist & Associate Staff (8 Members)</h4>
                    <span className="text-[11px] text-brand-slate block mt-0.5">
                      Operational execution, technical implementation, and client support
                    </span>
                  </div>
                </div>
                <Badge variant="info">In Office / Hybrid</Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedRosterDept(null)}>
                Close Roster
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create New Department Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New Organizational Department"
          subtitle="Define department leadership, initial headcount, fiscal budget, and operational location."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateDepartment} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal & Corporate Governance"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LEGAL"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Department Director Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maya Lin"
                  value={formHeadName}
                  onChange={(e) => setFormHeadName(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Director Employee ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. ETHX-022"
                  value={formHeadId}
                  onChange={(e) => setFormHeadId(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Initial Headcount
                </label>
                <input
                  type="number"
                  value={formHeadcount}
                  onChange={(e) => setFormHeadcount(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Monthly Budget ($)
                </label>
                <input
                  type="number"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Open Positions
                </label>
                <input
                  type="number"
                  value={formOpenPositions}
                  onChange={(e) => setFormOpenPositions(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                Sub-units (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Regulatory Compliance, IP Rights, Contract Governance"
                value={formSubUnits}
                onChange={(e) => setFormSubUnits(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                Mission / Description
              </label>
              <textarea
                rows={2}
                placeholder="Describe key responsibilities and goals..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red"
              />
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Provision Department
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
