import { z } from 'zod';

const grafanaFieldSchema = z.object({ name: z.string() }).passthrough();

export const grafanaResponseSchema = z.object({
  results: z.object({
    A: z.object({
      status: z.number().optional(),
      frames: z.array(
        z.object({
          schema: z.object({
            name: z.string().optional(),
            refId: z.string().optional(),
            meta: z.unknown().optional(),
            fields: z.array(grafanaFieldSchema),
          }),
          data: z.object({
            values: z.array(z.array(z.unknown())),
          }),
        })
      ),
    }),
  }),
});

export type GrafanaResponse = z.infer<typeof grafanaResponseSchema>;
