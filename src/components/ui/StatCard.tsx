import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number | string;
    isPositive: boolean;
    period?: string;
  };
  icon: LucideIcon;
  variant?: 'default' | 'red' | 'blue' | 'emerald';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  variant = 'default',
}) => {
  const iconVariants = {
    default: 'bg-white/5 text-brand-ink border-white/10',
    red: 'bg-brand-red/15 text-brand-red-hover border-brand-red/30 shadow-glow-red-sm',
    blue: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-card-dark relative overflow-hidden group hover:border-brand-red/40 transition-all duration-300">
      {/* Subtle background red glow on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full blur-2xl group-hover:bg-brand-red/10 transition-colors pointer-events-none" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-slate">{title}</p>
          <h3 className="text-2xl font-extrabold text-brand-ink mt-1.5 tracking-tight font-display">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-brand-slate/80 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-xl border', iconVariants[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {change && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs">
          {change.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className={cn('font-semibold', change.isPositive ? 'text-emerald-400' : 'text-red-400')}>
            {change.value}
          </span>
          <span className="text-brand-slate">{change.period || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
};
