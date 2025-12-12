import { z } from 'zod';

// Our World in Data API response schema - based on actual API response
// The API returns parallel arrays at the same index:
// - years[i], entities[i], values[i] all correspond to the same data point
export const owidDataResponseSchema = z.object({
  values: z.array(z.number()), // Carbon intensity values
  years: z.array(z.number()), // Years
  entities: z.array(z.number()), // Entity IDs
});

export const owidMetadataResponseSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    unit: z.string(),
    shortUnit: z.string(),
    descriptionShort: z.string(),
    presentation: z.object({
      attributionShort: z.string(),
    }),
    dimensions: z.object({
      entities: z.object({
        values: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            code: z.string().nullable(),
          })
        ),
      }),
    }),
  })
  .passthrough(); // Allow additional fields we don't use

// Unified carbon intensity data schema for frontend
export const carbonIntensityDataSchema = z.object({
  timestamp: z.string(),
  globalAverage: z.number().optional(),
  countries: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      intensity: z.number(),
      year: z.number(),
    })
  ),
  metadata: z.object({
    unit: z.string(),
    description: z.string(),
    source: z.string(),
  }),
});

export type CarbonIntensityData = z.infer<typeof carbonIntensityDataSchema>;
export type OwidDataResponse = z.infer<typeof owidDataResponseSchema>;
export type OwidMetadataResponse = z.infer<typeof owidMetadataResponseSchema>;
