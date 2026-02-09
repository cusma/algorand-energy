export interface GeographicalData {
  timestamp: string;
  nodesByCountry: {
    countryCode: string;
    nodeCount: number;
  }[];
  totalCountries: number;
  metadata?: {
    source: string;
    description: string;
  };
}
