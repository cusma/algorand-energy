import { z } from 'zod';

// Schema for Grafana API response (columnar format)
export const geographicalResponseSchema = z.object({
  results: z.object({
    A: z.object({
      status: z.number().optional(),
      frames: z.array(
        z.object({
          schema: z.object({
            name: z.string().optional(),
            refId: z.string().optional(),
            meta: z.any().optional(),
            fields: z.array(z.any()),
          }),
          data: z.object({
            values: z.array(z.array(z.any())),
          }),
        })
      ),
    }),
  }),
});

// Domain model schema for frontend consumption
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

export type GeographicalData = z.infer<typeof geographicalDataSchema>;
