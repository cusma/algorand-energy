import { ofetch } from 'ofetch';

import {
  TIME_RANGES,
  GRAFANA_DATASOURCES,
  GRAFANA_DATASOURCE_IDS,
  ALGORAND_INFRASTRUCTURE,
} from '../constants.js';
import { grafanaResponseSchema, type GrafanaResponse } from '../schemas/grafana.js';

import type { GeographicalData } from '../types/geographical.js';

const NODELY_QUERY_ENDPOINT = 'https://g.nodely.io/api/ds/query';
const CLICKHOUSE_PLUGIN_ID = 'grafana-clickhouse-datasource';
const CLICKHOUSE_PLUGIN_VERSION = '4.8.2';
const GRAFANA_REQUEST_ID = 'SQR100';
const GRAFANA_DEFAULT_MAX_DATA_POINTS = 751;

/** Grafana response format identifiers */
const GRAFANA_FORMAT = {
  TABLE: 1,
  LOGS: 2,
} as const;

const DEFAULT_QUERY_META = {
  builderOptions: {
    columns: [],
    database: '',
    limit: 1000,
    mode: 'list',
    queryType: 'table',
    table: '',
  },
  timezone: 'Europe/Rome',
};

const BASE_CLICKHOUSE_QUERY = {
  editorType: 'sql',
  meta: DEFAULT_QUERY_META,
  pluginVersion: CLICKHOUSE_PLUGIN_VERSION,
};

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

interface GrafanaQueryConfig {
  datasourceUid: string;
  pluginId: string;
  query: Record<string, unknown>;
  timeRange: number;
}

async function queryGrafana(config: GrafanaQueryConfig): Promise<GrafanaResponse> {
  const now = Date.now();
  const response = await ofetch(NODELY_QUERY_ENDPOINT, {
    method: 'POST',
    params: {
      ds_type: config.pluginId,
      requestId: GRAFANA_REQUEST_ID,
    },
    body: {
      queries: [
        {
          datasource: {
            type: config.pluginId,
            uid: config.datasourceUid,
          },
          refId: 'A',
          ...config.query,
        },
      ],
      from: String(now - config.timeRange),
      to: String(now),
    },
    headers: {
      ...COMMON_GRAFANA_HEADERS,
      'x-datasource-uid': config.datasourceUid,
      'x-plugin-id': config.pluginId,
    },
  });

  return grafanaResponseSchema.parse(response);
}

function getFirstFrame(response: GrafanaResponse) {
  return response.results?.A?.frames?.[0];
}

export type GrafanaRow = Record<string, unknown>;

function buildRow(fields: { name: string }[], values: unknown[][], rowIndex: number): GrafanaRow {
  const row: GrafanaRow = {};
  for (let col = 0; col < fields.length; col++) {
    row[fields[col].name] = values[col][rowIndex];
  }
  return row;
}

export function parseGrafanaResponse(response: GrafanaResponse): GrafanaRow[] {
  const frame = getFirstFrame(response);
  if (!frame) return [];

  const { fields } = frame.schema;
  const { values } = frame.data;
  const rowCount = values[0]?.length ?? 0;

  return Array.from({ length: rowCount }, (_, i) => buildRow(fields, values, i));
}

const NODE_COUNT_SQL = `select * from nodely.v_node_cnt_daily where ts < toDate(now())`;

const NODE_TYPE_DISTRIBUTION_SQL = `with
  (select * from mainnet.v_nodes_cnt) as nodes
  ,(select count() from mainnet.account where is_online) as validatingNodes
select
'nodes' as series
, nodes - validatingNodes - ${ALGORAND_INFRASTRUCTURE.RELAY_NODES} - ${ALGORAND_INFRASTRUCTURE.ARCHIVER_NODES} as apiNodes
, validatingNodes as validators
, ${ALGORAND_INFRASTRUCTURE.RELAY_NODES} as relays
, ${ALGORAND_INFRASTRUCTURE.ARCHIVER_NODES} as archivers
SETTINGS use_query_cache=true,query_cache_ttl=300,query_cache_nondeterministic_function_handling = 'save' ;`;

export async function fetchNodeCount(): Promise<GrafanaResponse> {
  return queryGrafana({
    datasourceUid: GRAFANA_DATASOURCES.CLICKHOUSE_NODES,
    pluginId: CLICKHOUSE_PLUGIN_ID,
    timeRange: TIME_RANGES.ONE_YEAR,
    query: {
      ...BASE_CLICKHOUSE_QUERY,
      format: GRAFANA_FORMAT.LOGS,
      queryType: 'logs',
      rawSql: NODE_COUNT_SQL,
      datasourceId: GRAFANA_DATASOURCE_IDS.CLICKHOUSE_NODES,
      intervalMs: TIME_RANGES.ONE_DAY,
      maxDataPoints: GRAFANA_DEFAULT_MAX_DATA_POINTS,
    },
  });
}

export async function fetchNodeTypeDistribution(): Promise<GrafanaResponse> {
  return queryGrafana({
    datasourceUid: GRAFANA_DATASOURCES.CLICKHOUSE_NODE_TYPES,
    pluginId: CLICKHOUSE_PLUGIN_ID,
    timeRange: TIME_RANGES.SIX_HOURS,
    query: {
      ...BASE_CLICKHOUSE_QUERY,
      format: GRAFANA_FORMAT.TABLE,
      queryType: 'table',
      rawSql: NODE_TYPE_DISTRIBUTION_SQL,
      datasourceId: GRAFANA_DATASOURCE_IDS.CLICKHOUSE_NODE_TYPES,
      intervalMs: TIME_RANGES.TWO_MINUTES,
      maxDataPoints: GRAFANA_DEFAULT_MAX_DATA_POINTS,
    },
  });
}

export async function fetchNodesByCountry(timestamp: string): Promise<GeographicalData> {
  const response = await queryGrafana({
    datasourceUid: GRAFANA_DATASOURCES.CLICKHOUSE_NODES,
    pluginId: CLICKHOUSE_PLUGIN_ID,
    timeRange: TIME_RANGES.ONE_DAY,
    query: {
      ...BASE_CLICKHOUSE_QUERY,
      format: GRAFANA_FORMAT.TABLE,
      queryType: 'table',
      rawSql: 'select c, ftne as nodes from nodely.v_nodes_per_country_24h order by nodes desc',
      datasourceId: GRAFANA_DATASOURCE_IDS.CLICKHOUSE_NODES,
      intervalMs: TIME_RANGES.ONE_DAY,
      maxDataPoints: 200,
    },
  });

  const rows = parseGrafanaResponse(response);

  const nodesByCountry = rows
    .map((row) => ({
      countryCode: String(row.c ?? '').toUpperCase(),
      nodeCount: Number(row.nodes ?? 0),
    }))
    .filter((item) => item.countryCode && item.nodeCount > 0)
    .sort((a, b) => b.nodeCount - a.nodeCount);

  return {
    timestamp,
    nodesByCountry,
    totalCountries: nodesByCountry.length,
    metadata: {
      source: 'Nodely Node Telemetry Service',
      description: 'Distribution of Algorand nodes by country (last 24h)',
    },
  };
}
