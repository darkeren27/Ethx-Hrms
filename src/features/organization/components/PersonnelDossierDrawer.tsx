import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Building, 
  Mail, 
  Phone, 
  ExternalLink, 
  MapPin, 
  Users, 
  DollarSign, 
  Award, 
  Layers, 
  ChevronRight, 
  Shuffle, 
  Laptop, 
  Calendar 
} from 'lucide-react';
import { OrgNode } from '../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Link } from 'react-router-dom';

interface PersonnelDossierDrawerProps {
  node: OrgNode | null;
  onClose: () => void;
  onSelectSubordinate: (sub: OrgNode) => void;
  onStartReorg: (node: OrgNode) => void;
  rootNode: OrgNode;
}

export const PersonnelDossierDrawer: React.FC<PersonnelDossierDrawerProps> = ({
  node,
  onClose,
  onSelectSubordinate,
  onStartReorg,
  rootNode
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hierarchy' | 'compensation'>('overview');

  if (!node) return null;

  // Find manager path up to root
  const reportingLine = React.useMemo(() => {
    const path: OrgNode[] = [];
    function findPath(curr: OrgNode, targetId: string, currentPath: OrgNode[]): boolean {
      if (curr.id === targetId) {
        path.push(...currentPath, curr);
        return true;
      }
      if (curr.children) {
        for (const child of curr.children) {
          if (findPath(child, targetId, [...currentPath, curr])) {
            return true;
          }
        }
      }
      return false;
    }
    findPath(rootNode, node.id, []);
    return path;
  }, [rootNode, node]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-brand-card border-l border-brand-border h-full shadow-card-elevated p-6 overflow-y-auto z-10 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-red" />
              <div>
                <h3 className="text-sm font-bold text-brand-ink">Personnel Executive Dossier</h3>
                <span className="text-[10px] text-brand-slate">ERPNext Synced Master Record</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-brand-slate hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Card Summary */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="relative shrink-0">
              <img
                src={node.avatar}
                alt={node.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-red shadow-glow-red-sm"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ring-2 ring-brand-card ${
                  node.status === 'In Office'
                    ? 'bg-emerald-400'
                    : node.status === 'Remote'
                    ? 'bg-sky-400'
                    : 'bg-amber-400'
                }`}
                title={node.status}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-brand-ink truncate">{node.name}</h2>
                <Badge variant="red">{node.tier}</Badge>
                {node.workModality === 'Pune HQ' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    🏢 Pune HQ
                  </span>
                ) : node.workModality === 'Contract WFH' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                    💻 Contract WFH
                  </span>
                ) : null}
              </div>
              <p className="text-xs font-semibold text-brand-red mt-0.5">{node.role}</p>
              <div className="flex items-center gap-2 text-xs text-brand-slate mt-1 flex-wrap">
                <span className="font-mono">{node.id}</span>
                <span>•</span>
                <span className="font-mono font-bold text-brand-slate bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  Grade {node.jobGrade}
                </span>
                {node.contractType && (
                  <>
                    <span>•</span>
                    <span className="text-[11px] text-brand-ink font-medium">
                      {node.contractType}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tab Controls */}
          <div className="flex items-center rounded-xl bg-brand-dark border border-brand-border p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'hierarchy'
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-white'
              }`}
            >
              Chain of Command
            </button>
            <button
              onClick={() => setActiveTab('compensation')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'compensation'
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-white'
              }`}
            >
              Compensation
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              {/* Info Matrix */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-brand-slate text-[10px] uppercase font-bold block">Department</span>
                  <span className="font-bold text-brand-ink mt-0.5 block truncate">{node.department}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-brand-slate text-[10px] uppercase font-bold block">Performance</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block">★ {node.performanceScore}% Score</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-brand-slate text-[10px] uppercase font-bold block">Direct Reports</span>
                  <span className="font-bold text-brand-ink mt-0.5 block">{node.directReportsCount} Directs</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-brand-slate text-[10px] uppercase font-bold block">Work Location</span>
                  <span className="font-bold text-brand-ink mt-0.5 block truncate">{node.location}</span>
                </div>
              </div>

              {/* Workplace & Engagement Model */}
              <div className="p-3.5 rounded-xl bg-brand-dark/80 border border-brand-border/80 space-y-2">
                <span className="text-brand-slate text-[10px] uppercase font-bold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-brand-red" />
                  Workplace & Engagement Architecture
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-brand-slate text-[10px] block">Modality</span>
                    <span className="font-bold text-brand-ink text-xs mt-0.5 block">
                      {node.workModality === 'Pune HQ' ? '🏢 Pune Global HQ' : '💻 Contract-Based WFH'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-brand-slate text-[10px] block">Engagement Model</span>
                    <span className="font-bold text-brand-ink text-xs mt-0.5 block">
                      {node.contractType || (node.workModality === 'Contract WFH' ? 'Deliverable Contract' : 'Permanent Core Staff')}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-brand-slate text-[10px] block">Reporting Base</span>
                    <span className="font-bold text-brand-ink text-xs mt-0.5 block">
                      Pune Main HQ Campus
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-brand-slate text-[10px] block">Contract Term / SLA</span>
                    <span className="font-bold text-brand-ink text-xs mt-0.5 block">
                      {node.contractPeriod || (node.workModality === 'Contract WFH' ? 'Active Deliverable SLA' : 'Permanent Employment')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio summary */}
              {node.bio && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-brand-slate block">Executive Overview</span>
                  <p className="text-brand-slate/90 leading-relaxed text-xs">
                    {node.bio}
                  </p>
                </div>
              )}

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-brand-slate block">Core Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {node.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-brand-dark text-brand-slate border border-brand-border/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Direct Communication Channels */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-bold text-brand-slate block">Communications</span>
                <a
                  href={`mailto:${node.email}`}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-brand-slate hover:text-white group transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-brand-red" />
                    <span>{node.email}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                <a
                  href={`tel:${node.phone}`}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-brand-slate hover:text-white group transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-brand-red" />
                    <span>{node.phone}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          )}

          {/* Tab 2: Chain of Command */}
          {activeTab === 'hierarchy' && (
            <div className="space-y-5 text-xs animate-in fade-in duration-150">
              {/* Upward Line */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-brand-slate block">
                  Upward Reporting Lineage
                </span>
                <div className="space-y-1.5">
                  {reportingLine.map((lineNode, index) => (
                    <div
                      key={lineNode.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        lineNode.id === node.id
                          ? 'bg-brand-red/10 border-brand-red/40 text-brand-ink font-bold'
                          : 'bg-white/[0.02] border-white/5 text-brand-slate'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={lineNode.avatar}
                          alt={lineNode.name}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-brand-border"
                        />
                        <div>
                          <div className="text-xs font-bold leading-tight">{lineNode.name}</div>
                          <div className="text-[10px] text-brand-red">{lineNode.role}</div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-brand-slate">
                        Tier {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Subordinates */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-brand-slate block">
                  Direct Subordinate Team ({node.children?.length || 0})
                </span>
                {node.children && node.children.length > 0 ? (
                  <div className="space-y-1.5">
                    {node.children.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => onSelectSubordinate(sub)}
                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-brand-red/40 cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={sub.avatar}
                            alt={sub.name}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-brand-border"
                          />
                          <div>
                            <div className="text-xs font-bold text-brand-ink group-hover:text-brand-red transition-colors">
                              {sub.name}
                            </div>
                            <div className="text-[10px] text-brand-slate">{sub.role}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-brand-slate group-hover:text-white" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-slate italic p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    No direct reports assigned. Operates as an Individual Contributor (IC).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Compensation & Assets */}
          {activeTab === 'compensation' && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-brand-slate">Annual Base Salary</span>
                  <span className="font-mono font-extrabold text-sm text-brand-ink">
                    ${node.baseSalary.toLocaleString()} USD
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-brand-slate">Standard Performance Bonus</span>
                  <span className="font-bold text-emerald-400">15% - 25% Target</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-brand-slate">Equity & Stock Options</span>
                  <span className="font-bold text-purple-400">Vesting Active (4-yr schedule)</span>
                </div>
              </div>

              {/* Hardware / Credentials */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-brand-slate block">Assigned Corporate Assets</span>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                  <Laptop className="w-4 h-4 text-brand-red shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-brand-ink block truncate">MacBook Pro 16" M3 Max</span>
                    <span className="text-[10px] font-mono text-brand-slate">AST-MBP-9901 • Secure Cloud Enclave</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-5 border-t border-white/10 space-y-2.5">
          <div className="flex items-center gap-2">
            <Link to={`/employees/${node.id}`} className="flex-1">
              <Button className="w-full text-xs font-bold" size="sm">
                View 360 Employee Profile
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onStartReorg(node)}
              className="flex items-center gap-1.5 text-xs"
              title="Test re-assigning this employee in sandbox"
            >
              <Shuffle className="w-3.5 h-3.5 text-brand-red" />
              Re-org Sandbox
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="w-full text-xs text-brand-slate">
            Close Dossier
          </Button>
        </div>
      </div>
    </div>
  );
};
