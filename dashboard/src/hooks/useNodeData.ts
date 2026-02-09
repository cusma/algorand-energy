import { createDataHook } from './createDataHook';
import { nodeDataSchema } from '../schemas/data';

export const useNodeData = createDataHook('nodeData', 'data/latest/nodes.json', nodeDataSchema);
