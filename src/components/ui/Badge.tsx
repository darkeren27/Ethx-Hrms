import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 
  | 'default'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'red'
  | 'purple'
  | 'cyan'
  | 'rose';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  dot = false,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/10 text-red-400 border-red-500/30',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    outline: 'bg-transparent text-slate-300 border-slate-700',
    red: 'bg-brand-red/15 text-brand-red-hover border-brand-red/40',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  };

  const dotColors = {
    default: 'bg-slate-400',
    neutral: 'bg-slate-400',
    success: 'bg-emerald-400 animate-pulse',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-sky-400',
    outline: 'bg-slate-400',
    red: 'bg-brand-red animate-pulse',
    purple: 'bg-purple-400',
    cyan: 'bg-cyan-400',
    rose: 'bg-rose-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};

export function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case 'active':
    case 'present':
    case 'approved':
    case 'published':
    case 'completed':
    case 'paid':
    case 'in use':
      return 'success';
    case 'pending':
    case 'pending manager':
    case 'pending hr':
    case 'pending director approval':
    case 'in progress':
    case 'draft':
      return 'warning';
    case 'late':
    case 'rejected':
    case 'absent':
    case 'terminated':
      return 'danger';
    case 'on leave':
    case 'approved leave':
    case 'notice period':
    case 'screening':
      return 'info';
    case 'holiday':
    case 'weekly off':
      return 'neutral';
    case 'not recorded':
    default:
      return 'default';
  }
}
