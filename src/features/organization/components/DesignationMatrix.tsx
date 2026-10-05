import React, { useState } from 'react';
import { 
  Award, 
  Briefcase, 
  DollarSign, 
  Layers, 
  Plus, 
  Search, 
  X, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  Users
} from 'lucide-react';
import { JobGradeInfo, DesignationDetail } from '../types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

interface DesignationMatrixProps {
  jobGrades: JobGradeInfo[];
  designations: DesignationDetail[];
  onAddDesignation: (newDesig: DesignationDetail) => void;
}

export const DesignationMatrix: React.FC<DesignationMatrixProps> = ({
  jobGrades,
  designations,
  onAddDesignation
}) => {
  const [activeTab, setActiveTab] = useState<'grades' | 'designations'>('grades');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Designation Form
  const [desigTitle, setDesigTitle] = useState('');
  const [desigDept, setDesigDept] = useState('Engineering & Cloud Infrastructure');
  const [desigGrade, setDesigGrade] = useState('L5');
  const [desigReportsTo, setDesigReportsTo] = useState('Director of Engineering & Cloud Infrastructure');
  const [desigMin, setDesigMin] = useState('95000');
  const [desigMax, setDesigMax] = useState('125000');
  const [desigDesc, setDesigDesc] = useState('');

  const filteredGrades = jobGrades.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.levelCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDesignations = designations.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.jobGrade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDesignation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desigTitle.trim()) return;

    const newDesig: DesignationDetail = {
      id: `DES-${Math.floor(Math.random() * 90 + 10)}`,
      name: desigTitle.trim(),
      department: desigDept,
      jobGrade: desigGrade,
      reportsToDesignation: desigReportsTo.trim() || 'Department Director',
      headcount: 1,
      openOpenings: 1,
      description: desigDesc.trim() || 'Enterprise functional responsibility.',
      salaryMin: parseInt(desigMin) || 80000,
      salaryMax: parseInt(desigMax) || 120000,
    };

    onAddDesignation(newDesig);
    setIsAddModalOpen(false);
    setDesigTitle('');
    setDesigDesc('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-ink">
            Job Architecture & Enterprise Banding
          </h2>
          <p className="text-xs text-brand-slate mt-0.5">
            Leveling framework (L1 through C-Suite), salary brackets, and corporate job designations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-xl bg-brand-card border border-brand-border p-1">
            <button
              onClick={() => setActiveTab('grades')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'grades' ? 'bg-brand-red text-white shadow-glow-red-sm' : 'text-brand-slate hover:text-white'
              }`}
            >
              Career Ladder Bands
            </button>
            <button
              onClick={() => setActiveTab('designations')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'designations' ? 'bg-brand-red text-white shadow-glow-red-sm' : 'text-brand-slate hover:text-white'
              }`}
            >
              Designations Directory ({designations.length})
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Role
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search job level, grade, or title..."
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

      {activeTab === 'grades' ? (
        /* Career Ladder Grades View */
        <div className="space-y-4">
          {filteredGrades.map((grade) => (
            <div
              key={grade.grade}
              className="bg-brand-card border border-brand-border/80 rounded-2xl p-5 shadow-card-dark hover:border-brand-red/40 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Grade badge, Title, Category */}
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-brand-red/10 border border-brand-red/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-brand-slate">GRADE</span>
                    <span className="text-sm font-extrabold text-brand-red font-mono">{grade.grade}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-brand-ink">{grade.title}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-brand-slate border border-white/5">
                        {grade.levelCategory}
                      </span>
                      {grade.equityEligible && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Equity Eligible
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-slate mt-1 flex items-center gap-3">
                      <span>Experience: <strong className="text-brand-ink">{grade.requiredExperienceYears}</strong></span>
                      <span>•</span>
                      <span>Target Bonus: <strong className="text-emerald-400">{grade.standardBonusPct}% Annual</strong></span>
                      <span>•</span>
                      <span>Headcount: <strong className="text-brand-ink">{grade.activeHeadcount} Active</strong></span>
                    </p>
                  </div>
                </div>

                {/* Right: Compensation Band Visualization */}
                <div className="w-full lg:w-80 space-y-1.5 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-brand-slate">Min: ${(grade.minSalary / 1000).toFixed(0)}k</span>
                    <span className="font-bold text-brand-red font-mono">Mid: ${(grade.midSalary / 1000).toFixed(0)}k</span>
                    <span className="text-brand-slate">Max: ${(grade.maxSalary / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="relative h-2 w-full bg-brand-dark rounded-full overflow-hidden border border-white/5">
                    <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-sky-500 via-brand-red to-emerald-400 opacity-80" />
                  </div>
                </div>
              </div>

              {/* Core Competencies Pills */}
              <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-brand-slate mr-1">Required Competencies:</span>
                {grade.coreCompetencies.map((comp, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium px-2.5 py-0.5 rounded-lg bg-white/5 text-brand-slate border border-white/5"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Designations Table View */
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-dark border-b border-brand-border text-brand-slate uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Designation Title</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Grade</th>
                  <th className="py-3.5 px-4">Reports To</th>
                  <th className="py-3.5 px-4">Salary Bracket</th>
                  <th className="py-3.5 px-4">Active Staff</th>
                  <th className="py-3.5 px-4">Open Roles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDesignations.map((desig) => (
                  <tr key={desig.id} className="hover:bg-brand-card-hover transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-brand-ink">{desig.name}</div>
                      <div className="font-mono text-[10px] text-brand-slate">{desig.id}</div>
                    </td>
                    <td className="py-3 px-4 text-brand-slate">
                      {desig.department}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/20">
                        {desig.jobGrade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-brand-slate text-[11px]">
                      {desig.reportsToDesignation}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-emerald-400 font-semibold">
                      ${(desig.salaryMin / 1000).toFixed(0)}k – ${(desig.salaryMax / 1000).toFixed(0)}k
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-ink">
                      {desig.headcount} Staff
                    </td>
                    <td className="py-3 px-4">
                      {desig.openOpenings > 0 ? (
                        <span className="text-emerald-400 font-bold">+{desig.openOpenings} Hiring</span>
                      ) : (
                        <span className="text-brand-slate">Filled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Designation Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New Corporate Designation"
          subtitle="Configure title, job grade ladder, reporting line, and compensation parameters."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateDesignation} className="p-6 space-y-4">
            <div>
              <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                Designation Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Site Reliability Engineer"
                value={desigTitle}
                onChange={(e) => setDesigTitle(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Department
                </label>
                <select
                  value={desigDept}
                  onChange={(e) => setDesigDept(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                >
                  <option>Engineering & Cloud Infrastructure</option>
                  <option>Human Resources & Talent Experience</option>
                  <option>Global Finance & Corporate Payroll</option>
                  <option>Enterprise Sales & Commercial Growth</option>
                  <option>Global Operations & Workplace Services</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Job Grade Band
                </label>
                <select
                  value={desigGrade}
                  onChange={(e) => setDesigGrade(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                >
                  <option value="EXEC">EXEC — Executive C-Suite</option>
                  <option value="L8">L8 — VP & Functional Director</option>
                  <option value="L7">L7 — Principal / Staff</option>
                  <option value="L6">L6 — Lead Architect</option>
                  <option value="L5">L5 — Senior Specialist</option>
                  <option value="L4">L4 — Mid Specialist</option>
                  <option value="L3">L3 — Associate</option>
                  <option value="L1/L2">L1/L2 — Intern</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Salary Band Minimum ($)
                </label>
                <input
                  type="number"
                  value={desigMin}
                  onChange={(e) => setDesigMin(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                  Salary Band Maximum ($)
                </label>
                <input
                  type="number"
                  value={desigMax}
                  onChange={(e) => setDesigMax(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                Reports To Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Director of Engineering & Cloud Infrastructure"
                value={desigReportsTo}
                onChange={(e) => setDesigReportsTo(e.target.value)}
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
                Register Designation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
