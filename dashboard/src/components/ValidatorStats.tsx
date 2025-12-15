import { Network, Shield, Radio, Database, AlertCircle } from 'lucide-react';

import { StatCard } from './ui';
import { useNodeData } from '../hooks/useNodeData';
import { formatNumber } from '../lib/utils';

export const ValidatorStats = () => {
  const { data, isLoading, error } = useNodeData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border-border animate-pulse rounded-lg border p-5">
            <div className="bg-muted mb-3 h-10 w-10 rounded-lg"></div>
            <div className="bg-muted mb-3 h-3 w-3/4 rounded"></div>
            <div className="bg-muted h-10 w-2/3 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card border-destructive/30 shadow-card rounded-lg border p-5">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-destructive" size={24} />
          <div>
            <p className="text-destructive font-semibold">Failed to load node data</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Please check your connection and try again
            </p>
          </div>
        </div>
      </div>
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
          />
        ))}
      </div>
    </div>
  );
};
