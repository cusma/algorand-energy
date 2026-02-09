import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

export function createDataHook<T>(queryKey: string, path: string, schema: z.ZodType<T>) {
  const fetchFn = async (): Promise<T> => {
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${queryKey}: ${response.status}`);
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        `Expected JSON for ${queryKey}, got ${contentType || 'unknown content type'}`
      );
    }
    const data = await response.json();
    return schema.parse(data);
  };

  return () => useQuery({ queryKey: [queryKey], queryFn: fetchFn });
}
