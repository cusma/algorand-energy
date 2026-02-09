import { fetchAllNodeData } from './clients/node-data.js';
import { fetchNodesByCountry } from './clients/nodely.js';
import { fetchCarbonIntensityData } from './clients/owid.js';
import { writeLatestData, writeJsonFile, readExistingData } from './utils/file-writer.js';

import type { DataFreshness, Metadata, ErrorLog } from './types/metadata.js';

function toDataFreshness(
  result: PromiseSettledResult<unknown>,
  timestamp: string,
  anomalyMessage?: string
): DataFreshness {
  if (result.status === 'fulfilled' && !anomalyMessage) {
    return { lastSuccessfulFetch: timestamp, isStale: false };
  }
  return {
    lastSuccessfulFetch: null,
    isStale: true,
    error: anomalyMessage ?? (result.status === 'rejected' ? result.reason?.message : undefined),
  };
}

interface ResultContext {
  filename: string;
  source: string;
  timestamp: string;
}

function toErrorLog(reason: unknown, source: string, timestamp: string): ErrorLog {
  const message = reason instanceof Error ? reason.message : String(reason);
  return { source, message, timestamp };
}

async function handleRejection(
  reason: unknown,
  context: ResultContext,
  onError: (log: ErrorLog) => void
): Promise<void> {
  console.error(`✗ Failed to fetch ${context.source} data:`, reason);
  onError(toErrorLog(reason, context.source, context.timestamp));
  const hasPreviousData = (await readExistingData(context.filename)) !== null;
  if (hasPreviousData) {
    console.warn(`⚠ Keeping previous ${context.source} data`);
  }
}

async function processResult(
  result: PromiseSettledResult<unknown>,
  context: ResultContext,
  onError: (log: ErrorLog) => void
): Promise<void> {
  if (result.status === 'fulfilled') {
    await writeLatestData(context.filename, result.value);
    console.warn(`✓ ${context.source} data fetched and saved`);
  } else {
    await handleRejection(result.reason, context, onError);
  }
}

function handleAnomalies(
  anomalies: string[],
  onError: (log: ErrorLog) => void,
  timestamp: string
): string {
  console.warn(`⚠ Skipping nodes.json write due to ${anomalies.length} anomaly(s):`);
  anomalies.forEach((a) => console.warn(`  - ${a}`));
  const message = anomalies.join('; ');
  onError(toErrorLog(message, 'nodes-anomaly', timestamp));
  return `Anomalous data skipped: ${message}`;
}

async function processNodeResult(
  result: PromiseSettledResult<{ data: unknown; anomalies: string[] }>,
  onError: (log: ErrorLog) => void,
  timestamp: string
): Promise<string | undefined> {
  const context: ResultContext = { filename: 'nodes.json', source: 'nodes', timestamp };
  if (result.status === 'rejected') {
    await handleRejection(result.reason, context, onError);
    return undefined;
  }

  const { data, anomalies } = result.value;
  if (anomalies.length > 0) {
    return handleAnomalies(anomalies, onError, timestamp);
  }

  await writeLatestData('nodes.json', data);
  console.warn('✓ Node data fetched and saved');
  return undefined;
}

async function main() {
  console.warn('🚀 Starting Algorand energy data fetch...\n');

  const runTimestamp = new Date().toISOString();
  const errors: ErrorLog[] = [];
  const startTime = Date.now();

  const [nodeData, carbonIntensityData, geographicalData] = await Promise.allSettled([
    fetchAllNodeData(runTimestamp),
    fetchCarbonIntensityData(runTimestamp),
    fetchNodesByCountry(runTimestamp),
  ]);

  const addError = (log: ErrorLog) => errors.push(log);

  const nodesAnomalyMessage = await processNodeResult(nodeData, addError, runTimestamp);
  await processResult(
    carbonIntensityData,
    { filename: 'carbon-intensity.json', source: 'Carbon intensity', timestamp: runTimestamp },
    addError
  );
  await processResult(
    geographicalData,
    { filename: 'geographical.json', source: 'Geographical', timestamp: runTimestamp },
    addError
  );

  const metadata: Metadata = {
    lastUpdate: runTimestamp,
    dataFreshness: {
      nodes: toDataFreshness(nodeData, runTimestamp, nodesAnomalyMessage),
      carbonIntensity: toDataFreshness(carbonIntensityData, runTimestamp),
      geographical: toDataFreshness(geographicalData, runTimestamp),
    },
    errors: errors.length > 0 ? errors : undefined,
    version: '1.0.0',
  };

  try {
    await writeJsonFile('metadata.json', metadata);
    console.warn('✓ Metadata saved');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('✗ Failed to save metadata:', errorMessage);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.warn(`\n✅ Data fetch completed in ${duration}s`);

  if (errors.length > 0) {
    console.warn(`⚠ ${errors.length} error(s) occurred during fetch`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
