import { useMemo } from 'react';

import { useCarbonData } from './useCarbonData';
import { useGeographicalData } from './useGeographicalData';
import { ISO_2_TO_3, COUNTRY_NAMES, getCountryFlag } from '../lib/country-codes';

/**
 * Represents comprehensive node distribution and emissions data for a single country.
 *
 * Combines geographical node data with carbon intensity information.
 * Fields with `| null` indicate missing carbon intensity data for that country.
 *
 * @interface
 */
export interface MergedCountryData {
  countryCode2: string; // 2-letter: US, DE
  countryCode3: string | null; // 3-letter: USA, DEU (nullable)
  countryName: string; // "United States"
  flagEmoji: string; // 🇺🇸
  nodeCount: number; // 1263
  nodePercentage: number; // 33.97
  carbonIntensity: number | null; // 383.55 gCO2e/kWh (nullable)
  emissionsPercentage: number | null; // 28.12 (nullable)
  relativeEmissions: number | null; // emissions % / node % (nullable)
}

/**
 * Merges geographical node distribution data with carbon intensity data by country.
 *
 * This hook combines data from two sources:
 * 1. Geographical data: Node counts per country (2-letter ISO codes)
 * 2. Carbon intensity data: gCO2e/kWh per country (3-letter ISO codes)
 *
 * Calculation methodology:
 * - Node percentages: (country nodes / total nodes) × 100
 * - Weighted emissions: node count × carbon intensity for each country
 * - Emissions percentages: (country weighted emissions / total weighted emissions) × 100
 * - Relative emissions: emissions % ÷ node % (1.0 = proportional, >1.0 = higher impact)
 *
 * Countries without carbon intensity data have null values for emissions-related fields.
 *
 * @returns Query result containing:
 *   - data: Array of MergedCountryData sorted by node count
 *   - isLoading: True while either data source is loading
 *   - error: Error from either data source
 *
 * @example
 * const { data, isLoading, error } = useCountryEmissions();
 * if (data) {
 *   const us = data.find(c => c.countryCode2 === 'US');
 *   console.log(`US: ${us.nodeCount} nodes, relative emissions: ${us.relativeEmissions}`);
 * }
 */
export const useCountryEmissions = () => {
  const { data: geoData, isLoading: geoLoading, error: geoError } = useGeographicalData();
  const { data: carbonData, isLoading: carbonLoading, error: carbonError } = useCarbonData();

  const mergedData = useMemo(() => {
    if (!geoData || !carbonData) return null;

    // Create lookup map for carbon intensity by 3-letter code
    const carbonMap = new Map(carbonData.countries.map((c) => [c.code, c.intensity]));

    const totalNodes = geoData.nodesByCountry.reduce((sum, c) => sum + c.nodeCount, 0);

    // Two-pass calculation algorithm:
    // Pass 1: Calculate weighted emissions (nodeCount × intensity) per country
    // Pass 2: Calculate percentages using total weighted emissions as denominator
    const countriesWithIntensity = geoData.nodesByCountry.map((country) => {
      const code3 = ISO_2_TO_3[country.countryCode];
      const intensity = code3 ? carbonMap.get(code3) : null;
      const weightedEmissions =
        intensity !== null && intensity !== undefined ? country.nodeCount * intensity : 0;

      return {
        countryCode2: country.countryCode,
        countryCode3: code3 || null,
        intensity: intensity ?? null,
        nodeCount: country.nodeCount,
        weightedEmissions,
      };
    });

    // Calculate total weighted emissions for percentage calculation
    const totalWeightedEmissions = countriesWithIntensity.reduce(
      (sum, c) => sum + c.weightedEmissions,
      0
    );

    // Second pass: map to final structure with percentages
    return countriesWithIntensity.map((country) => {
      const nodePercentage = (country.nodeCount / totalNodes) * 100;
      const emissionsPercentage =
        country.intensity !== null && totalWeightedEmissions > 0
          ? (country.weightedEmissions / totalWeightedEmissions) * 100
          : null;

      const relativeEmissions =
        emissionsPercentage !== null && nodePercentage > 0
          ? emissionsPercentage / nodePercentage
          : null;

      return {
        countryCode2: country.countryCode2,
        countryCode3: country.countryCode3,
        countryName: COUNTRY_NAMES[country.countryCode2] || country.countryCode2,
        flagEmoji: getCountryFlag(country.countryCode2),
        nodeCount: country.nodeCount,
        nodePercentage,
        carbonIntensity: country.intensity,
        emissionsPercentage,
        relativeEmissions,
      };
    });
  }, [geoData, carbonData]);

  return {
    data: mergedData,
    isLoading: geoLoading || carbonLoading,
    error: geoError || carbonError,
  };
};
