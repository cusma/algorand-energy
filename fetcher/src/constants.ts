/**
 * Time constants for data fetching operations.
 * All values are in milliseconds.
 *
 * @constant
 */
export const TIME_RANGES = {
  /** One year in milliseconds (365 days) */
  ONE_YEAR: 365 * 24 * 60 * 60 * 1000,

  /** 24 hours in milliseconds */
  ONE_DAY: 24 * 60 * 60 * 1000,

  /** 6 hours in milliseconds */
  SIX_HOURS: 6 * 60 * 60 * 1000,
} as const;

/**
 * Grafana datasource UIDs for different data sources.
 * These UIDs are specific to the Nodely Grafana instance.
 *
 * @constant
 */
export const GRAFANA_DATASOURCES = {
  /** ClickHouse datasource for node count and geographical data */
  CLICKHOUSE_NODES: 'fc25640e-50ee-4e04-aad6-2a5336c09eaf',

  /** PostgreSQL datasource for validator data */
  POSTGRES_VALIDATORS: 'vWgmOt44z',

  /** ClickHouse datasource for node type distribution */
  CLICKHOUSE_NODE_TYPES: 'ef3cbeeb-9fbe-48b0-a068-1cc8cfb61461',
} as const;

/**
 * Known fixed node counts for Algorand infrastructure.
 * These values represent infrastructure nodes maintained by the Algorand Foundation.
 *
 * @see {@link https://developer.algorand.org/docs/get-details/algorand-networks/mainnet/ | Algorand MainNet}
 * @constant
 */
export const ALGORAND_INFRASTRUCTURE = {
  /** Number of relay nodes maintained by the Algorand Foundation */
  RELAY_NODES: 78,

  /** Number of archiver nodes maintained by the Algorand Foundation */
  ARCHIVER_NODES: 19,
} as const;
