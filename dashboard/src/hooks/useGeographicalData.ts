import { createDataHook } from './createDataHook';
import { geographicalDataSchema } from '../schemas/data';

export const useGeographicalData = createDataHook(
  'geographicalData',
  'data/latest/geographical.json',
  geographicalDataSchema
);
