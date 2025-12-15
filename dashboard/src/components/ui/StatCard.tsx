import { Info } from 'lucide-react';
import { ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useCountUp } from '../../hooks/useCountUp';
import { formatNumber } from '../../lib/utils';

/**
 * Props for the StatCard component
 *
 * @interface StatCardProps
 */
export interface StatCardProps {
  /** Label text (displayed uppercase) */
  label: string;
  /** Formatted value to display (pre-formatted fallback) */
  value: string;
  /** Icon node (typically from lucide-react, 24px) */
  icon: ReactNode;
  /** Tailwind color class applied to icon and value (e.g., 'text-stat-green') */
  colorClass: string;
  /** Optional numeric value for animated counter */
  rawValue?: number;
  /** Optional suffix for the value (e.g., ' W', ' MWh', ' tCO₂e/y') */
  suffix?: string;
  /** Optional decimal places for formatting (default: 2) */
  decimals?: number;
  /** Optional animation duration in milliseconds (default: 2000) */
  animationDuration?: number;
  /** Optional info popover content */
  infoContent?: ReactNode;
  /** Optional info popover title */
  infoTitle?: string;
}

/**
 * StatCard - Displays a statistic with icon, label, and formatted value
 *
 * Used throughout the dashboard for consistent metric display. Supports animated
 * counters that count from 0 to the final value, with automatic respect for
 * prefers-reduced-motion accessibility setting.
 *
 * @example
 * // Simple static display
 * <StatCard
 *   label="Total Nodes"
 *   value="1,234"
 *   icon={<Network size={24} />}
 *   colorClass="text-stat-green"
 * />
 *
 * @example
 * // Animated counter
 * <StatCard
 *   label="Total Nodes"
 *   value="1,234"
 *   rawValue={1234}
 *   decimals={0}
 *   icon={<Network size={24} />}
 *   colorClass="text-stat-green"
 * />
 *
 * @example
 * // Animated with suffix
 * <StatCard
 *   label="Average Power"
 *   value="40 W"
 *   rawValue={40}
 *   suffix=" W"
 *   decimals={0}
 *   icon={<Zap size={24} />}
 *   colorClass="text-stat-blue"
 * />
 */
export const StatCard = ({
  label,
  value,
  icon,
  colorClass,
  rawValue,
  suffix = '',
  decimals = 2,
  animationDuration = 2000,
  infoContent,
  infoTitle,
}: StatCardProps) => {
  // Use animated counter if rawValue is provided
  const animatedValue = useCountUp(rawValue || 0, animationDuration);

  // Determine display value: animated or pre-formatted
  const displayValue =
    rawValue !== undefined ? formatNumber(animatedValue, decimals) + suffix : value;

  return (
    <div className="bg-card border-border shadow-card relative rounded-lg border p-5">
      {/* Info icon in top-right corner */}
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

      {/* Existing flex layout unchanged */}
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
