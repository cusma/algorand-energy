import { createDataHook } from './createDataHook';
import { carbonIntensityDataSchema } from '../schemas/data';

export const useCarbonData = createDataHook(
  'carbonIntensityData',
  'data/latest/carbon-intensity.json',
  carbonIntensityDataSchema
);
