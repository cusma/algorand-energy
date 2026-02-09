export interface ErrorLog {
  source: string;
  message: string;
  timestamp: string;
}

export interface DataFreshness {
  lastSuccessfulFetch: string | null;
  isStale: boolean;
  error?: string;
}

export interface Metadata {
  lastUpdate: string;
  dataFreshness: {
    nodes: DataFreshness;
    carbonIntensity: DataFreshness;
    geographical: DataFreshness;
  };
  errors?: ErrorLog[];
  version: string;
}
