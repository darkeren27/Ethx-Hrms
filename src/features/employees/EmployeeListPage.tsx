import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Download, 
  ExternalLink,
  Briefcase,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  GraduationCap,
  Users,
  Filter,
  CheckCircle2,
  Clock,
  Building,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { hrmsService } from '../../services/hrmsService';
import {
  Employee,
  EngagementCategory,
  InternshipLifecycleRecord,
  InternEvaluationRecord,
  ManagementDecisionRecord,
  EmploymentOfferRecord
} from '../../types/hrms';
import { NewEmployeeModal } from './NewEmployeeModal';
import { formatDate, formatCurrency } from '../../lib/utils';

export const EmployeeListPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [lifecycles, setLifecycles] = useState<InternshipLifecycleRecord[]>([]);
  const [evaluations, setEvaluations] = useState<InternEvaluationRecord[]>([]);
  const [decisions, setDecisions] = useState<ManagementDecisionRecord[]>([]);
  const [offers, setOffers] = useState<EmploymentOfferRecord[]>([]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedDateState, setSelectedDateState] = useState<string>('All');
  const [selectedEvalStatus, setSelectedEvalStatus] = useState<string>('All');
  const [selectedDecision, setSelectedDecision] = useState<string>('All');
  const [selectedOfferStatus, setSelectedOfferStatus] = useState<string>('All');
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      hrmsService.getEmployees(),
      hrmsService.getInternshipLifecycles(),
      hrmsService.getInternEvaluations(),
      hrmsService.getManagementDecisions(),
      hrmsService.getEmploymentOffers(),
    ]).then(([emps, lcs, evs, dcs, ofs]) => {
      setEmployees(emps);
      setLifecycles(lcs);
      setEvaluations(evs);
      setDecisions(dcs);
      setOffers(ofs);
    });
  }, []);

  // Filter logic
  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const lc = lifecycles.find((l) => l.internId === emp.id);
      const ev = evaluations.find((e) => e.internId === emp.id);
      const dc = decisions.find((d) => d.internId === emp.id);
      const ofr = offers.find((o) => o.internId === emp.id);

      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          emp.fullName.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.designation.toLowerCase().includes(q) ||
          (emp.organisationalRole && emp.organisationalRole.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (selectedCategory !== 'All' && emp.engagementCategory !== selectedCategory) {
        return false;
      }

      if (selectedRole !== 'All' && emp.organisationalRole !== selectedRole) {
        return false;
      }

      if (selectedDateState !== 'All' && lc && lc.dateState !== selectedDateState) {
        return false;
      }

      if (selectedEvalStatus !== 'All' && ev && ev.workflowStatus !== selectedEvalStatus) {
        return false;
      }

      if (selectedDecision !== 'All' && dc && dc.decision !== selectedDecision) {
        return false;
      }

      if (selectedOfferStatus !== 'All' && ofr && ofr.status !== selectedOfferStatus) {
        return false;
      }

      if (showIncompleteOnly && (!emp.missingFields || emp.missingFields.length === 0)) {
        return false;
      }

      return true;
    });
  }, [
    employees,
    lifecycles,
    evaluations,
    decisions,
    offers,
    search,
    selectedCategory,
    selectedRole,
    selectedDateState,
    selectedEvalStatus,
    selectedDecision,
    selectedOfferStatus,
    showIncompleteOnly,
  ]);

  const handleExportCSV = () => {
    const headers = 'Employee ID,Full Name,Category,Role,Department,Designation,Status,Joining Date,Email\n';
    const rows = filtered
      .map(
        (e) =>
          `"${e.employeeId}","${e.fullName}","${e.engagementCategory || ''}","${e.organisationalRole || ''}","${e.department}","${e.designation}","${e.status}","${e.joiningDate}","${e.email}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ETHX_Personnel_Roster_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Derive accurate display label from underlying records
  const getDerivedPersonnelLabel = (emp: Employee) => {
    const lc = lifecycles.find((l) => l.internId === emp.id);
    const ev = evaluations.find((e) => e.internId === emp.id);
    const dc = decisions.find((d) => d.internId === emp.id);
    const ofr = offers.find((o) => o.internId === emp.id);

    if (emp.conversionDetails?.permanentEmploymentActive) {
      return { text: 'Permanent Employment Active', variant: 'success' as const };
    }
    if (ofr?.status === 'Accepted') {
      return { text: 'Offer Accepted — Joining Pending', variant: 'warning' as const };
    }
    if (ofr?.status === 'Approved' || ofr?.status === 'Issued') {
      return { text: 'Offer Approved', variant: 'info' as const };
    }
    if (dc?.decision === 'Recommended for permanent employment') {
      return { text: 'Recommended for Employment', variant: 'info' as const };
    }
    if (emp.engagementCategory === 'Intern') {
      if (lc?.administrativeOutcome === 'Completed') {
        return { text: 'Internship Completed — Not Converted', variant: 'neutral' as const };
      }
      if (ev?.workflowStatus === 'Not Started' || ev?.workflowStatus === 'In Progress') {
        return { text: 'Evaluation Pending', variant: 'neutral' as const };
      }
      return { text: 'Unpaid Intern', variant: 'neutral' as const };
    }
    if (emp.organisationalRole === 'Company Director') {
      return { text: 'Company Director', variant: 'red' as const };
    }
    if (emp.organisationalRole === 'IT Director / Manager') {
      return { text: 'IT Director / Manager', variant: 'info' as const };
    }
    if (emp.employmentArrangement === 'Contract' || emp.organisationalRole?.includes('Contract')) {
      return { text: 'Contract Employee', variant: 'warning' as const };
    }
    return { text: emp.engagementCategory || 'Employee', variant: 'neutral' as const };
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all: employees.length,
      interns: employees.filter((e) => e.engagementCategory === 'Intern').length,
      employees: employees.filter((e) => e.engagementCategory === 'Employee' && !e.organisationalRole?.includes('HR') && !e.organisationalRole?.includes('Contract')).length,
      hr: employees.filter((e) => e.organisationalRole?.includes('HR')).length,
      directors: employees.filter((e) => e.engagementCategory === 'Company Director').length,
      contract: employees.filter((e) => e.organisationalRole?.includes('Contract') || e.employmentArrangement === 'Contract').length,
      incomplete: employees.filter((e) => e.missingFields && e.missingFields.length > 0).length,
    };
  }, [employees]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-ink">Personnel Directory</h1>
            <span className="text-xs font-mono bg-brand-red/10 text-brand-red border border-brand-red/20 px-2 py-0.5 rounded-full font-bold">
              {employees.length} Confirmed Records
            </span>
          </div>
          <p className="text-sm text-brand-slate mt-1">
            Global workforce master records linked to ERPNext Employee DocType. Strictly verified identity roster.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/internships">
            <Button size="sm" className="btn-sheen shadow-glow-red-sm">
              <GraduationCap className="w-4 h-4 mr-1.5" />
              Internship Cohort Hub (8)
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Roster Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => { setSelectedCategory('All'); setShowIncompleteOnly(false); }}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            selectedCategory === 'All' && !showIncompleteOnly
              ? 'bg-brand-red text-white shadow-glow-red-sm'
              : 'bg-white/5 text-brand-slate hover:bg-white/10 hover:text-brand-ink'
          }`}
        >
          All Personnel ({categoryCounts.all})
        </button>
        <button
          onClick={() => { setSelectedCategory('Intern'); setShowIncompleteOnly(false); }}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedCategory === 'Intern'
              ? 'bg-brand-red text-white shadow-glow-red-sm'
              : 'bg-white/5 text-brand-slate hover:bg-white/10 hover:text-brand-ink'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Unpaid Interns ({categoryCounts.interns})
        </button>
        <button
          onClick={() => { setSelectedCategory('Employee'); setShowIncompleteOnly(false); }}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            selectedCategory === 'Employee'
              ? 'bg-brand-red text-white shadow-glow-red-sm'
              : 'bg-white/5 text-brand-slate hover:bg-white/10 hover:text-brand-ink'
          }`}
        >
          General Employees ({categoryCounts.employees})
        </button>
        <button
          onClick={() => { setSelectedCategory('HR'); setShowIncompleteOnly(false); }}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            selectedCategory === 'HR'
              ? 'bg-brand-red text-white shadow-glow-red-sm'
              : 'bg-white/5 text-brand-slate hover:bg-white/10 hover:text-brand-ink'
          }`}
        >
          HR Team ({categoryCounts.hr})
        </button>
        <button
          onClick={() => { setSelectedCategory('Company Director'); setShowIncompleteOnly(false); }}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            selectedCategory === 'Company Director'
              ? 'bg-brand-red text-white shadow-glow-red-sm'
              : 'bg-white/5 text-brand-slate hover:bg-white/10 hover:text-brand-ink'
          }`}
        >
          Company Directors ({categoryCounts.directors})
        </button>
        <button
          onClick={() => { setShowIncompleteOnly(true); setSelectedCategory('All'); }}
          className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            showIncompleteOnly
              ? 'bg-amber-500 text-white'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Incomplete Profiles ({categoryCounts.incomplete})
        </button>
      </div>

      {/* Advanced Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-brand-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name (e.g. Utkarsh, Rohan), ID, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl pl-10 pr-4 py-2 text-xs text-brand-ink placeholder-brand-slate focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
            >
              <option value="All">Role: All Roles</option>
              <option value="Unpaid Intern">Unpaid Intern</option>
              <option value="Main HR">Main HR</option>
              <option value="IT HR">IT HR</option>
              <option value="IT Director / Manager">IT Director / Manager</option>
              <option value="Company Director">Company Director</option>
              <option value="Contract Employee">Contract Employee</option>
            </select>
          </div>

          <div>
            <select
              value={selectedDecision}
              onChange={(e) => setSelectedDecision(e.target.value)}
              className="w-full bg-brand-dark-subtle border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
            >
              <option value="All">Management Decision: All</option>
              <option value="Pending decision">Pending decision</option>
              <option value="Recommended for permanent employment">Recommended for Employment</option>
              <option value="Approved for offer preparation">Approved for Offer Prep</option>
              <option value="Internship extension proposed">Extension Proposed</option>
              <option value="Not selected for permanent employment">Not Selected</option>
              <option value="Decision deferred">Decision Deferred</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Enterprise Data Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-dark-subtle/80 border-b border-brand-border/80 text-brand-slate uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Personnel Identity</th>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Category & Role</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Joining / Window</th>
                <th className="py-3.5 px-4">Derived State Badge</th>
                <th className="py-3.5 px-4">Profile Completeness</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-brand-slate">
                    No matching personnel records found.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const derived = getDerivedPersonnelLabel(emp);
                  const isIntern = emp.engagementCategory === 'Intern';

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-brand-card-hover/70 transition-colors group"
                    >
                      {/* Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={emp.fullName}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                          />
                          <div>
                            <Link
                              to={`/employees/${emp.id}`}
                              className="font-bold text-brand-ink group-hover:text-brand-red transition-colors flex items-center gap-1"
                            >
                              {emp.fullName}
                            </Link>
                            <span className="text-[11px] text-brand-slate block">
                              {emp.email}
                            </span>
                            {emp.responsibility && (
                              <span className="text-[10px] text-amber-400 font-medium block">
                                Note: {emp.responsibility}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-brand-slate">
                        {emp.employeeId}
                      </td>

                      {/* Category & Role */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-brand-ink block">
                          {emp.organisationalRole || emp.engagementCategory || 'Not provided'}
                        </span>
                        <span className="text-[10px] text-brand-slate">
                          Category: {emp.engagementCategory || 'Employee'}
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="py-3.5 px-4">
                        {emp.designation === 'Not provided' ? (
                          <span className="text-brand-slate italic text-[11px]">Not provided</span>
                        ) : (
                          <span className="text-brand-ink font-semibold">{emp.designation}</span>
                        )}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        {emp.department === 'Not provided' ? (
                          <span className="text-brand-slate italic text-[11px]">Not provided</span>
                        ) : (
                          <span className="text-brand-slate font-medium">{emp.department}</span>
                        )}
                      </td>

                      {/* Joining / Window */}
                      <td className="py-3.5 px-4 text-brand-slate">
                        {isIntern ? (
                          <div>
                            <span className="font-semibold text-brand-ink">1 Jul – 30 Sep 2026</span>
                            <span className="text-[10px] text-brand-slate block">Inclusive</span>
                          </div>
                        ) : emp.joiningDate === 'Not provided' ? (
                          <span className="italic text-[11px]">Not provided</span>
                        ) : (
                          formatDate(emp.joiningDate)
                        )}
                      </td>

                      {/* Derived State Badge */}
                      <td className="py-3.5 px-4">
                        <Badge variant={derived.variant} dot>
                          {derived.text}
                        </Badge>
                      </td>

                      {/* Profile Completeness */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-brand-ink text-[11px]">
                              {emp.profileCompleteness === 'Complete' ? '100%' : `${Math.max(30, 100 - (emp.missingFields?.length || 0) * 15)}%`}
                            </span>
                            <div className="w-12 h-1.5 rounded-full bg-brand-dark overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  emp.profileCompleteness === 'Incomplete'
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-400'
                                }`}
                                style={{ width: emp.profileCompleteness === 'Complete' ? '100%' : `${Math.max(30, 100 - (emp.missingFields?.length || 0) * 15)}%` }}
                              />
                            </div>
                          </div>
                          {emp.missingFields && emp.missingFields.length > 0 && (
                            <span className="text-[10px] text-amber-400 block truncate max-w-[130px]" title={`Missing: ${emp.missingFields.join(', ')}`}>
                              Missing {emp.missingFields.length} fields
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isIntern && (
                            <Link
                              to="/internships"
                              className="px-2 py-1 rounded bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white transition-all text-xs font-semibold"
                              title="Go to Internship Lifecycle Hub"
                            >
                              Evaluate
                            </Link>
                          )}
                          <Link
                            to={`/employees/${emp.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-brand-red hover:text-white text-brand-slate transition-all text-xs font-semibold"
                          >
                            Profile <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <NewEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newEmp) => setEmployees([newEmp, ...employees])}
      />
    </div>
  );
};

export default EmployeeListPage;
