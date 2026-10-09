import { useMemo } from 'react';

import { useCountryEmissions, MergedCountryData } from './useCountryEmissions';
import { useNodeData } from './useNodeData';
import { NodeData } from '../schemas/data';

/** Source: "Proof of Stake Blockchain Efficiency Framework" (Algorand Foundation, 2024) */
export const AVERAGE_NODE_POWER_W = 40;
const AVERAGE_NODE_POWER_KW = AVERAGE_NODE_POWER_W / 1000;

/** 365.25 days x 24 hours — accounts for leap years */
const HOURS_PER_YEAR = 8766;

/** Ledger size for a standard participation node (GB) */
const LEDGER_SIZE_GB = 20;

/** Ledger size for archival nodes and indexers (GB) */
const ARCHIVE_INDEXER_SIZE_GB = 4700;

/** Annualized SSD emissions intensity (kgCO2e/GB/year) */
const AVG_SSD_ANNUALIZED_EMISSIONS_INTENSITY = 0.02;

export interface NetworkPowerResults {
  mainnetPowerKW: number;
  validatorPowerKW: number;
  nodeEnergyKWh: number;
  mainnetEnergyKWh: number;
  validatorEnergyKWh: number;
  weightedAvgEmissionsIntensity: number;
  annualizedMainnetGHGEmissions: number;
  annualizedValidationGHGEmissions: number;
}

function computeMetrics(
  nodeData: NodeData,
  emissionsData: MergedCountryData[]
): NetworkPowerResults {
  const mainnetPowerKW = nodeData.totalNodes * AVERAGE_NODE_POWER_KW;
  const validatorPowerKW = nodeData.validators * AVERAGE_NODE_POWER_KW;

  const nodeEnergyKWh = AVERAGE_NODE_POWER_KW * HOURS_PER_YEAR;
  const mainnetEnergyKWh = mainnetPowerKW * HOURS_PER_YEAR;
  const validatorEnergyKWh = validatorPowerKW * HOURS_PER_YEAR;

  // Countries without carbon intensity data are left out of the average,
  // so they do not count as zero-emission nodes.
  let knownNodePercentage = 0;
  let weightedIntensitySum = 0;
  for (const country of emissionsData) {
    if (country.carbonIntensity === null) continue;
    knownNodePercentage += country.nodePercentage;
    weightedIntensitySum += country.nodePercentage * country.carbonIntensity;
  }
  const weightedAvgEmissionsIntensity =
    knownNodePercentage > 0 ? weightedIntensitySum / knownNodePercentage : 0;

  const mainnetDistributedLedger =
    LEDGER_SIZE_GB * nodeData.totalNodes +
    (nodeData.archivers + nodeData.relays) * ARCHIVE_INDEXER_SIZE_GB;
  const validatorDistributedLedger = LEDGER_SIZE_GB * nodeData.validators;

  const mainnetEnergyEmissions = (mainnetEnergyKWh * weightedAvgEmissionsIntensity) / 1000;
  const mainnetStorageEmissions = mainnetDistributedLedger * AVG_SSD_ANNUALIZED_EMISSIONS_INTENSITY;
  const annualizedMainnetGHGEmissions = (mainnetEnergyEmissions + mainnetStorageEmissions) / 1000;

  const validatorEnergyEmissions = (validatorEnergyKWh * weightedAvgEmissionsIntensity) / 1000;
  const validatorStorageEmissions =
    validatorDistributedLedger * AVG_SSD_ANNUALIZED_EMISSIONS_INTENSITY;
  const annualizedValidationGHGEmissions =
    (validatorEnergyEmissions + validatorStorageEmissions) / 1000;

  return {
    mainnetPowerKW,
    validatorPowerKW,
    nodeEnergyKWh,
    mainnetEnergyKWh,
    validatorEnergyKWh,
    weightedAvgEmissionsIntensity,
    annualizedMainnetGHGEmissions,
    annualizedValidationGHGEmissions,
  };
}

export const useNetworkPowerCalculations = () => {
  const { data: nodeData, isLoading: nodeLoading, error: nodeError } = useNodeData();
  const {
    data: emissionsData,
    isLoading: emissionsLoading,
    error: emissionsError,
  } = useCountryEmissions();

  const metrics = useMemo(() => {
    if (!nodeData || !emissionsData) return null;
    return computeMetrics(nodeData, emissionsData);
  }, [nodeData, emissionsData]);

  return {
    metrics,
    isLoading: nodeLoading || emissionsLoading,
    error: nodeError || emissionsError,
  };
};
