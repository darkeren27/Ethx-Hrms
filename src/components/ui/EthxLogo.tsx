import React from 'react';
import { cn } from '../../lib/utils';

interface EthxLogoProps {
  variant?: 'full' | 'mark';
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
}

export const EthxLogo: React.FC<EthxLogoProps> = ({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  showBadge = false,
  badgeText = 'HRMS',
  className,
}) => {
  const sizes = {
    sm: { img: 'h-6', mark: 'w-7 h-7', text: 'text-[9px]' },
    md: { img: 'h-8', mark: 'w-9 h-9', text: 'text-[10px]' },
    lg: { img: 'h-10', mark: 'w-11 h-11', text: 'text-xs' },
    xl: { img: 'h-14', mark: 'w-14 h-14', text: 'text-xs' },
  };

  const currentSize = sizes[size] || sizes.md;
  const logoSrc = theme === 'dark' ? '/brand/ethx-logo-footer.png' : '/brand/ethx-logo-transparent.png';

  if (variant === 'mark') {
    return (
      <div className={cn('flex items-center gap-2 select-none', className)}>
        <img
          src="/icon.png"
          alt="ETHX Softcon"
          className={cn(currentSize.mark, 'object-contain rounded-lg shadow-glow-red-sm')}
        />
        {showBadge && (
          <span className={cn(
            'font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-brand-red text-white uppercase shadow-glow-red-sm',
            currentSize.text
          )}>
            {badgeText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <img
        src={logoSrc}
        alt="ETHX Softcon"
        className={cn(currentSize.img, 'w-auto object-contain transition-transform duration-200')}
      />
      {showBadge && (
        <span className={cn(
          'font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-brand-red/15 text-brand-red border border-brand-red/35 uppercase shadow-glow-red-sm',
          currentSize.text
        )}>
          {badgeText}
        </span>
      )}
    </div>
  );
};
