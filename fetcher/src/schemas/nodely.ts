import { z } from 'zod';

/** Every panel of Nodely's public graphs API (`GET /api/v1/p/<panel>`) is a table. */
export const panelSchema = z.object({
  cols: z.array(z.object({ name: z.string() })),
  rows: z.array(z.array(z.unknown())),
});

/** `network.count_trend` row: the full-time node estimate (Chao-1) of one UTC day. */
export const dailyNodeCountSchema = z.object({
  t: z.number(), // Unix seconds at 00:00 UTC
  full_time_nodes: z.number(),
});

/** `consensus.registered` row: accounts online with a participation key past the latest round. */
export const registeredAccountsSchema = z.object({
  registered_accounts: z.number(),
});

/** `network.locations` row: nodes per country code, averaged over the last 24 hours. */
export const countryNodesSchema = z.object({
  cc: z.string(),
  nodes: z.number(),
});
