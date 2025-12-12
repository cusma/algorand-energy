import { fetchAllNodeData, fetchNodesByCountry } from './clients/nodely.js';
import { fetchCarbonIntensityData } from './clients/owid.js';
import { writeDataFiles, writeJsonFile, readExistingData } from './utils/file-writer.js';

import type { Metadata, ErrorLog } from './schemas/metadata.js';

/**
 * Main data fetcher orchestration
 */
async function main() {
  console.log('🚀 Starting Algorand energy data fetch...\n');

  const errors: ErrorLog[] = [];
  const startTime = Date.now();

  const [nodeData, carbonIntensityData, geographicalData] = await Promise.allSettled([
    fetchAllNodeData(),
    fetchCarbonIntensityData(),
    fetchNodesByCountry(),
  ]);

  if (nodeData.status === 'fulfilled') {
    try {
      await writeDataFiles('nodes.json', nodeData.value);
      console.log('✓ Node data fetched and saved');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('✗ Failed to save node data:', errorMessage);
      errors.push({
        source: 'nodes',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  } else {
    console.error('✗ Failed to fetch node data:', nodeData.reason);
    errors.push({
      source: 'nodes',
      message: nodeData.reason?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    // Try to keep existing data
    const existingData = await readExistingData('nodes.json');
    if (existingData) {
      console.warn('⚠ Using stale node data');
    }
  }

  if (carbonIntensityData.status === 'fulfilled') {
    try {
      await writeDataFiles('carbon-intensity.json', carbonIntensityData.value);
      console.log('✓ Carbon intensity data fetched and saved');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('✗ Failed to save carbon intensity data:', errorMessage);
      errors.push({
        source: 'carbonIntensity',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  } else {
    console.error('✗ Failed to fetch carbon intensity data:', carbonIntensityData.reason);
    errors.push({
      source: 'carbonIntensity',
      message: carbonIntensityData.reason?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    const existingData = await readExistingData('carbon-intensity.json');
    if (existingData) {
      console.warn('⚠ Using stale carbon intensity data');
    }
  }

  if (geographicalData.status === 'fulfilled') {
    try {
      await writeDataFiles('geographical.json', geographicalData.value);
      console.log('✓ Geographical data fetched and saved');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('✗ Failed to save geographical data:', errorMessage);
      errors.push({
        source: 'geographical',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  } else {
    console.error('✗ Failed to fetch geographical data:', geographicalData.reason);
    errors.push({
      source: 'geographical',
      message: geographicalData.reason?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    const existingData = await readExistingData('geographical.json');
    if (existingData) {
      console.warn('⚠ Using stale geographical data');
    }
  }

  const metadata: Metadata = {
    lastUpdate: new Date().toISOString(),
    dataFreshness: {
      nodes: {
        lastSuccessfulFetch: nodeData.status === 'fulfilled' ? new Date().toISOString() : 'N/A',
        isStale: nodeData.status === 'rejected',
        error: nodeData.status === 'rejected' ? nodeData.reason?.message : undefined,
      },
      carbonIntensity: {
        lastSuccessfulFetch:
          carbonIntensityData.status === 'fulfilled' ? new Date().toISOString() : 'N/A',
        isStale: carbonIntensityData.status === 'rejected',
        error:
          carbonIntensityData.status === 'rejected'
            ? carbonIntensityData.reason?.message
            : undefined,
      },
      geographical: {
        lastSuccessfulFetch:
          geographicalData.status === 'fulfilled' ? new Date().toISOString() : 'N/A',
        isStale: geographicalData.status === 'rejected',
        error:
          geographicalData.status === 'rejected' ? geographicalData.reason?.message : undefined,
      },
    },
    errors: errors.length > 0 ? errors : undefined,
    version: '1.0.0',
  };

  try {
    await writeJsonFile('metadata.json', metadata);
    console.log('✓ Metadata saved');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('✗ Failed to save metadata:', errorMessage);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Data fetch completed in ${duration}s`);

  if (errors.length > 0) {
    console.warn(`⚠ ${errors.length} error(s) occurred during fetch`);
    process.exit(1); // Exit with error code for CI/CD
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
