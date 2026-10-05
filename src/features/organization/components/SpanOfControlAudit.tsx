import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Layers, 
  Search, 
  X, 
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { SpanAuditRecord, OrgNode } from '../types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface SpanOfControlAuditProps {
  records: SpanAuditRecord[];
  onSelectManager: (managerId: string) => void;
}

export const SpanOfControlAudit: React.FC<SpanOfControlAuditProps> = ({
  records,
  onSelectManager,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHealth, setFilterHealth] = useState<'All' | 'Optimal' | 'Under-Leveraged' | 'Overburdened'>('All');

  const filteredRecords = records.filter((rec) => {
    const matchesSearch = 
      rec.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.managerId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesHealth = filterHealth === 'All' || rec.spanHealth === filterHealth;
    return matchesSearch && matchesHealth;
  });

  const optimalCount = records.filter(r => r.spanHealth === 'Optimal').length;
  const underCount = records.filter(r => r.spanHealth === 'Under-Leveraged').length;
  const overCount = records.filter(r => r.spanHealth === 'Overburdened').length;
  const avgDirect = (records.reduce((acc, r) => acc + r.directReports, 0) / (records.length || 1)).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Audited Managers</span>
            <span className="text-2xl font-extrabold text-brand-ink">{records.length} Leaders</span>
          </div>
          <div className="p-2.5 rounded-xl bg-brand-red/15 text-brand-red">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Avg Span Ratio</span>
            <span className="text-2xl font-extrabold text-emerald-400">1 : {avgDirect}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Optimal Ratios</span>
            <span className="text-2xl font-extrabold text-emerald-400">{optimalCount} ({Math.round((optimalCount / records.length) * 100)}%)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Attention Needed</span>
            <span className="text-2xl font-extrabold text-amber-400">{underCount + overCount} Leaders</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Health Distribution Meter */}
      <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-brand-ink flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-red" />
            Executive Span Health Distribution
          </span>
          <span className="text-brand-slate font-mono">
            {optimalCount} Optimal • {underCount} Under-Leveraged • {overCount} Overburdened
          </span>
        </div>
        <div className="h-2.5 w-full bg-brand-dark rounded-full overflow-hidden flex gap-1 p-0.5 border border-white/5">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${(optimalCount / records.length) * 100}%` }}
            title="Optimal"
          />
          <div
            className="h-full bg-amber-400 rounded-full transition-all"
            style={{ width: `${(underCount / records.length) * 100}%` }}
            title="Under-Leveraged"
          />
          <div
            className="h-full bg-brand-red rounded-full transition-all"
            style={{ width: `${(overCount / records.length) * 100}%` }}
            title="Overburdened"
          />
        </div>
      </div>

      {/* Control & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search manager, role, or department..."
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

        {/* Filter Pills */}
        <div className="flex items-center rounded-xl bg-brand-card border border-brand-border p-1">
          {(['All', 'Optimal', 'Under-Leveraged', 'Overburdened'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterHealth(filter)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterHealth === filter
                  ? 'bg-brand-red text-white shadow-glow-red-sm'
                  : 'text-brand-slate hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-dark border-b border-brand-border text-brand-slate uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Manager Profile</th>
                <th className="py-3.5 px-4">Department & Level</th>
                <th className="py-3.5 px-4">Direct Reports</th>
                <th className="py-3.5 px-4">Total Sub-Team</th>
                <th className="py-3.5 px-4">Span Ratio</th>
                <th className="py-3.5 px-4">Health Status</th>
                <th className="py-3.5 px-4">HR Strategic Advisory</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRecords.map((rec) => {
                const healthVariant = 
                  rec.spanHealth === 'Optimal'
                    ? 'success'
                    : rec.spanHealth === 'Under-Leveraged'
                    ? 'warning'
                    : 'red';

                return (
                  <tr key={rec.managerId} className="hover:bg-brand-card-hover transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={rec.avatar}
                          alt={rec.managerName}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-brand-border"
                        />
                        <div>
                          <h4 className="font-bold text-brand-ink leading-tight">{rec.managerName}</h4>
                          <span className="text-[11px] text-brand-red font-semibold block">{rec.role}</span>
                          <span className="font-mono text-[10px] text-brand-slate">{rec.managerId}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-brand-ink font-semibold">{rec.department}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-brand-slate border border-white/5 inline-block mt-1">
                        Tier Level {rec.depthLevel} ({rec.tier})
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-brand-ink">
                      {rec.directReports} Directs
                    </td>

                    <td className="py-3 px-4 font-bold text-brand-slate">
                      {rec.totalReports} Personnel
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-brand-ink">
                      {rec.spanRatio}
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={healthVariant}>
                        {rec.spanHealth}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 max-w-xs text-[11px] text-brand-slate">
                      {rec.recommendation}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectManager(rec.managerId)}
                        className="text-xs text-brand-red hover:text-white"
                      >
                        Dossier
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
