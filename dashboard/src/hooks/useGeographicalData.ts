import { useQuery } from '@tanstack/react-query';

import { geographicalDataSchema, type GeographicalData } from '../schemas/data';

/**
 * Fetches geographical distribution data from the static JSON file.
 *
 * @internal
 */
const fetchGeographicalData = async (): Promise<GeographicalData> => {
  const response = await fetch('/data/latest/geographical.json');
  if (!response.ok) {
    throw new Error('Failed to fetch geographical data');
  }
  const data = await response.json();
  return geographicalDataSchema.parse(data);
};

/**
 * Fetches the geographical distribution of Algorand nodes by country.
 *
 * Data includes node counts for each country where Algorand nodes are hosted,
 * providing insight into the network's global distribution.
 *
 * Caching: Data is cached for 5 minutes. After this period, React Query
 * automatically refetches in the background while serving stale data.
 *
 * @returns React Query result object:
 *   - data: GeographicalData | undefined
 *   - isLoading: boolean - True during initial fetch
 *   - error: Error | null - Error object if fetch failed
 *
 * @example
 * const { data, isLoading, error } = useGeographicalData();
 * if (data) {
 *   console.log(`Total countries: ${data.totalCountries}`);
 * }
 */
export const useGeographicalData = () => {
  return useQuery({
    queryKey: ['geographicalData'],
    queryFn: fetchGeographicalData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
