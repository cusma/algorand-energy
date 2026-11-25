import { ofetch, type FetchContext } from 'ofetch';
import { z } from 'zod';

import {
  countryNodesSchema,
  dailyNodeCountSchema,
  panelSchema,
  registeredAccountsSchema,
} from '../schemas/nodely.js';

import type { GeographicalData } from '../types/geographical.js';

// Nodely's public graphs site serves each chart as a JSON table read from a fixed view.
// https://g.nodely.io/api/v1/catalog describes every panel.
const NODELY_PANEL_API = 'https://g.nodely.io/api/v1/p';
const USER_AGENT = 'algorand-energy-fetcher (+https://github.com/cusma/algorand-energy)';

// Nodely is behind Cloudflare, which returns 520-524 while the origin server is down or slow.
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524];
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 60_000;

/** Logs each retry, so that the CI log shows transient Nodely errors, and returns its delay. */
function logRetry(panel: string, context: FetchContext): number {
  const retriesLeft = typeof context.options.retry === 'number' ? context.options.retry : 0;
  const retry = MAX_RETRIES - retriesLeft + 1;
  const cause = context.response ? `HTTP ${context.response.status}` : context.error?.message;
  console.warn(
    `⚠ Nodely panel ${panel} failed (${cause}); retry ${retry}/${MAX_RETRIES} in ${RETRY_DELAY_MS / 1000}s`
  );
  return RETRY_DELAY_MS;
}

/** Parses panel data; on failure, reports only the first problem, not one line per row. */
function parsePanelData<T>(panel: string, schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const [issue, ...others] = result.error.issues;
    const where = issue.path.map(String).join('.') || 'top level';
    const more = others.length > 0 ? ` (and ${others.length} more)` : '';
    throw new Error(
      `Unexpected data from Nodely panel ${panel}: ${issue.message} at ${where}${more}`
    );
  }
  return result.data;
}

/** Fetches a panel and returns its rows as objects keyed by column name. */
async function fetchPanel<S extends z.ZodObject>(
  panel: string,
  rowSchema: S,
  query?: Record<string, string>
): Promise<z.infer<S>[]> {
  const response = await ofetch(`${NODELY_PANEL_API}/${panel}`, {
    query,
    headers: { accept: 'application/json', 'user-agent': USER_AGENT },
    retry: MAX_RETRIES,
    retryDelay: (context) => logRetry(panel, context),
    retryStatusCodes: RETRY_STATUS_CODES,
  });
  const { cols, rows } = parsePanelData(panel, panelSchema, response);
  const names = cols.map((col) => col.name);
  const missing = Object.keys(rowSchema.shape).filter((name) => !names.includes(name));
  if (missing.length > 0) {
    throw new Error(
      `Nodely panel ${panel} has no column ${missing.join(', ')}; it has ${names.join(', ')}`
    );
  }
  const records = rows.map((row) => Object.fromEntries(names.map((name, i) => [name, row[i]])));
  return parsePanelData(panel, z.array(rowSchema), records);
}

/** Daily full-time node estimates (Chao-1) for the last year, oldest first, without today. */
export async function fetchDailyNodeCounts(): Promise<{ date: string; nodeCount: number }[]> {
  const rows = await fetchPanel('network.count_trend', dailyNodeCountSchema, { range: '1y' });
  return rows
    .sort((a, b) => a.t - b.t)
    .map((row) => ({
      date: new Date(row.t * 1000).toISOString().split('T')[0],
      nodeCount: row.full_time_nodes,
    }));
}

/** Accounts registered online with a valid participation key, at the latest round. */
export async function fetchValidatorCount(): Promise<number> {
  const [row] = await fetchPanel('consensus.registered', registeredAccountsSchema);
  if (!row) {
    throw new Error('Nodely panel consensus.registered returned no row');
  }
  return row.registered_accounts;
}

export async function fetchNodesByCountry(timestamp: string): Promise<GeographicalData> {
  // The only per-country panel; it stops at the 25 largest countries. The map panel
  // (network.locations) counts H3 hexagons, not countries, since 2026-11-25.
  const rows = await fetchPanel('network.countries', countryNodesSchema);

  const nodesByCountry = rows
    .map((row) => ({ countryCode: row.label.toUpperCase(), nodeCount: row.nodes }))
    .filter((item) => item.countryCode && item.nodeCount > 0)
    .sort((a, b) => b.nodeCount - a.nodeCount);

  return {
    timestamp,
    nodesByCountry,
    totalCountries: nodesByCountry.length,
    metadata: {
      source: 'Nodely public graphs (network.countries)',
      description: 'Distribution of Algorand nodes by country (last 24h, 25 largest countries)',
    },
  };
}
