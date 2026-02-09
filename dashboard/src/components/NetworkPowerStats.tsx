import { Zap, Leaf, Battery } from 'lucide-react';
import { ReactNode } from 'react';

import { ErrorCard, StatCard } from './ui';
import {
  useNetworkPowerCalculations,
  AVERAGE_NODE_POWER_W,
} from '../hooks/useNetworkPowerCalculations';

interface CardConfig {
  label: string;
  rawValue: number;
  suffix: string;
  decimals: number;
  icon: ReactNode;
  colorClass: string;
  infoContent?: ReactNode;
}

const SkeletonSection = ({ title, count }: { title: string; count: number }) => (
  <div>
    <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
      {title}
    </h3>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border-border animate-pulse rounded-lg border p-5">
          <div className="bg-muted mb-3 h-4 w-3/4 rounded"></div>
          <div className="bg-muted h-8 w-1/2 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const CardSection = ({ title, cards }: { title: string; cards: CardConfig[] }) => (
  <div>
    <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
      {title}
    </h3>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          rawValue={card.rawValue}
          suffix={card.suffix}
          decimals={card.decimals}
          icon={card.icon}
          colorClass={card.colorClass}
          infoContent={card.infoContent}
        />
      ))}
    </div>
  </div>
);

const SECTION_TITLES = {
  power: 'Instantaneous Power Consumption',
  energy: 'Annualized Energy Consumption',
  emissions: 'Greenhouse Gas Emissions',
};

export const NetworkPowerStats = () => {
  const { metrics, isLoading, error } = useNetworkPowerCalculations();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonSection title={SECTION_TITLES.power} count={3} />
        <SkeletonSection title={SECTION_TITLES.energy} count={3} />
        <SkeletonSection title={SECTION_TITLES.emissions} count={3} />
      </div>
    );
  }

  if (error || !metrics) {
    return <ErrorCard title="Failed to load power statistics" />;
  }

  const powerCards: CardConfig[] = [
    {
      label: 'Average Node Power',
      rawValue: AVERAGE_NODE_POWER_W,
      suffix: ' W',
      decimals: 0,
      icon: <Zap size={24} strokeWidth={2} />,
      colorClass: 'text-stat-blue',
      infoContent: (
        <>
          Average node power estimate based on{' '}
          <a
            href="https://26119259.fs1.hubspotusercontent-eu1.net/hubfs/26119259/Website-2024/PDFs/Proof%20of%20Stake%20Blockchain%20Efficiency%20Framework.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stat-blue underline"
          >
            Proof of Stake Blockchain Efficiency Framework (PDF)
          </a>
        </>
      ),
    },
    {
      label: 'Average Mainnet Power',
      rawValue: metrics.mainnetPowerKW,
      suffix: ' kW',
      decimals: 2,
      icon: <Zap size={24} strokeWidth={2} />,
      colorClass: 'text-stat-green',
    },
    {
      label: 'Average Validation Power',
      rawValue: metrics.validatorPowerKW,
      suffix: ' kW',
      decimals: 2,
      icon: <Zap size={24} strokeWidth={2} />,
      colorClass: 'text-stat-teal',
    },
  ];

  const energyCards: CardConfig[] = [
    {
      label: 'Annualized Node Energy',
      rawValue: metrics.nodeEnergyKWh,
      suffix: ' kWh',
      decimals: 2,
      icon: <Battery size={24} strokeWidth={2} />,
      colorClass: 'text-stat-blue',
    },
    {
      label: 'Annualized Mainnet Energy',
      rawValue: metrics.mainnetEnergyKWh,
      suffix: ' kWh',
      decimals: 2,
      icon: <Battery size={24} strokeWidth={2} />,
      colorClass: 'text-stat-green',
    },
    {
      label: 'Annualized Validation Energy',
      rawValue: metrics.validatorEnergyKWh,
      suffix: ' kWh',
      decimals: 2,
      icon: <Battery size={24} strokeWidth={2} />,
      colorClass: 'text-stat-teal',
    },
  ];

  const emissionsCards: CardConfig[] = [
    {
      label: 'Weighted Avg. Emissions Intensity',
      rawValue: metrics.weightedAvgEmissionsIntensity,
      suffix: ' gCO₂e/kWh',
      decimals: 2,
      icon: <Leaf size={24} strokeWidth={2} />,
      colorClass: 'text-stat-blue',
    },
    {
      label: 'Annualized MainNet GHG Emissions',
      rawValue: metrics.annualizedMainnetGHGEmissions,
      suffix: ' tCO₂e/y',
      decimals: 2,
      icon: <Leaf size={24} strokeWidth={2} />,
      colorClass: 'text-stat-green',
    },
    {
      label: 'Annualized Validation GHG Emissions',
      rawValue: metrics.annualizedValidationGHGEmissions,
      suffix: ' tCO₂e/y',
      decimals: 2,
      icon: <Leaf size={24} strokeWidth={2} />,
      colorClass: 'text-stat-teal',
    },
  ];

  return (
    <div className="space-y-6">
      <CardSection title={SECTION_TITLES.power} cards={powerCards} />
      <CardSection title={SECTION_TITLES.energy} cards={energyCards} />
      <CardSection title={SECTION_TITLES.emissions} cards={emissionsCards} />
    </div>
  );
};
