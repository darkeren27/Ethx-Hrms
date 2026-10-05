import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowOnHover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glowOnHover = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-brand-card border border-brand-border/70 rounded-xl p-5 shadow-card-dark transition-all duration-300',
        glowOnHover && 'hover:border-brand-red/40 hover:shadow-glow-red-sm hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('flex items-center justify-between pb-3 mb-4 border-b border-white/5', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3 className={cn('text-base font-semibold text-brand-ink tracking-tight', className)} {...props}>
    {children}
  </h3>
);
