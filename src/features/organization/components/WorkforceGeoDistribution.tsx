import React from 'react';
import { 
  Globe, 
  MapPin, 
  Building2, 
  Users, 
  Clock, 
  ShieldCheck, 
  Laptop, 
  Building 
} from 'lucide-react';
import { GeoHub } from '../types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

interface WorkforceGeoDistributionProps {
  hubs: GeoHub[];
}

export const WorkforceGeoDistribution: React.FC<WorkforceGeoDistributionProps> = ({ hubs }) => {
  const totalStaff = hubs.reduce((acc, h) => acc + h.headcount, 0);
  const totalOnSite = hubs.reduce((acc, h) => acc + h.onSiteCount, 0);
  const totalHybrid = hubs.reduce((acc, h) => acc + h.hybridCount, 0);
  const totalRemote = hubs.reduce((acc, h) => acc + h.remoteCount, 0);

  const onSitePct = Math.round((totalOnSite / totalStaff) * 100);
  const hybridPct = Math.round((totalHybrid / totalStaff) * 100);
  const remotePct = Math.round((totalRemote / totalStaff) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Global Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Operating Hubs</span>
            <span className="text-2xl font-extrabold text-brand-ink">{hubs.length} Locations</span>
          </div>
          <div className="p-2.5 rounded-xl bg-brand-red/15 text-brand-red">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">On-Site Staff</span>
            <span className="text-2xl font-extrabold text-brand-ink">{totalOnSite} ({onSitePct}%)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Hybrid Staff</span>
            <span className="text-2xl font-extrabold text-brand-ink">{totalHybrid} ({hybridPct}%)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Global Remote</span>
            <span className="text-2xl font-extrabold text-purple-400">{totalRemote} ({remotePct}%)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
            <Laptop className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Global Workforce Work-Mode Ratio Meter */}
      <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-brand-ink flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-red" />
            Global Workspace Modality Breakdown
          </span>
          <span className="text-brand-slate font-mono">
            {onSitePct}% Office-based • {hybridPct}% Hybrid • {remotePct}% Fully Distributed
          </span>
        </div>
        <div className="h-2.5 w-full bg-brand-dark rounded-full overflow-hidden flex gap-1 p-0.5 border border-white/5">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${onSitePct}%` }}
            title={`On-site: ${onSitePct}%`}
          />
          <div
            className="h-full bg-sky-400 rounded-full transition-all"
            style={{ width: `${hybridPct}%` }}
            title={`Hybrid: ${hybridPct}%`}
          />
          <div
            className="h-full bg-purple-400 rounded-full transition-all"
            style={{ width: `${remotePct}%` }}
            title={`Remote: ${remotePct}%`}
          />
        </div>
      </div>

      {/* Hub Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {hubs.map((hub) => {
          return (
            <div
              key={hub.id}
              className="bg-brand-card border border-brand-border/80 rounded-2xl p-5 shadow-card-dark hover:border-brand-red/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{hub.flag}</span>
                    <div>
                      <h3 className="text-sm font-bold text-brand-ink">{hub.name}</h3>
                      <span className="text-[11px] text-brand-slate font-medium">
                        {hub.city}, {hub.country}
                      </span>
                    </div>
                  </div>
                  <Badge variant="red">{hub.id}</Badge>
                </div>

                {/* Hub Type & Location Meta */}
                <div className="space-y-1.5 text-xs text-brand-slate">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-brand-red shrink-0" />
                    <span className="font-semibold text-brand-ink">{hub.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-slate shrink-0" />
                    <span className="truncate">{hub.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-brand-slate shrink-0" />
                    <span>Timezone: <strong className="text-brand-ink font-mono">{hub.timeZone}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-slate shrink-0" />
                    <span>Site Director: <strong className="text-brand-ink">{hub.directorName}</strong></span>
                  </div>
                </div>

                {/* Workforce Count & Breakdown */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-slate font-medium">Total Staff at Site</span>
                    <span className="font-extrabold text-brand-ink text-sm">{hub.headcount} Team Members</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-white/5 text-center">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-emerald-400 font-bold block">{hub.onSiteCount}</span>
                      <span className="text-[10px] text-brand-slate">On-Site</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
                      <span className="text-sky-400 font-bold block">{hub.hybridCount}</span>
                      <span className="text-[10px] text-brand-slate">Hybrid</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <span className="text-purple-400 font-bold block">{hub.remoteCount}</span>
                      <span className="text-[10px] text-brand-slate">Remote</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-brand-slate">
                <span>ERPNext Biometric Sync: <strong>Enabled</strong></span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  ● Operational
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
