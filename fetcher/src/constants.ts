/** All values in milliseconds */
export const TIME_RANGES = {
  ONE_YEAR: 365 * 24 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  TWO_MINUTES: 2 * 60 * 1000,
} as const;

/** Grafana datasource UIDs for the Nodely instance */
export const GRAFANA_DATASOURCES = {
  CLICKHOUSE_NODES: 'fc25640e-50ee-4e04-aad6-2a5336c09eaf',
  CLICKHOUSE_NODE_TYPES: 'ef3cbeeb-9fbe-48b0-a068-1cc8cfb61461',
} as const;

/** Numeric Grafana datasource IDs (legacy, still required in query payloads) */
export const GRAFANA_DATASOURCE_IDS = {
  CLICKHOUSE_NODES: 10,
  CLICKHOUSE_NODE_TYPES: 8,
} as const;

/**
 * Fixed node counts for Algorand Foundation infrastructure.
 * @see https://developer.algorand.org/docs/get-details/algorand-networks/mainnet/
 */
export const ALGORAND_INFRASTRUCTURE = {
  RELAY_NODES: 78,
  ARCHIVER_NODES: 19,
} as const;
