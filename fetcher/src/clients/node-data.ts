import { ALGORAND_INFRASTRUCTURE } from '../constants.js';
import { fetchNodeCount, fetchNodeTypeDistribution, parseGrafanaResponse } from './nodely.js';

import type { GrafanaResponse } from '../schemas/grafana.js';
import type { NodeData } from '../types/nodes.js';

interface NodeTypes {
  apiNodes: number;
  validators: number;
  relays: number;
  archivers: number;
}

const DEFAULT_NODE_TYPES: NodeTypes = {
  apiNodes: 0,
  validators: 0,
  relays: ALGORAND_INFRASTRUCTURE.RELAY_NODES,
  archivers: ALGORAND_INFRASTRUCTURE.ARCHIVER_NODES,
};

function parseNodeTypes(response: GrafanaResponse): NodeTypes {
  const firstRow = parseGrafanaResponse(response)[0];
  if (!firstRow) return DEFAULT_NODE_TYPES;

  return {
    apiNodes: Number(firstRow.apiNodes) || 0,
    validators: Number(firstRow.validators) || 0,
    relays: Number(firstRow.relays) || ALGORAND_INFRASTRUCTURE.RELAY_NODES,
    archivers: Number(firstRow.archivers) || ALGORAND_INFRASTRUCTURE.ARCHIVER_NODES,
  };
}

function parseHistoricalData(response: GrafanaResponse): { date: string; nodeCount: number }[] {
  return parseGrafanaResponse(response).flatMap((row) => {
    const ts = row.ts;
    if (typeof ts !== 'string' && typeof ts !== 'number') return [];
    const date = new Date(ts);
    if (isNaN(date.getTime())) return [];
    return [{ date: date.toISOString().split('T')[0], nodeCount: Number(row.node_cnt ?? 0) }];
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
  const [nodeCountResponse, nodeTypeResponse] = await Promise.all([
    fetchNodeCount(),
    fetchNodeTypeDistribution(),
  ]);

  const nodeTypes = parseNodeTypes(nodeTypeResponse);

  const historicalData = parseHistoricalData(nodeCountResponse);

  const totalNodes =
    nodeTypes.apiNodes + nodeTypes.validators + nodeTypes.relays + nodeTypes.archivers;

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
      historicalData: historicalData.length > 0 ? historicalData : undefined,
    },
    anomalies,
  };
}
