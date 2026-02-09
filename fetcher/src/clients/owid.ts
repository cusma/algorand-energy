import { ofetch } from 'ofetch';

import {
  owidDataResponseSchema,
  owidMetadataResponseSchema,
  type CarbonIntensityData,
  type CountryIntensity,
  type OwidDataResponse,
  type OwidMetadataResponse,
} from '../schemas/carbon.js';

const OWID_DATA_URL = 'https://api.ourworldindata.org/v1/indicators/1077602.data.json';
const OWID_METADATA_URL = 'https://api.ourworldindata.org/v1/indicators/1077602.metadata.json';

export async function fetchOwidData(): Promise<OwidDataResponse> {
  const response = await ofetch(OWID_DATA_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return owidDataResponseSchema.parse(response);
}

export async function fetchOwidMetadata(): Promise<OwidMetadataResponse> {
  const response = await ofetch(OWID_METADATA_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return owidMetadataResponseSchema.parse(response);
}

/**
 * Resolve each entity's most recent carbon-intensity value and keep only
 * entries with a valid 3-letter country code.
 *
 * The OWID API returns parallel arrays where years[i], entities[i], values[i]
 * correspond to the same data point.
 */
function buildCountryIntensities(
  data: OwidDataResponse,
  metadata: OwidMetadataResponse
): CountryIntensity[] {
  const entitiesById = new Map<number, { name: string; code?: string }>();
  for (const entity of metadata.dimensions.entities.values) {
    entitiesById.set(entity.id, { name: entity.name, code: entity.code || undefined });
  }

  const latestByEntity = new Map<number, { year: number; value: number }>();
  for (let i = 0; i < data.values.length; i++) {
    const year = data.years[i];
    const entityId = data.entities[i];
    const value = data.values[i];

    const existing = latestByEntity.get(entityId);
    if (!existing || year > existing.year) {
      latestByEntity.set(entityId, { year, value });
    }
  }

  return Array.from(latestByEntity.entries())
    .flatMap(([entityId, { year, value }]) => {
      const entity = entitiesById.get(entityId);
      if (!entity) {
        console.warn(`Unknown entity ID: ${entityId}`);
        return [];
      }
      if (!entity.code || entity.code.length !== 3) return [];
      return [{ code: entity.code, name: entity.name, intensity: value, year }];
    })
    .sort((a, b) => b.intensity - a.intensity);
}

/** Unweighted arithmetic mean across all countries. */
function computeGlobalAverage(countries: CountryIntensity[]): number | undefined {
  if (countries.length === 0) return undefined;
  const total = countries.reduce((sum, c) => sum + c.intensity, 0);
  return total / countries.length;
}

export async function fetchCarbonIntensityData(timestamp: string): Promise<CarbonIntensityData> {
  const [data, metadata] = await Promise.all([fetchOwidData(), fetchOwidMetadata()]);

  const countries = buildCountryIntensities(data, metadata);

  return {
    timestamp,
    globalAverage: computeGlobalAverage(countries),
    countries,
    metadata: {
      unit: metadata.shortUnit || metadata.unit,
      description: metadata.descriptionShort,
      source: metadata.presentation.attributionShort,
    },
  };
}
