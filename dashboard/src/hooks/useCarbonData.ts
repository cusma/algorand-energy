import { useQuery } from '@tanstack/react-query';

import { carbonIntensityDataSchema, type CarbonIntensityData } from '../schemas/data';

/**
 * Fetches carbon intensity data from the static JSON file.
 *
 * @internal
 */
const fetchCarbonIntensityData = async (): Promise<CarbonIntensityData> => {
  const response = await fetch('/data/latest/carbon-intensity.json');
  if (!response.ok) {
    throw new Error('Failed to fetch carbon intensity data');
  }
  const data = await response.json();
  return carbonIntensityDataSchema.parse(data);
};

/**
 * Fetches carbon intensity data by country from Our World in Data.
 *
 * Data includes carbon intensity values (gCO2e/kWh) for countries worldwide,
 * representing the amount of carbon dioxide equivalent emitted per kilowatt-hour
 * of electricity generated.
 *
 * Caching: Data is cached for 5 minutes. After this period, React Query
 * automatically refetches in the background while serving stale data.
 *
 * @returns React Query result object:
 *   - data: CarbonIntensityData | undefined
 *   - isLoading: boolean - True during initial fetch
 *   - error: Error | null - Error object if fetch failed
 *
 * @example
 * const { data, isLoading, error } = useCarbonData();
 * if (data) {
 *   console.log(`Global average: ${data.globalAverage} gCO2e/kWh`);
 * }
 */
export const useCarbonData = () => {
  return useQuery({
    queryKey: ['carbonIntensityData'],
    queryFn: fetchCarbonIntensityData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
