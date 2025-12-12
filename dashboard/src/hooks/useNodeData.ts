import { useQuery } from '@tanstack/react-query';

import { nodeDataSchema, type NodeData } from '../schemas/data';

/**
 * Fetches node data from the static JSON file.
 *
 * @internal
 */
const fetchNodeData = async (): Promise<NodeData> => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/latest/nodes.json`);
  if (!response.ok) {
    throw new Error('Failed to fetch node data');
  }
  const data = await response.json();
  return nodeDataSchema.parse(data);
};

/**
 * Fetches the Algorand network's current node statistics.
 *
 * Data includes total node count and breakdown by type (validators, relays, archivers, API nodes).
 *
 * Caching: Data is cached for 5 minutes. After this period, React Query
 * automatically refetches in the background while serving stale data.
 *
 * @returns React Query result object:
 *   - data: NodeData | undefined
 *   - isLoading: boolean - True during initial fetch
 *   - error: Error | null - Error object if fetch failed
 *
 * @example
 * const { data, isLoading, error } = useNodeData();
 * if (data) {
 *   console.log(`Total nodes: ${data.totalNodes}`);
 * }
 */
export const useNodeData = () => {
  return useQuery({
    queryKey: ['nodeData'],
    queryFn: fetchNodeData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
