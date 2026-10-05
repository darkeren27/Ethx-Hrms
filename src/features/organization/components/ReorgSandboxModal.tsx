import React, { useState } from 'react';
import { 
  Shuffle, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  DollarSign, 
  Building, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';
import { OrgNode, DepartmentDetail } from '../types';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

interface ReorgSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootNode: OrgNode;
  departments: DepartmentDetail[];
  onApplyReorg: (employeeId: string, newManagerId: string, newDept: string) => void;
}

export const ReorgSandboxModal: React.FC<ReorgSandboxModalProps> = ({
  isOpen,
  onClose,
  rootNode,
  departments,
  onApplyReorg
}) => {
  // Collect all employees flattened from rootNode
  const allEmployees = React.useMemo(() => {
    const list: OrgNode[] = [];
    function walk(n: OrgNode) {
      list.push(n);
      if (n.children) n.children.forEach(walk);
    }
    walk(rootNode);
    return list;
  }, [rootNode]);

  // Non-executive employees (candidates to be moved)
  const candidateEmployees = allEmployees.filter(e => e.id !== rootNode.id);
  // Eligible managers
  const eligibleManagers = allEmployees.filter(e => e.tier === 'C-Suite' || e.tier === 'Director' || e.tier === 'Lead Architect');

  const [selectedEmpId, setSelectedEmpId] = useState<string>(candidateEmployees[0]?.id || '');
  const [targetManagerId, setTargetManagerId] = useState<string>(eligibleManagers[1]?.id || rootNode.id);
  const [targetDeptId, setTargetDeptId] = useState<string>(departments[0]?.id || 'DEP-ENG');
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);

  const selectedEmployee = allEmployees.find(e => e.id === selectedEmpId);
  const currentManager = allEmployees.find(e => e.children?.some(c => c.id === selectedEmpId));
  const targetManager = allEmployees.find(e => e.id === targetManagerId);
  const targetDept = departments.find(d => d.id === targetDeptId);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSimulated(true);
  };

  const handleApply = () => {
    if (!selectedEmpId || !targetManagerId || !targetDept) return;
    onApplyReorg(selectedEmpId, targetManagerId, targetDept.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Organizational Re-structuring Sandbox"
      subtitle="Simulate leadership transitions, department transfers, and calculate immediate budget & span-of-control impact."
      maxWidth="xl"
    >
      <div className="p-6 space-y-5">
        {/* Sandbox Warning Banner */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-300">Executive Sandbox Simulation Active</h4>
            <p className="text-brand-slate mt-0.5">
              Changes tested here remain in memory until you commit them with <strong>Apply Permanent Re-org</strong>.
            </p>
          </div>
        </div>

        {/* Re-org Form */}
        <form onSubmit={handleSimulate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1: Select Employee */}
            <div>
              <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                1. Select Personnel
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  setHasSimulated(false);
                }}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              >
                {candidateEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: New Manager */}
            <div>
              <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                2. Target Manager
              </label>
              <select
                value={targetManagerId}
                onChange={(e) => {
                  setTargetManagerId(e.target.value);
                  setHasSimulated(false);
                }}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              >
                {eligibleManagers
                  .filter((m) => m.id !== selectedEmpId)
                  .map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name} ({mgr.tier})
                    </option>
                  ))}
              </select>
            </div>

            {/* Step 3: Target Department */}
            <div>
              <label className="block text-[11px] uppercase font-bold text-brand-slate mb-1">
                3. Target Department
              </label>
              <select
                value={targetDeptId}
                onChange={(e) => {
                  setTargetDeptId(e.target.value);
                  setHasSimulated(false);
                }}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-ink focus:outline-none focus:border-brand-red"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-red" />
              Compute Simulation Impact
            </Button>
          </div>
        </form>

        {/* Real-time Delta Analysis */}
        {hasSimulated && selectedEmployee && targetManager && targetDept && (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-brand-red/40 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-brand-red" />
                <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider">
                  Simulation Impact Analysis
                </h4>
              </div>
              <Badge variant="red">Delta Preview</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Previous Manager Shift */}
              <div className="p-3 rounded-xl bg-brand-dark/70 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-brand-slate block">
                  Current Reporting Line
                </span>
                <p className="font-bold text-brand-ink">
                  {currentManager ? currentManager.name : 'Executive Board'}
                </p>
                <span className="text-amber-400 font-semibold text-[11px] block">
                  Span of Control: {currentManager ? `${currentManager.directReportsCount} → ${Math.max(0, currentManager.directReportsCount - 1)} Directs` : 'Unchanged'}
                </span>
              </div>

              {/* Target Manager Shift */}
              <div className="p-3 rounded-xl bg-brand-dark/70 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-brand-slate block">
                  Proposed Reporting Line
                </span>
                <p className="font-bold text-brand-ink">
                  {targetManager.name}
                </p>
                <span className="text-emerald-400 font-semibold text-[11px] block">
                  Span of Control: {targetManager.directReportsCount} → {targetManager.directReportsCount + 1} Directs
                </span>
              </div>

              {/* Budget / Cost Allocation */}
              <div className="p-3 rounded-xl bg-brand-dark/70 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-brand-slate block">
                  Budget Allocation Impact
                </span>
                <p className="font-bold text-brand-red font-mono">
                  ${Math.round(selectedEmployee.baseSalary / 12).toLocaleString()} /mo
                </p>
                <span className="text-brand-slate text-[11px] block">
                  Transfers from {selectedEmployee.department} to {targetDept.name}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Span-of-control health status remains <strong>Optimal</strong> for target manager {targetManager.name}.
              </span>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Sandbox
          </Button>

          {hasSimulated && (
            <Button size="sm" onClick={handleApply} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Apply Permanent Re-org
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
