import React, { useState, useMemo } from 'react';
import { 
  Network, 
  Building, 
  Award, 
  TrendingUp, 
  Globe, 
  Target, 
  Shuffle, 
  Download, 
  Share2, 
  Printer, 
  Layers, 
  Users, 
  ShieldCheck, 
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { 
  OrgNode, 
  DepartmentDetail, 
  JobGradeInfo, 
  DesignationDetail, 
  GeoHub, 
  SuccessionPlan 
} from './types';
import { 
  INITIAL_ORG_HIERARCHY, 
  INITIAL_DEPARTMENT_DETAILS, 
  JOB_GRADES, 
  INITIAL_DESIGNATIONS_DETAIL, 
  INITIAL_GEO_HUBS, 
  INITIAL_SUCCESSION_PLANS,
  generateSpanAuditRecords,
  getSavedDepartments,
  saveDepartments,
  getSavedDesignations,
  saveDesignations
} from './orgData';
import { OrgHierarchyTree } from './components/OrgHierarchyTree';
import { DepartmentDirectory } from './components/DepartmentDirectory';
import { DesignationMatrix } from './components/DesignationMatrix';
import { SpanOfControlAudit } from './components/SpanOfControlAudit';
import { WorkforceGeoDistribution } from './components/WorkforceGeoDistribution';
import { SuccessionPlanning } from './components/SuccessionPlanning';
import { ReorgSandboxModal } from './components/ReorgSandboxModal';
import { PersonnelDossierDrawer } from './components/PersonnelDossierDrawer';
import { Button } from '../../components/ui/Button';
import { hrmsService } from '../../services/hrmsService';
import { useAuth } from '../../context/AuthContext';
import { Employee } from '../../types/hrms';

export const OrgChartPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'HR Admin' || role === 'System Administrator' || role === 'HR Executive' || role === 'Manager';
  // Navigation View Modes
  const [activeTab, setActiveTab] = useState<
    'tree' | 'departments' | 'designations' | 'span' | 'geo' | 'succession'
  >('tree');

  const [employees, setEmployees] = useState<Employee[]>([]);

  React.useEffect(() => {
    hrmsService.getEmployees().then(setEmployees);
  }, []);

  // Hierarchy Data state
  const [hierarchyData, setHierarchyData] = useState<OrgNode>(() => {
    try {
      // Clean legacy cache keys containing fake data
      localStorage.removeItem('ethx_org_hierarchy_v3');
      localStorage.removeItem('ethx_org_hierarchy_v2');
      localStorage.removeItem('ethx_org_hierarchy');

      const saved = localStorage.getItem('ethx_org_hierarchy_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.workModality && parsed.name !== 'Vikramaditya Roy' && parsed.id === 'ETHX-001') {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ORG_HIERARCHY;
  });

  // Department state with persistence
  const [departments, setDepartments] = useState<DepartmentDetail[]>(() => getSavedDepartments());

  // Designations state with persistence
  const [designations, setDesignations] = useState<DesignationDetail[]>(() => getSavedDesignations());

  // Job Grades & Hubs & Succession
  const [jobGrades] = useState<JobGradeInfo[]>(JOB_GRADES);
  const [geoHubs] = useState<GeoHub[]>(INITIAL_GEO_HUBS);
  const [successionPlans] = useState<SuccessionPlan[]>(INITIAL_SUCCESSION_PLANS);

  // Selected Node for Personnel Dossier
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

  // Re-org Sandbox Modal
  const [isReorgOpen, setIsReorgOpen] = useState<boolean>(false);
  const [reorgSuccessBanner, setReorgSuccessBanner] = useState<string | null>(null);

  // Compute Span audit records dynamically from tree
  const spanAuditRecords = useMemo(() => {
    return generateSpanAuditRecords(hierarchyData);
  }, [hierarchyData]);

  // Handle Adding Department
  const handleAddDepartment = (newDept: DepartmentDetail) => {
    const updated = [newDept, ...departments];
    setDepartments(updated);
    saveDepartments(updated);
  };

  // Handle Adding Designation
  const handleAddDesignation = (newDesig: DesignationDetail) => {
    const updated = [newDesig, ...designations];
    setDesignations(updated);
    saveDesignations(updated);
  };

  // Find node by ID across tree
  const findNodeById = (node: OrgNode, id: string): OrgNode | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Open node dossier from ID (used in tables & succession)
  const handleSelectById = (id: string) => {
    const found = findNodeById(hierarchyData, id);
    if (found) {
      setSelectedNode(found);
    }
  };

  // Apply Re-org in tree
  const handleApplyReorg = (employeeId: string, newManagerId: string, newDept: string) => {
    // Clone tree
    const rootClone: OrgNode = JSON.parse(JSON.stringify(hierarchyData));
    let movedNode: OrgNode | null = null;

    // 1. Detach node from old parent
    function detach(parent: OrgNode) {
      if (parent.children) {
        const idx = parent.children.findIndex((c) => c.id === employeeId);
        if (idx !== -1) {
          movedNode = parent.children.splice(idx, 1)[0];
          parent.directReportsCount = parent.children.length;
          return;
        }
        parent.children.forEach(detach);
      }
    }
    detach(rootClone);

    if (movedNode) {
      // 2. Attach to new manager
      function attach(target: OrgNode) {
        if (target.id === newManagerId) {
          if (!target.children) target.children = [];
          (movedNode as OrgNode).department = newDept;
          (movedNode as OrgNode).reportsToId = target.id;
          target.children.push(movedNode as OrgNode);
          target.directReportsCount = target.children.length;
          return;
        }
        if (target.children) target.children.forEach(attach);
      }
      attach(rootClone);

      setHierarchyData(rootClone);
      try {
        localStorage.setItem('ethx_org_hierarchy_v5', JSON.stringify(rootClone));
      } catch (e) {
        console.error(e);
      }

      setReorgSuccessBanner(
        `Successfully transferred ${(movedNode as OrgNode).name} to ${newDept} under new manager.`
      );
      setTimeout(() => setReorgSuccessBanner(null), 6000);
    }
  };

  // Export Org Architecture
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hierarchyData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ETHX_Org_Architecture_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Re-org Success Alert Banner */}
      {reorgSuccessBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{reorgSuccessBanner}</span>
          </div>
          <button onClick={() => setReorgSuccessBanner(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner with HR Executive Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-red bg-brand-red/10 px-3 py-1 rounded-full border border-brand-red/20 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-brand-red" />
              Executive Organization Architecture
            </span>
            <span className="text-xs text-brand-slate font-medium hidden sm:inline">
              • Synchronized with ERPNext Master Records
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-brand-ink mt-1.5 font-display tracking-tight">
            Organization Structure & Intelligence
          </h1>
          <p className="text-sm text-brand-slate mt-0.5 max-w-2xl">
            Enterprise reporting lines, business units, job band levels, management span of control, global hubs, and live re-org simulation.
          </p>
        </div>

        {/* Global Executive Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsReorgOpen(true)}
              className="flex items-center gap-2 text-xs font-bold"
            >
              <Shuffle className="w-3.5 h-3.5 text-brand-red" />
              Re-org Sandbox
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs text-brand-slate hover:text-white border border-brand-border"
            title="Download complete organizational architecture in JSON"
          >
            <Download className="w-3.5 h-3.5 text-brand-red" />
            Export Architecture
          </Button>
        </div>
      </div>

      {/* HR Executive KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-brand-card border border-brand-border/80 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-brand-slate block">Total Workforce</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-brand-ink">{employees.length || hierarchyData.totalTeamSize}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">Pune HQ + WFH</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-brand-card border border-brand-border/80 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-brand-slate block">Hierarchy Depth</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-brand-ink">4 Tiers</span>
            <span className="text-[10px] text-brand-slate font-mono">C-Suite to IC</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-brand-card border border-brand-border/80 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-brand-slate block">Avg Span Ratio</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-emerald-400">1 : 3.8</span>
            <span className="text-[10px] text-emerald-400 font-semibold">Optimal</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-brand-card border border-brand-border/80 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-brand-slate block">Active Divisions</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-brand-ink">{departments.length} Units</span>
            <span className="text-[10px] text-brand-red font-semibold">Core Ops</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-brand-card border border-brand-border/80 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-brand-slate block">Delivery Hubs</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-brand-ink">{geoHubs.length} Hubs</span>
            <span className="text-[10px] text-sky-400 font-semibold">Pune HQ + WFH</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-brand-card border border-brand-border/80 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-brand-slate block">Talent Bench</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-emerald-400">90%</span>
            <span className="text-[10px] text-emerald-400 font-semibold">High Strength</span>
          </div>
        </div>
      </div>

      {/* Navigation View Switcher Pills */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-brand-card border border-brand-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'tree'
              ? 'bg-brand-red text-white shadow-glow-red-sm'
              : 'text-brand-slate hover:text-white hover:bg-white/5'
          }`}
        >
          <Network className="w-4 h-4" />
          Hierarchy Tree
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'departments'
              ? 'bg-brand-red text-white shadow-glow-red-sm'
              : 'text-brand-slate hover:text-white hover:bg-white/5'
          }`}
        >
          <Building className="w-4 h-4" />
          Departments & Units ({departments.length})
        </button>

        <button
          onClick={() => setActiveTab('designations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'designations'
              ? 'bg-brand-red text-white shadow-glow-red-sm'
              : 'text-brand-slate hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-4 h-4" />
          Job Grades & Roles
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('span')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'span'
                ? 'bg-brand-red text-white shadow-glow-red-sm'
                : 'text-brand-slate hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Span of Control ({spanAuditRecords.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('geo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'geo'
              ? 'bg-brand-red text-white shadow-glow-red-sm'
              : 'text-brand-slate hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe className="w-4 h-4" />
          Geographic Hubs ({geoHubs.length})
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('succession')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'succession'
                ? 'bg-brand-red text-white shadow-glow-red-sm'
                : 'text-brand-slate hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-4 h-4" />
            Succession Planning ({successionPlans.length})
          </button>
        )}
      </div>

      {/* Active Tab View Body */}
      {activeTab === 'tree' && (
        <OrgHierarchyTree
          rootNode={hierarchyData}
          onSelectNode={(node) => setSelectedNode(node)}
          onStartReorg={() => setIsReorgOpen(true)}
        />
      )}

      {activeTab === 'departments' && (
        <DepartmentDirectory
          departments={departments}
          onAddDepartment={handleAddDepartment}
        />
      )}

      {activeTab === 'designations' && (
        <DesignationMatrix
          jobGrades={jobGrades}
          designations={designations}
          onAddDesignation={handleAddDesignation}
        />
      )}

      {activeTab === 'span' && (
        <SpanOfControlAudit
          records={spanAuditRecords}
          onSelectManager={handleSelectById}
        />
      )}

      {activeTab === 'geo' && (
        <WorkforceGeoDistribution
          hubs={geoHubs}
        />
      )}

      {activeTab === 'succession' && (
        <SuccessionPlanning
          plans={successionPlans}
          onSelectPerson={handleSelectById}
        />
      )}

      {/* Slide-over Personnel Dossier Drawer */}
      <PersonnelDossierDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onSelectSubordinate={(sub) => setSelectedNode(sub)}
        onStartReorg={() => {
          setSelectedNode(null);
          setIsReorgOpen(true);
        }}
        rootNode={hierarchyData}
      />

      {/* Re-org Sandbox Modal */}
      <ReorgSandboxModal
        isOpen={isReorgOpen}
        onClose={() => setIsReorgOpen(false)}
        rootNode={hierarchyData}
        departments={departments}
        onApplyReorg={handleApplyReorg}
      />
    </div>
  );
};
