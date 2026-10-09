import { resolveSrv } from 'dns/promises';

/** Bootstrap domains that algod uses to find mainnet relays; the second one is the backup. */
const MAINNET_BOOTSTRAP_DOMAINS = ['mainnet.algorand.network', 'mainnet.algorand.net'];

export interface RelayCounts {
  relays: number;
  archivers: number;
}

async function countSrvTargets(service: string, domains: readonly string[]): Promise<number> {
  let lastError: unknown = new Error(`No bootstrap domain for ${service}`);
  for (const domain of domains) {
    try {
      const records = await resolveSrv(`${service}.${domain}`);
      return new Set(records.map((record) => record.name.toLowerCase())).size;
    } catch (error: unknown) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Counts the relay and archival nodes in the official mainnet DNS lists. */
export async function fetchRelayCounts(
  domains: readonly string[] = MAINNET_BOOTSTRAP_DOMAINS
): Promise<RelayCounts> {
  const [relays, archivers] = await Promise.all([
    countSrvTargets('_algobootstrap._tcp', domains),
    countSrvTargets('_archive._tcp', domains),
  ]);
  return { relays, archivers };
}
