/**
 * Mapping of ISO 3166-1 alpha-2 to alpha-3 country codes.
 *
 * Used to convert 2-letter country codes from node geolocation data to
 * 3-letter codes used in carbon intensity datasets from Our World in Data.
 *
 * Standard: ISO 3166-1 (International Organization for Standardization)
 * Coverage: 84 countries where Algorand nodes are currently located
 *
 * @constant {Record<string, string>}
 * @see {@link https://en.wikipedia.org/wiki/ISO_3166-1 | ISO 3166-1 Standard}
 *
 * @example
 * ISO_2_TO_3['US']  // Returns: 'USA'
 * ISO_2_TO_3['DE']  // Returns: 'DEU'
 */
export const ISO_2_TO_3: Record<string, string> = {
  US: 'USA',
  DE: 'DEU',
  PK: 'PAK',
  IE: 'IRL',
  FR: 'FRA',
  GB: 'GBR',
  CA: 'CAN',
  SG: 'SGP',
  NL: 'NLD',
  FI: 'FIN',
  IN: 'IND',
  AT: 'AUT',
  JP: 'JPN',
  PL: 'POL',
  AU: 'AUS',
  IT: 'ITA',
  CH: 'CHE',
  AE: 'ARE',
  ES: 'ESP',
  SA: 'SAU',
  HK: 'HKG',
  BE: 'BEL',
  SE: 'SWE',
  KR: 'KOR',
  PT: 'PRT',
  BR: 'BRA',
  CZ: 'CZE',
  BD: 'BGD',
  GR: 'GRC',
  NO: 'NOR',
  RO: 'ROU',
  IL: 'ISR',
  MX: 'MEX',
  LT: 'LTU',
  CN: 'CHN',
  TR: 'TUR',
  HR: 'HRV',
  TH: 'THA',
  VN: 'VNM',
  TW: 'TWN',
  NG: 'NGA',
  CO: 'COL',
  PH: 'PHL',
  OM: 'OMN',
  ZA: 'ZAF',
  ID: 'IDN',
  UA: 'UKR',
  EE: 'EST',
  BG: 'BGR',
  RU: 'RUS',
  CY: 'CYP',
  LV: 'LVA',
  HU: 'HUN',
  DO: 'DOM',
  MY: 'MYS',
  IS: 'ISL',
  MV: 'MDV',
  KE: 'KEN',
  SI: 'SVN',
  LU: 'LUX',
  AR: 'ARG',
  SK: 'SVK',
  EC: 'ECU',
  QA: 'QAT',
  AL: 'ALB',
  BH: 'BHR',
  CD: 'COD',
  AM: 'ARM',
  MT: 'MLT',
  PR: 'PRI',
  DK: 'DNK',
  KY: 'CYM',
  UY: 'URY',
  VE: 'VEN',
  NZ: 'NZL',
  KZ: 'KAZ',
  PY: 'PRY',
  DZ: 'DZA',
  CL: 'CHL',
  BO: 'BOL',
  KW: 'KWT',
};

/**
 * Mapping of ISO 3166-1 alpha-2 country codes to full country names in English.
 *
 * Used for displaying human-readable country names in the emissions table and
 * other UI components. Names follow official short-form conventions from the
 * ISO 3166-1 standard.
 *
 * Coverage: 84 countries matching the ISO_2_TO_3 mapping
 *
 * @constant {Record<string, string>}
 *
 * @example
 * COUNTRY_NAMES['US']  // Returns: 'United States'
 * COUNTRY_NAMES['GB']  // Returns: 'United Kingdom'
 */
export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  DE: 'Germany',
  PK: 'Pakistan',
  IE: 'Ireland',
  FR: 'France',
  GB: 'United Kingdom',
  CA: 'Canada',
  SG: 'Singapore',
  NL: 'Netherlands',
  FI: 'Finland',
  IN: 'India',
  AT: 'Austria',
  JP: 'Japan',
  PL: 'Poland',
  AU: 'Australia',
  IT: 'Italy',
  CH: 'Switzerland',
  AE: 'United Arab Emirates',
  ES: 'Spain',
  SA: 'Saudi Arabia',
  HK: 'Hong Kong',
  BE: 'Belgium',
  SE: 'Sweden',
  KR: 'South Korea',
  PT: 'Portugal',
  BR: 'Brazil',
  CZ: 'Czechia',
  BD: 'Bangladesh',
  GR: 'Greece',
  NO: 'Norway',
  RO: 'Romania',
  IL: 'Israel',
  MX: 'Mexico',
  LT: 'Lithuania',
  CN: 'China',
  TR: 'Turkey',
  HR: 'Croatia',
  TH: 'Thailand',
  VN: 'Vietnam',
  TW: 'Taiwan',
  NG: 'Nigeria',
  CO: 'Colombia',
  PH: 'Philippines',
  OM: 'Oman',
  ZA: 'South Africa',
  ID: 'Indonesia',
  UA: 'Ukraine',
  EE: 'Estonia',
  BG: 'Bulgaria',
  RU: 'Russia',
  CY: 'Cyprus',
  LV: 'Latvia',
  HU: 'Hungary',
  DO: 'Dominican Republic',
  MY: 'Malaysia',
  IS: 'Iceland',
  MV: 'Maldives',
  KE: 'Kenya',
  SI: 'Slovenia',
  LU: 'Luxembourg',
  AR: 'Argentina',
  SK: 'Slovakia',
  EC: 'Ecuador',
  QA: 'Qatar',
  AL: 'Albania',
  BH: 'Bahrain',
  CD: 'Democratic Republic of Congo',
  AM: 'Armenia',
  MT: 'Malta',
  PR: 'Puerto Rico',
  DK: 'Denmark',
  KY: 'Cayman Islands',
  UY: 'Uruguay',
  VE: 'Venezuela',
  NZ: 'New Zealand',
  KZ: 'Kazakhstan',
  PY: 'Paraguay',
  DZ: 'Algeria',
  CL: 'Chile',
  BO: 'Bolivia',
  KW: 'Kuwait',
};

/**
 * Generates a flag emoji from a 2-letter ISO country code
 * Uses Unicode regional indicator symbols (U+1F1E6 to U+1F1FF)
 *
 * @param countryCode - 2-letter ISO country code (e.g., 'US', 'DE')
 * @returns Flag emoji (e.g., 🇺🇸, 🇩🇪)
 */
export const getCountryFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};
