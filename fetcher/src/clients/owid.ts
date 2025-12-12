import { ofetch } from 'ofetch';

import {
  owidDataResponseSchema,
  owidMetadataResponseSchema,
  type CarbonIntensityData,
  type OwidDataResponse,
  type OwidMetadataResponse,
} from '../schemas/carbon.js';

const OWID_DATA_URL = 'https://api.ourworldindata.org/v1/indicators/1077602.data.json';
const OWID_METADATA_URL = 'https://api.ourworldindata.org/v1/indicators/1077602.metadata.json';

/**
 * Fetch carbon intensity data from Our World in Data
 *
 * The API returns parallel arrays:
 * - years[i] = year for data point i
 * - entities[i] = entity ID for data point i
 * - values[i] = carbon intensity value for data point i
 */
export async function fetchOwidData(): Promise<OwidDataResponse> {
  try {
    const response = await ofetch(OWID_DATA_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const validated = owidDataResponseSchema.parse(response);
    return validated;
  } catch (error) {
    console.error('Error fetching data from Our World in Data:', error);
    throw error;
  }
}

/**
 * Fetch metadata including entity names
 */
export async function fetchOwidMetadata(): Promise<OwidMetadataResponse> {
  try {
    const response = await ofetch(OWID_METADATA_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const validated = owidMetadataResponseSchema.parse(response);
    return validated;
  } catch (error) {
    console.error('Error fetching metadata from Our World in Data:', error);
    throw error;
  }
}

/**
 * Process OWID data to get recent carbon intensity by country
 */
export async function fetchCarbonIntensityData(): Promise<CarbonIntensityData> {
  try {
    const [data, metadata] = await Promise.all([
      fetchOwidData(),
      fetchOwidMetadata(), // Metadata is required for country mapping
    ]);

    // Build entity ID to name mapping from metadata
    const entityMap = new Map<number, { name: string; code?: string }>();

    if (metadata.dimensions?.entities?.values) {
      for (const entity of metadata.dimensions.entities.values) {
        entityMap.set(entity.id, {
          name: entity.name,
          code: entity.code || undefined,
        });
      }
    }

    // Group data by entity and find most recent year for each
    const entityLatestData = new Map<number, { year: number; value: number }>();

    for (let i = 0; i < data.values.length; i++) {
      const year = data.years[i];
      const entityId = data.entities[i];
      const value = data.values[i];

      const existing = entityLatestData.get(entityId);
      if (!existing || year > existing.year) {
        entityLatestData.set(entityId, { year, value });
      }
    }

    // Convert to array with entity names
    const countries = Array.from(entityLatestData.entries())
      .map(([entityId, { year, value }]) => {
        const entity = entityMap.get(entityId);
        if (!entity) {
          console.warn(`Unknown entity ID: ${entityId}`);
          return null;
        }

        return {
          code: entity.code || `ID_${entityId}`,
          name: entity.name,
          intensity: value,
          year: year,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      // Filter out aggregates (keep only countries with codes)
      .filter((item) => item.code && !item.code.startsWith('ID_') && item.code.length === 3)
      .sort((a, b) => b.intensity - a.intensity); // Sort by intensity descending

    // Calculate global average
    const totalIntensity = countries.reduce((sum, c) => sum + c.intensity, 0);
    const globalAverage = countries.length > 0 ? totalIntensity / countries.length : undefined;

    const carbonIntensityData: CarbonIntensityData = {
      timestamp: new Date().toISOString(),
      globalAverage,
      countries,
      metadata: {
        unit: metadata.shortUnit || metadata.unit,
        description: metadata.descriptionShort,
        source: metadata.presentation.attributionShort,
      },
    };

    return carbonIntensityData;
  } catch (error) {
    console.error('Error processing carbon intensity data:', error);
    throw error;
  }
}
