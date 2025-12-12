import { Zap, AlertCircle, Leaf } from 'lucide-react';

import { useCountryEmissions } from '../hooks/useCountryEmissions';
import { useNodeData } from '../hooks/useNodeData';
import { formatNumber, formatEnergy } from '../lib/utils';

/**
 * Average power consumption per Algorand node in watts.
 *
 * Source: "Proof of Stake Blockchain Efficiency Framework"
 * Published by: Algorand Foundation (2024)
 * URL: https://26119259.fs1.hubspotusercontent-eu1.net/hubfs/26119259/Website-2024/PDFs/Proof%20of%20Stake%20Blockchain%20Efficiency%20Framework.pdf
 *
 * Methodology: Empirical measurements of typical relay and participation nodes
 * running on standard cloud infrastructure. Based on average of multiple node
 * configurations across different hosting providers.
 *
 * @constant {number}
 */
const AVERAGE_NODE_POWER_W = 40;

/**
 * Average power consumption per node in kilowatts (derived from AVERAGE_NODE_POWER_W).
 *
 * Conversion: 40W ÷ 1000 = 0.04 kW
 * Used for energy consumption calculations with standard kWh units.
 *
 * @constant {number}
 */
const AVERAGE_NODE_POWER_KW = AVERAGE_NODE_POWER_W / 1000;

/**
 * Number of hours in a year accounting for leap years.
 *
 * Calculation: 365.25 days × 24 hours/day = 8,766 hours
 *
 * The 0.25 day accounts for leap years in the Gregorian calendar, providing
 * more accurate annualized energy consumption estimates over multi-year periods.
 *
 * @constant {number}
 */
const HOURS_PER_YEAR = 8766;

/**
 * Storage size of the Algorand ledger in gigabytes for a standard participation node.
 *
 * Source: Algorand node requirements documentation (2024)
 * Last updated: December 2024
 *
 * Note: This represents the typical ledger size for a non-archival node that
 * stores recent blocks and state. Size grows over time as the network evolves.
 *
 * @constant {number}
 */
const LEDGER_SIZE_GB = 20;

/**
 * Storage size for archival nodes and indexers in gigabytes.
 *
 * Source: Algorand archival node requirements documentation (2024)
 * Last updated: December 2024
 *
 * Archival nodes maintain the complete blockchain history from genesis, requiring
 * significantly more storage than standard participation nodes. Indexers require
 * similar storage for maintaining queryable blockchain data.
 *
 * Note: This size increases over time as the blockchain grows. Regular updates
 * to this constant may be necessary.
 *
 * @constant {number}
 */
const ARCHIVE_INDEXER_SIZE_GB = 4700;

/**
 * Average annualized carbon emissions intensity for SSD storage in kgCO2e per GB per year.
 *
 * Source: Life Cycle Assessment of Data Storage (industry studies)
 * Methodology: Amortized manufacturing emissions + operational energy over typical
 * 5-year SSD lifespan, including:
 * - Manufacturing (mining, processing, assembly)
 * - Transportation
 * - Operational energy (idle and active power draw)
 * - End-of-life disposal
 *
 * Value: 0.02 kgCO2e/GB/year
 *
 * Note: This is an industry average estimate. Actual emissions vary based on:
 * - SSD technology (QLC, TLC, MLC)
 * - Manufacturing location and processes
 * - Energy grid carbon intensity at data center
 * - Storage utilization rates
 *
 * @constant {number}
 */
const AVG_SSD_ANNUALIZED_EMISSIONS_INTENSITY = 0.02;

export const NetworkPowerStats = () => {
  const { data, isLoading, error } = useNodeData();
  const {
    data: emissionsData,
    isLoading: emissionsLoading,
    error: emissionsError,
  } = useCountryEmissions();

  // Loading state
  if (isLoading || emissionsLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border-border animate-pulse rounded-lg border p-5">
            <div className="bg-muted mb-3 h-4 w-3/4 rounded"></div>
            <div className="bg-muted h-8 w-1/2 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data || emissionsError || !emissionsData) {
    return (
      <div className="bg-card border-destructive/30 shadow-card rounded-lg border p-5">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-destructive" size={24} />
          <div>
            <p className="text-destructive font-semibold">Failed to load power statistics</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Please check your connection and try again
            </p>
          </div>
        </div>
      </div>
    );
  }

  const mainnetPowerKW = data.totalNodes * AVERAGE_NODE_POWER_KW;
  const validatorPowerKW = data.validators * AVERAGE_NODE_POWER_KW;

  const nodeEnergyKWh = AVERAGE_NODE_POWER_KW * HOURS_PER_YEAR;
  const mainnetEnergyKWh = mainnetPowerKW * HOURS_PER_YEAR;
  const validatorEnergyKWh = validatorPowerKW * HOURS_PER_YEAR;

  const weightedAvgEmissionsIntensity = emissionsData.reduce((sum, country) => {
    if (country.carbonIntensity !== null) {
      return sum + (country.nodePercentage / 100) * (country.carbonIntensity / 1000);
    }
    return sum;
  }, 0);

  const mainnetDistributedLedger =
    LEDGER_SIZE_GB * data.totalNodes + (data.archivers + data.relays) * ARCHIVE_INDEXER_SIZE_GB;

  const validatorDistributedLedger = LEDGER_SIZE_GB * data.validators;

  const mainnetEnergyEmissions = mainnetEnergyKWh * weightedAvgEmissionsIntensity;
  const mainnetStorageEmissions = mainnetDistributedLedger * AVG_SSD_ANNUALIZED_EMISSIONS_INTENSITY;
  const annualizedMainnetGHGEmissions = (mainnetEnergyEmissions + mainnetStorageEmissions) / 1000;

  const validatorEnergyEmissions = validatorEnergyKWh * weightedAvgEmissionsIntensity;
  const validatorStorageEmissions =
    validatorDistributedLedger * AVG_SSD_ANNUALIZED_EMISSIONS_INTENSITY;
  const annualizedValidationGHGEmissions =
    (validatorEnergyEmissions + validatorStorageEmissions) / 1000;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          Instantaneous Power Consumption
        </h3>
        <div className="text-muted-foreground mb-3 text-xs">
          <p>
            Average node power estimate based on{' '}
            <a
              href="https://26119259.fs1.hubspotusercontent-eu1.net/hubfs/26119259/Website-2024/PDFs/Proof%20of%20Stake%20Blockchain%20Efficiency%20Framework.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline transition-colors"
            >
              Proof of Stake Blockchain Efficiency Framework (PDF)
            </a>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Average Node Power */}
          <div className="bg-card border-border shadow-card rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Zap className="text-stat-blue mt-0.5 shrink-0" size={24} />
              <div className="flex-1">
                <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Average Node Power
                </p>
                <p className="text-stat-blue font-mono text-3xl font-bold">
                  {AVERAGE_NODE_POWER_W} W
                </p>
              </div>
            </div>
          </div>

          {/* Average Mainnet Power */}
          <div className="bg-card border-border shadow-card rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Zap className="text-stat-green mt-0.5 shrink-0" size={24} />
              <div className="flex-1">
                <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Average Mainnet Power
                </p>
                <p className="text-stat-green font-mono text-3xl font-bold">
                  {formatNumber(mainnetPowerKW, 2)} kW
                </p>
              </div>
            </div>
          </div>

          {/* Average Validation Power */}
          <div className="bg-card border-border shadow-card rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Zap className="text-stat-teal mt-0.5 shrink-0" size={24} />
              <div className="flex-1">
                <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Average Validation Power
                </p>
                <p className="text-stat-teal font-mono text-3xl font-bold">
                  {formatNumber(validatorPowerKW, 2)} kW
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Energy Metrics Section */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          Annualized Energy Consumption
        </h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Annualized Node Energy */}
          <div className="bg-card border-border shadow-card rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Zap className="text-stat-blue mt-0.5 shrink-0" size={24} />
              <div className="flex-1">
                <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Annualized Node Energy
                </p>
                <p className="text-stat-blue font-mono text-3xl font-bold">
                  {formatEnergy(nodeEnergyKWh)}
                </p>
              </div>
            </div>
          </div>

          {/* Annualized Mainnet Energy */}
          <div className="bg-card border-border shadow-card rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Zap className="text-stat-green mt-0.5 shrink-0" size={24} />
              <div className="flex-1">
                <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Annualized Mainnet Energy
                </p>
                <p className="text-stat-green font-mono text-3xl font-bold">
                  {formatEnergy(mainnetEnergyKWh)}
                </p>
              </div>
            </div>
          </div>

          {/* Annualized Validation Energy */}
          <div className="bg-card border-border shadow-card rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Zap className="text-stat-teal mt-0.5 shrink-0" size={24} />
              <div className="flex-1">
                <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Annualized Validation Energy
                </p>
                <p className="text-stat-teal font-mono text-3xl font-bold">
                  {formatEnergy(validatorEnergyKWh)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GHG Emissions Section */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          Greenhouse Gas Emissions
        </h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Annualized MainNet GHG Emissions */}
          <div className="bg-card border-border shadow-card rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Leaf className="text-stat-green mt-0.5 shrink-0" size={24} />
              <div className="flex-1">
                <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Annualized MainNet GHG Emissions
                </p>
                <p className="text-stat-green font-mono text-3xl font-bold">
                  {formatNumber(annualizedMainnetGHGEmissions, 2)} tCO₂e/y
                </p>
              </div>
            </div>
          </div>

          {/* Annualized Validation GHG Emissions */}
          <div className="bg-card border-border shadow-card rounded-lg border p-5">
            <div className="flex items-start gap-3">
              <Leaf className="text-stat-teal mt-0.5 shrink-0" size={24} />
              <div className="flex-1">
                <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Annualized Validation GHG Emissions
                </p>
                <p className="text-stat-teal font-mono text-3xl font-bold">
                  {formatNumber(annualizedValidationGHGEmissions, 2)} tCO₂e/y
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
