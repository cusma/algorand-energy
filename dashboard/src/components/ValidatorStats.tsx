import { Network, Shield, Radio, Database, AlertCircle } from 'lucide-react';

import { StatCard } from './ui';
import { useNodeData } from '../hooks/useNodeData';
import { formatNumber } from '../lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Skeleton } from './ui/skeleton';

export const ValidatorStats = () => {
  const { data, isLoading, error } = useNodeData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
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
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load node data</AlertTitle>
        <AlertDescription>Please check your connection and try again</AlertDescription>
      </Alert>
    );
  }

  const stats = [
    {
      label: 'Total Nodes',
      value: formatNumber(data.totalNodes, 0),
      rawValue: data.totalNodes,
      decimals: 0,
      colorClass: 'text-stat-green',
      icon: <Network size={24} strokeWidth={2} />,
    },
    {
      label: 'Validators',
      value: formatNumber(data.validators, 0),
      rawValue: data.validators,
      decimals: 0,
      colorClass: 'text-stat-teal',
      icon: <Shield size={24} strokeWidth={2} />,
      infoContent: 'Assuming 1 Node per Validator Account (worst case scenario)',
    },
    {
      label: 'Relay Nodes',
      value: formatNumber(data.relays, 0),
      rawValue: data.relays,
      decimals: 0,
      colorClass: 'text-stat-cyan',
      icon: <Radio size={24} strokeWidth={2} />,
    },
    {
      label: 'Archival Nodes',
      value: formatNumber(data.archivers, 0),
      rawValue: data.archivers,
      decimals: 0,
      colorClass: 'text-stat-indigo',
      icon: <Database size={24} strokeWidth={2} />,
    },
  ];

  return (
    <div>
      <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        Network Statistics
      </h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            rawValue={stat.rawValue}
            decimals={stat.decimals}
            icon={stat.icon}
            colorClass={stat.colorClass}
            infoContent={stat.infoContent}
          />
        ))}
      </div>
    </div>
  );
};
