import { fetchRelayCounts, type RelayCounts } from './algorand-dns.js';
import { fetchNodeCount, fetchValidatorCount, parseGrafanaResponse } from './nodely.js';

import type { GrafanaResponse } from '../schemas/grafana.js';
import type { NodeData } from '../types/nodes.js';

interface NodeTypes {
  apiNodes: number;
  validators: number;
  relays: number;
  archivers: number;
}

function parseNodeTypes(
  validatorResponse: GrafanaResponse,
  totalNodes: number,
  { relays, archivers }: RelayCounts
): NodeTypes {
  const validators = Number(parseGrafanaResponse(validatorResponse)[0]?.validators) || 0;

  return { apiNodes: totalNodes - validators - relays - archivers, validators, relays, archivers };
}

function parseHistoricalData(response: GrafanaResponse): { date: string; nodeCount: number }[] {
  return parseGrafanaResponse(response).flatMap((row) => {
    const ts = row.ts;
    if (typeof ts !== 'string' && typeof ts !== 'number') return [];
    const date = new Date(ts);
    if (isNaN(date.getTime())) return [];
    return [{ date: date.toISOString().split('T')[0], nodeCount: Number(row.nodes ?? 0) }];
  });
}

function detectNodeAnomalies(nodeTypes: NodeTypes, totalNodes: number): string[] {
  const anomalies: string[] = [];

  if (nodeTypes.apiNodes < 0) {
    anomalies.push(
      `API nodes count is negative (${nodeTypes.apiNodes}). Validator count (${nodeTypes.validators}) may exceed total tracked nodes.`
    );
  }

  if (nodeTypes.validators > totalNodes) {
    anomalies.push(
      `Validator count (${nodeTypes.validators}) exceeds total nodes (${totalNodes}). Upstream data source may be inconsistent.`
    );
  }

  if (nodeTypes.validators < 0 || nodeTypes.relays < 0 || nodeTypes.archivers < 0) {
    anomalies.push('One or more node type counts are negative.');
  }

  return anomalies;
}

export async function fetchAllNodeData(
  timestamp: string
): Promise<{ data: NodeData; anomalies: string[] }> {
  const [nodeCountResponse, validatorResponse, relayCounts] = await Promise.all([
    fetchNodeCount(),
    fetchValidatorCount(),
    fetchRelayCounts(),
  ]);

  const historicalData = parseHistoricalData(nodeCountResponse);
  const latestDay = historicalData.at(-1);
  if (!latestDay) {
    throw new Error('Nodely returned no daily node count');
  }

  // The total is the latest daily estimate. Nodely's node type view always sums to 3717
  // (the estimate's peak on 2025-03-29) and has fixed relay counts, so it only provides
  // validators; relays and archivers come from the official DNS lists.
  const totalNodes = latestDay.nodeCount;
  const nodeTypes = parseNodeTypes(validatorResponse, totalNodes, relayCounts);

  const anomalies = detectNodeAnomalies(nodeTypes, totalNodes);
  if (anomalies.length > 0) {
    console.warn('Data anomalies detected:', anomalies);
  }

  return {
    data: {
      timestamp,
      totalNodes,
      validators: nodeTypes.validators,
      relays: nodeTypes.relays,
      archivers: nodeTypes.archivers,
      apiNodes: nodeTypes.apiNodes,
      historicalData,
    },
    anomalies,
  };
}
