import { Network, Shield, Radio, Database } from 'lucide-react';

import { ErrorCard, StatCard } from './ui';
import { Skeleton } from './ui/skeleton';
import { useNodeData } from '../hooks/useNodeData';

const GRID_CLASSES = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4';

export const ValidatorStats = () => {
  const { data, isLoading, error } = useNodeData();

  if (error || (!isLoading && !data)) {
    return <ErrorCard title="Failed to load node data" />;
  }

  if (isLoading) {
    return (
      <div>
        <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          Network Statistics
        </h3>
        <div className={GRID_CLASSES}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border-border rounded-lg border p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="mt-0.5 h-6 w-6 shrink-0 rounded" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-3 w-24" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: 'Total Nodes',
      rawValue: data.totalNodes,
      colorClass: 'text-stat-green',
      icon: <Network size={24} strokeWidth={2} />,
    },
    {
      label: 'Validators',
      rawValue: data.validators,
      colorClass: 'text-stat-teal',
      icon: <Shield size={24} strokeWidth={2} />,
      infoContent: 'Assuming 1 Node per Validator Account (worst case scenario)',
    },
    {
      label: 'Relay Nodes',
      rawValue: data.relays,
      colorClass: 'text-stat-cyan',
      icon: <Radio size={24} strokeWidth={2} />,
    },
    {
      label: 'Archival Nodes',
      rawValue: data.archivers,
      colorClass: 'text-stat-indigo',
      icon: <Database size={24} strokeWidth={2} />,
    },
  ];

  return (
    <div>
      <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        Network Statistics
      </h3>
      <div className={GRID_CLASSES}>
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            rawValue={stat.rawValue}
            decimals={0}
            icon={stat.icon}
            colorClass={stat.colorClass}
            infoContent={stat.infoContent}
          />
        ))}
      </div>
    </div>
  );
};
