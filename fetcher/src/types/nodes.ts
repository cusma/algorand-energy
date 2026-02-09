export interface NodeData {
  timestamp: string;
  totalNodes: number;
  validators: number;
  relays: number;
  archivers: number;
  apiNodes: number;
  historicalData?: {
    date: string;
    nodeCount: number;
  }[];
}
