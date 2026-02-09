import { ofetch } from 'ofetch';
import { z } from 'zod';

import { TIME_RANGES, GRAFANA_DATASOURCES, ALGORAND_INFRASTRUCTURE } from '../constants.js';
import { geographicalResponseSchema, type GeographicalData } from '../schemas/geographical.js';
import {
  nodeCountResponseSchema,
  validatorResponseSchema,
  nodeTypeResponseSchema,
  type NodeData,
} from '../schemas/nodes.js';

const NODELY_BASE_URL = 'https://g.nodely.io/api/ds/query';

/**
 * Common HTTP headers required for all Grafana API requests.
 *
 * These headers mimic a browser request to ensure the API accepts our requests.
 * The Grafana instance requires specific headers for authentication and request validation.
 *
 * @internal
 */
const COMMON_GRAFANA_HEADERS = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  'content-type': 'application/json',
  origin: 'https://g.nodely.io',
  referer:
    'https://g.nodely.io/d/telemetrymain/node-telemetry-service?orgId=1&from=now-24h&to=now&timezone=browser',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  'x-grafana-org-id': '1',
};

type NodeCountResponse = z.infer<typeof nodeCountResponseSchema>;
type ValidatorResponse = z.infer<typeof validatorResponseSchema>;
type NodeTypeResponse = z.infer<typeof nodeTypeResponseSchema>;

/**
 * Represents a field in a Grafana query response.
 *
 * Grafana returns data in a columnar format where each field represents
 * a column in the result set.
 *
 * @interface
 */
interface GrafanaField {
  /** The name of the field/column */
  name: string;
}

/**
 * Fetch historical node count data from Nodely
 */
export async function fetchNodeCount(): Promise<NodeCountResponse> {
  try {
    const response = await ofetch(NODELY_BASE_URL, {
      method: 'POST',
      params: {
        ds_type: 'grafana-clickhouse-datasource',
        requestId: 'SQR100',
      },
      body: {
        queries: [
          {
            datasource: {
              type: 'grafana-clickhouse-datasource',
              uid: GRAFANA_DATASOURCES.CLICKHOUSE_NODES,
            },
            editorType: 'sql',
            format: 2,
            meta: {
              builderOptions: {
                columns: [],
                database: '',
                limit: 1000,
                mode: 'list',
                queryType: 'table',
                table: '',
              },
              timezone: 'Europe/Rome',
            },
            pluginVersion: '4.8.0',
            queryType: 'logs',
            rawSql: `select * from nodely.v_node_cnt_daily where ts < toDate(now())`,
            refId: 'A',
            datasourceId: 10,
            intervalMs: 86400000,
            maxDataPoints: 751,
          },
        ],
        from: String(Date.now() - TIME_RANGES.ONE_YEAR),
        to: String(Date.now()),
      },
      headers: {
        ...COMMON_GRAFANA_HEADERS,
        'x-datasource-uid': GRAFANA_DATASOURCES.CLICKHOUSE_NODES,
        'x-plugin-id': 'grafana-clickhouse-datasource',
      },
    });

    // Validate response with Zod
    const validated = nodeCountResponseSchema.parse(response);
    return validated;
  } catch (error) {
    console.error('Error fetching node count from Nodely:', error);
    throw error;
  }
}

/**
 * Fetch current validator count from Nodely
 */
export async function fetchValidatorCount(): Promise<ValidatorResponse> {
  try {
    const response = await ofetch(NODELY_BASE_URL, {
      method: 'POST',
      params: {
        ds_type: 'grafana-postgresql-datasource',
        requestId: 'SQR100',
      },
      body: {
        queries: [
          {
            refId: 'A',
            datasource: {
              type: 'grafana-postgresql-datasource',
              uid: GRAFANA_DATASOURCES.POSTGRES_VALIDATORS,
            },
            rawSql: `select count(*) online from account where (account_data ->> 'onl'::text) = '1' and (account_data ->> 'voteLst'::text)::integer > (select max(round) from block_header)`,
            format: 'table',
            datasourceId: 2,
            intervalMs: 120000,
            maxDataPoints: 751,
          },
        ],
        from: String(Date.now() - TIME_RANGES.SIX_HOURS),
        to: String(Date.now()),
      },
      headers: {
        ...COMMON_GRAFANA_HEADERS,
        'x-datasource-uid': GRAFANA_DATASOURCES.POSTGRES_VALIDATORS,
        'x-plugin-id': 'grafana-postgresql-datasource',
      },
    });

    const validated = validatorResponseSchema.parse(response);
    return validated;
  } catch (error) {
    console.error('Error fetching validator count from Nodely:', error);
    throw error;
  }
}

/**
 * Fetch node type distribution (archival, relay, api nodes)
 */
export async function fetchNodeTypeDistribution(): Promise<NodeTypeResponse> {
  try {
    const response = await ofetch(NODELY_BASE_URL, {
      method: 'POST',
      params: {
        ds_type: 'grafana-clickhouse-datasource',
        requestId: 'SQR100',
      },
      body: {
        queries: [
          {
            datasource: {
              type: 'grafana-clickhouse-datasource',
              uid: GRAFANA_DATASOURCES.CLICKHOUSE_NODE_TYPES,
            },
            editorType: 'sql',
            format: 1,
            meta: {
              builderOptions: {
                columns: [],
                database: '',
                limit: 1000,
                mode: 'list',
                queryType: 'table',
                table: '',
              },
              timezone: 'Europe/Rome',
            },
            pluginVersion: '4.8.2',
            queryType: 'table',
            rawSql: `with
  (select * from mainnet.v_nodes_cnt) as nodes
  ,(select count() from mainnet.account where is_online) as validatingNodes
select
'nodes' as series
, nodes - validatingNodes - ${ALGORAND_INFRASTRUCTURE.RELAY_NODES} - ${ALGORAND_INFRASTRUCTURE.ARCHIVER_NODES} as apiNodes
, validatingNodes as validators
, ${ALGORAND_INFRASTRUCTURE.RELAY_NODES} as relays
, ${ALGORAND_INFRASTRUCTURE.ARCHIVER_NODES} as archivers
SETTINGS use_query_cache=true,query_cache_ttl=300,query_cache_nondeterministic_function_handling = 'save' ;`,
            refId: 'A',
            datasourceId: 8,
            intervalMs: 120000,
            maxDataPoints: 751,
          },
        ],
        from: String(Date.now() - TIME_RANGES.SIX_HOURS),
        to: String(Date.now()),
      },
      headers: {
        ...COMMON_GRAFANA_HEADERS,
        'x-datasource-uid': GRAFANA_DATASOURCES.CLICKHOUSE_NODE_TYPES,
        'x-plugin-id': 'grafana-clickhouse-datasource',
      },
    });

    const validated = nodeTypeResponseSchema.parse(response);
    return validated;
  } catch (error) {
    console.error('Error fetching node type distribution from Nodely:', error);
    throw error;
  }
}

/**
 * Transforms Grafana's columnar data format into row-based objects.
 *
 * Grafana returns data in a columnar format where:
 * - `schema.fields` contains field definitions (column names)
 * - `data.values` is an array of arrays, where each inner array represents a column
 *
 * This function transposes the columnar data into row objects for easier consumption.
 *
 * @param response - The Grafana API response containing columnar data
 * @returns Array of row objects where each object has field names as keys
 *
 * @example
 * Input (columnar):
 *   fields: [{ name: 'ts' }, { name: 'count' }]
 *   values: [['2024-01-01', '2024-01-02'], [100, 150]]
 *
 * Output (rows):
 *   [
 *     { ts: '2024-01-01', count: 100 },
 *     { ts: '2024-01-02', count: 150 }
 *   ]
 *
 * @internal
 */
function parseGrafanaResponse(
  response: NodeCountResponse | ValidatorResponse | NodeTypeResponse
): Record<string, unknown>[] {
  try {
    const frame = response.results?.A?.frames?.[0];
    if (!frame) return [];

    const fields = frame.schema.fields;
    const values = frame.data.values;

    // Convert columnar data to row format
    const rows: Record<string, unknown>[] = [];
    const rowCount = values[0]?.length || 0;

    for (let i = 0; i < rowCount; i++) {
      const row: Record<string, unknown> = {};
      fields.forEach((field: GrafanaField, fieldIndex: number) => {
        row[field.name] = values[fieldIndex][i];
      });
      rows.push(row);
    }

    return rows;
  } catch (error) {
    console.error('Error parsing Grafana response:', error);
    return [];
  }
}

/**
 * Fetch nodes by country from Nodely
 */
export async function fetchNodesByCountry(): Promise<GeographicalData> {
  try {
    const response = await ofetch(NODELY_BASE_URL, {
      method: 'POST',
      params: {
        ds_type: 'grafana-clickhouse-datasource',
        requestId: 'SQR100',
      },
      body: {
        queries: [
          {
            datasource: {
              type: 'grafana-clickhouse-datasource',
              uid: GRAFANA_DATASOURCES.CLICKHOUSE_NODES,
            },
            editorType: 'sql',
            format: 1,
            meta: {
              builderOptions: {
                columns: [],
                database: '',
                limit: 1000,
                mode: 'list',
                queryType: 'table',
                table: '',
              },
              timezone: 'Europe/Rome',
            },
            pluginVersion: '4.8.2',
            queryType: 'table',
            rawSql:
              'select c, ftne as nodes from nodely.v_nodes_per_country_24h order by nodes desc',
            refId: 'A',
            datasourceId: 10,
            intervalMs: 86400000,
            maxDataPoints: 200,
          },
        ],
        from: String(Date.now() - TIME_RANGES.ONE_DAY),
        to: String(Date.now()),
      },
      headers: {
        ...COMMON_GRAFANA_HEADERS,
        'x-datasource-uid': GRAFANA_DATASOURCES.CLICKHOUSE_NODES,
        'x-plugin-id': 'grafana-clickhouse-datasource',
      },
    });

    // Validate response with Zod
    const validated = geographicalResponseSchema.parse(response);

    // Parse Grafana columnar response
    const rows = parseGrafanaResponse(validated);

    // Transform to domain model
    const nodesByCountry = rows
      .map((row) => ({
        countryCode: String(row.c || '').toUpperCase(),
        nodeCount: Number(row.nodes || 0),
      }))
      .filter((item) => item.countryCode && item.nodeCount > 0)
      .sort((a, b) => b.nodeCount - a.nodeCount);

    const geographicalData: GeographicalData = {
      timestamp: new Date().toISOString(),
      nodesByCountry,
      totalCountries: nodesByCountry.length,
      metadata: {
        source: 'Nodely Node Telemetry Service',
        description: 'Distribution of Algorand nodes by country (last 24h)',
      },
    };

    return geographicalData;
  } catch (error) {
    console.error('Error fetching nodes by country from Nodely:', error);
    throw error;
  }
}

/**
 * Aggregate all Nodely data into a unified NodeData object.
 * Returns the data along with any detected anomalies.
 */
export async function fetchAllNodeData(): Promise<{ data: NodeData; anomalies: string[] }> {
  try {
    // Fetch all data in parallel
    const [nodeCountResponse, , nodeTypeResponse] = await Promise.all([
      fetchNodeCount().catch((e) => {
        console.warn('Failed to fetch node count:', e.message);
        return null;
      }),
      fetchValidatorCount().catch((e) => {
        console.warn('Failed to fetch validator count:', e.message);
        return null;
      }),
      fetchNodeTypeDistribution().catch((e) => {
        console.warn('Failed to fetch node type distribution:', e.message);
        return null;
      }),
    ]);

    // Parse node type distribution
    let nodeTypes: {
      apiNodes: number;
      validators: number;
      relays: number;
      archivers: number;
    } = {
      apiNodes: 0,
      validators: 0,
      relays: ALGORAND_INFRASTRUCTURE.RELAY_NODES,
      archivers: ALGORAND_INFRASTRUCTURE.ARCHIVER_NODES,
    };

    if (nodeTypeResponse) {
      const nodeTypeData = parseGrafanaResponse(nodeTypeResponse);
      if (nodeTypeData.length > 0) {
        const data = nodeTypeData[0];
        nodeTypes = {
          apiNodes: Number(data.apiNodes) || 0,
          validators: Number(data.validators) || 0,
          relays: Number(data.relays) || ALGORAND_INFRASTRUCTURE.RELAY_NODES,
          archivers: Number(data.archivers) || ALGORAND_INFRASTRUCTURE.ARCHIVER_NODES,
        };
      }
    }

    // Parse historical node count
    const historicalData = nodeCountResponse
      ? parseGrafanaResponse(nodeCountResponse).map((row) => ({
          date: new Date(row.ts as string | number).toISOString().split('T')[0],
          nodeCount: Number(row.node_cnt) || 0,
        }))
      : [];

    // Calculate total nodes
    const totalNodes =
      nodeTypes.apiNodes + nodeTypes.validators + nodeTypes.relays + nodeTypes.archivers;

    // Detect data anomalies
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

    if (anomalies.length > 0) {
      console.warn('Data anomalies detected:', anomalies);
    }

    const nodeData: NodeData = {
      timestamp: new Date().toISOString(),
      totalNodes,
      validators: nodeTypes.validators,
      relays: nodeTypes.relays,
      archivers: nodeTypes.archivers,
      apiNodes: nodeTypes.apiNodes,
      historicalData: historicalData.length > 0 ? historicalData : undefined,
    };

    return { data: nodeData, anomalies };
  } catch (error) {
    console.error('Error aggregating node data:', error);
    throw error;
  }
}
