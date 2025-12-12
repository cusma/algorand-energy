import { z } from 'zod';

// Schema for node count data over time
export const nodeCountDataSchema = z.object({
  ts: z.string().or(z.number()), // Can be timestamp string or number
  node_cnt: z.number(),
});

export const nodeCountResponseSchema = z.object({
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

// Schema for validator data
export const validatorResponseSchema = z.object({
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

// Schema for archival and relay nodes
export const nodeTypeResponseSchema = z.object({
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

// Unified node data schema for frontend
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

export type NodeData = z.infer<typeof nodeDataSchema>;
