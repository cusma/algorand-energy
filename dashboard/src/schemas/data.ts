import { z } from 'zod';

export const nodeDataSchema = z.object({
  timestamp: z.string(),
  totalNodes: z.number(),
  validators: z.number(),
  relays: z.number(),
  archivers: z.number(),
  apiNodes: z.number(),
  historicalData: z
    .array(
      z.object({
        date: z.string(),
        nodeCount: z.number(),
      })
    )
    .optional(),
});

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
  metadata: z
    .object({
      unit: z.string(),
      description: z.string().optional(),
      source: z.string().optional(),
    })
    .optional(),
});

export const geographicalDataSchema = z.object({
  timestamp: z.string(),
  nodesByCountry: z.array(
    z.object({
      countryCode: z.string(),
      nodeCount: z.number(),
    })
  ),
  totalCountries: z.number(),
  metadata: z
    .object({
      source: z.string(),
      description: z.string(),
    })
    .optional(),
});

export type NodeData = z.infer<typeof nodeDataSchema>;
export type CarbonIntensityData = z.infer<typeof carbonIntensityDataSchema>;
export type GeographicalData = z.infer<typeof geographicalDataSchema>;
