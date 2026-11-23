import { fetchRelayCounts, type RelayCounts } from './algorand-dns.js';
import { fetchDailyNodeCounts, fetchValidatorCount } from './nodely.js';

import type { NodeData } from '../types/nodes.js';

interface NodeTypes {
  apiNodes: number;
  validators: number;
  relays: number;
  archivers: number;
}

function toNodeTypes(
  totalNodes: number,
  validators: number,
  { relays, archivers }: RelayCounts
): NodeTypes {
  return { apiNodes: totalNodes - validators - relays - archivers, validators, relays, archivers };
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
  const [historicalData, validators, relayCounts] = await Promise.all([
    fetchDailyNodeCounts(),
    fetchValidatorCount(),
    fetchRelayCounts(),
  ]);

  const latestDay = historicalData.at(-1);
  if (!latestDay) {
    throw new Error('Nodely returned no daily node count');
  }

  // The total is the latest daily full-time node estimate. Validators are the accounts
  // registered online; relays and archivers come from the official DNS lists.
  const totalNodes = latestDay.nodeCount;
  const nodeTypes = toNodeTypes(totalNodes, validators, relayCounts);

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
