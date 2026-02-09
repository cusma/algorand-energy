import { Info } from 'lucide-react';
import { ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useCountUp } from '../../hooks/useCountUp';
import { formatNumber } from '../../lib/utils';

export interface StatCardProps {
  label: string;
  rawValue: number;
  icon: ReactNode;
  colorClass: string;
  suffix?: string;
  decimals?: number;
  animationDuration?: number;
  infoContent?: ReactNode;
  infoTitle?: string;
}

export const StatCard = ({
  label,
  rawValue,
  icon,
  colorClass,
  suffix = '',
  decimals = 2,
  animationDuration = 2000,
  infoContent,
  infoTitle,
}: StatCardProps) => {
  const animatedValue = useCountUp(rawValue, animationDuration);
  const displayValue = formatNumber(animatedValue, decimals) + suffix;

  return (
    <div className="bg-card border-border shadow-card relative rounded-lg border p-5">
      {infoContent && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground absolute top-3 right-3 transition-colors"
                aria-label="More information"
              >
                <Info size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-80" align="end" side="top" sideOffset={8}>
              {infoTitle && <h4 className="mb-2 text-sm font-semibold">{infoTitle}</h4>}
              <div className="text-xs">{infoContent}</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${colorClass}`}>{icon}</div>
        <div className="flex-1">
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p className={`font-mono text-3xl font-bold ${colorClass}`}>{displayValue}</p>
        </div>
      </div>
    </div>
  );
};
