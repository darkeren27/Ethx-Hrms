import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ArrowRight,
  Target,
  Award
} from 'lucide-react';
import { SuccessionPlan } from '../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface SuccessionPlanningProps {
  plans: SuccessionPlan[];
  onSelectPerson: (personId: string) => void;
}

export const SuccessionPlanning: React.FC<SuccessionPlanningProps> = ({
  plans,
  onSelectPerson
}) => {
  const avgBenchScore = Math.round(plans.reduce((acc, p) => acc + p.benchStrengthScore, 0) / (plans.length || 1));
  const readyNowCount = plans.reduce((acc, p) => acc + p.successors.filter(s => s.readiness === 'Ready Now').length, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Critical Roles</span>
            <span className="text-2xl font-extrabold text-brand-ink">{plans.length} Positions</span>
          </div>
          <div className="p-2.5 rounded-xl bg-brand-red/15 text-brand-red">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Bench Strength Index</span>
            <span className="text-2xl font-extrabold text-emerald-400">{avgBenchScore}%</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Ready Now Successors</span>
            <span className="text-2xl font-extrabold text-emerald-400">{readyNowCount} Leaders</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-card border border-brand-border/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-brand-slate block">Succession Coverage</span>
            <span className="text-2xl font-extrabold text-brand-red">100% Covered</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Critical Roles Cards */}
      <div className="space-y-6">
        {plans.map((plan) => {
          const flightVariant = 
            plan.currentIncumbent.flightRisk === 'Low'
              ? 'success'
              : plan.currentIncumbent.flightRisk === 'Moderate'
              ? 'warning'
              : 'red';

          return (
            <div
              key={plan.roleId}
              className="bg-brand-card border border-brand-border/80 rounded-2xl p-6 shadow-card-dark space-y-5"
            >
              {/* Header: Role & Criticality */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-brand-red bg-brand-red/10 px-2.5 py-0.5 rounded-full border border-brand-red/20">
                      {plan.criticality}
                    </span>
                    <span className="text-xs text-brand-slate">• {plan.department}</span>
                  </div>
                  <h3 className="text-base font-bold text-brand-ink mt-1">
                    {plan.roleTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-brand-slate">Talent Bench Score:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-brand-dark rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${plan.benchStrengthScore}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-400">
                      {plan.benchStrengthScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Incumbent & Successor Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Current Incumbent */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-slate block">
                    Current Key Incumbent
                  </span>
                  <div className="flex items-center gap-3.5">
                    <img
                      src={plan.currentIncumbent.avatar}
                      alt={plan.currentIncumbent.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-border"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-brand-ink">
                        {plan.currentIncumbent.name}
                      </h4>
                      <span className="font-mono text-xs text-brand-slate block">
                        {plan.currentIncumbent.id}
                      </span>
                      <span className="text-[11px] text-brand-slate mt-0.5 block">
                        Tenure: <strong className="text-brand-ink">{plan.currentIncumbent.tenure}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-brand-slate">Retention Flight Risk:</span>
                    <Badge variant={flightVariant}>
                      {plan.currentIncumbent.flightRisk} Risk
                    </Badge>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectPerson(plan.currentIncumbent.id)}
                    className="w-full text-xs text-brand-red hover:text-white"
                  >
                    View Incumbent Dossier
                  </Button>
                </div>

                {/* Successor Pipeline Column (Spanning 2 columns) */}
                <div className="lg:col-span-2 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-slate block">
                    Identified Leadership Successors ({plan.successors.length})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plan.successors.map((successor) => (
                      <div
                        key={successor.id}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 hover:border-brand-red/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={successor.avatar}
                              alt={successor.name}
                              className="w-10 h-10 rounded-full object-cover ring-1 ring-brand-border"
                            />
                            <div>
                              <h5 className="text-xs font-bold text-brand-ink">
                                {successor.name}
                              </h5>
                              <span className="text-[10px] text-brand-red font-semibold block leading-tight">
                                {successor.currentRole}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              successor.readiness === 'Ready Now'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {successor.readiness}
                          </span>
                        </div>

                        <div className="text-[11px] text-brand-slate flex items-center justify-between pt-1 border-t border-white/5">
                          <span>Performance Score:</span>
                          <span className="font-bold text-emerald-400">★ {successor.performanceRating}%</span>
                        </div>

                        {/* Development Needs */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-brand-slate font-semibold block">Development Milestone:</span>
                          <div className="flex flex-wrap gap-1">
                            {successor.developmentNeeds.map((need, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-brand-slate border border-white/5"
                              >
                                {need}
                              </span>
                            ))}
                          </div>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onSelectPerson(successor.id)}
                          className="w-full text-[11px] mt-1"
                        >
                          Review Candidate
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
