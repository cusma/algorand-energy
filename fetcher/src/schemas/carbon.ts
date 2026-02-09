import { z } from 'zod';

export const owidDataResponseSchema = z.object({
  values: z.array(z.number()),
  years: z.array(z.number()),
  entities: z.array(z.number()),
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

export interface CountryIntensity {
  code: string;
  name: string;
  intensity: number;
  year: number;
}

export interface CarbonIntensityData {
  timestamp: string;
  globalAverage?: number;
  countries: CountryIntensity[];
  metadata: {
    unit: string;
    description: string;
    source: string;
  };
}

export type OwidDataResponse = z.infer<typeof owidDataResponseSchema>;
export type OwidMetadataResponse = z.infer<typeof owidMetadataResponseSchema>;
