import { useMemo } from 'react';

import { useCarbonData } from './useCarbonData';
import { useGeographicalData } from './useGeographicalData';
import { ISO_2_TO_3, COUNTRY_NAMES, getCountryFlag } from '../lib/country-codes';
import { CarbonIntensityData, GeographicalData } from '../schemas/data';

/** Node distribution and emissions data for a single country. Null fields indicate missing carbon intensity data. */
export interface MergedCountryData {
  countryCode2: string;
  countryCode3: string | null;
  countryName: string;
  flagEmoji: string;
  nodeCount: number;
  nodePercentage: number;
  carbonIntensity: number | null;
  emissionsPercentage: number | null;
  relativeEmissions: number | null;
}

/**
 * Pure function: merges geographical node data with carbon intensity data.
 *
 * Two-pass algorithm:
 * 1. Calculate weighted emissions (nodeCount x intensity) per country
 * 2. Derive percentages from totals
 *
 * Countries without carbon intensity data get null for emissions fields.
 */
export function mergeCountryData(
  geoData: GeographicalData,
  carbonData: CarbonIntensityData
): MergedCountryData[] {
  const carbonMap = new Map(carbonData.countries.map((c) => [c.code, c.intensity]));
  const totalNodes = geoData.nodesByCountry.reduce((sum, c) => sum + c.nodeCount, 0);

  const countriesWithIntensity = geoData.nodesByCountry.map((country) => {
    const code3 = ISO_2_TO_3[country.countryCode];
    const intensity = code3 ? (carbonMap.get(code3) ?? null) : null;
    const weightedEmissions = intensity !== null ? country.nodeCount * intensity : 0;

    return {
      countryCode2: country.countryCode,
      countryCode3: code3 || null,
      intensity,
      nodeCount: country.nodeCount,
      weightedEmissions,
    };
  });

  const totalWeightedEmissions = countriesWithIntensity.reduce(
    (sum, c) => sum + c.weightedEmissions,
    0
  );

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
}

export const useCountryEmissions = () => {
  const { data: geoData, isLoading: geoLoading, error: geoError } = useGeographicalData();
  const { data: carbonData, isLoading: carbonLoading, error: carbonError } = useCarbonData();

  const mergedData = useMemo(() => {
    if (!geoData || !carbonData) return null;
    return mergeCountryData(geoData, carbonData);
  }, [geoData, carbonData]);

  return {
    data: mergedData,
    isLoading: geoLoading || carbonLoading,
    error: geoError || carbonError,
  };
};
