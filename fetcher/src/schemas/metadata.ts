import { z } from 'zod';

// Error log schema
export const errorLogSchema = z.object({
  source: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

// Metadata schema for tracking data freshness and errors
export const metadataSchema = z.object({
  lastUpdate: z.string(),
  nextScheduledUpdate: z.string().optional(),
  dataFreshness: z.object({
    nodes: z.object({
      lastSuccessfulFetch: z.string(),
      isStale: z.boolean(),
      error: z.string().optional(),
    }),
    carbonIntensity: z.object({
      lastSuccessfulFetch: z.string(),
      isStale: z.boolean(),
      error: z.string().optional(),
    }),
    geographical: z.object({
      lastSuccessfulFetch: z.string(),
      isStale: z.boolean(),
      error: z.string().optional(),
    }),
  }),
  errors: z.array(errorLogSchema).optional(),
  version: z.string(),
});

export type Metadata = z.infer<typeof metadataSchema>;
export type ErrorLog = z.infer<typeof errorLogSchema>;
