import { ofetch } from 'ofetch';

import {
  owidChartMetadataSchema,
  owidDataResponseSchema,
  owidMetadataResponseSchema,
  type CarbonIntensityData,
  type CountryIntensity,
  type OwidDataResponse,
  type OwidMetadataResponse,
} from '../schemas/carbon.js';

// OWID gives each data release a new indicator ID; the chart always shows the latest release.
const OWID_CHART_METADATA_URL =
  'https://ourworldindata.org/grapher/carbon-intensity-electricity.metadata.json';
const OWID_INDICATORS_URL = 'https://api.ourworldindata.org/v1/indicators';

async function fetchCurrentIndicatorId(): Promise<number> {
  const response = await ofetch(OWID_CHART_METADATA_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const [column] = Object.values(owidChartMetadataSchema.parse(response).columns);
  if (!column) {
    throw new Error('OWID chart metadata lists no indicator');
  }
  return column.owidVariableId;
}

export async function fetchOwidData(indicatorId: number): Promise<OwidDataResponse> {
  const response = await ofetch(`${OWID_INDICATORS_URL}/${indicatorId}.data.json`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return owidDataResponseSchema.parse(response);
}

export async function fetchOwidMetadata(indicatorId: number): Promise<OwidMetadataResponse> {
  const response = await ofetch(`${OWID_INDICATORS_URL}/${indicatorId}.metadata.json`, {
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
  const indicatorId = await fetchCurrentIndicatorId();
  const [data, metadata] = await Promise.all([
    fetchOwidData(indicatorId),
    fetchOwidMetadata(indicatorId),
  ]);

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
