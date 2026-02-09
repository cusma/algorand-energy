import { ChevronUp, ChevronDown } from 'lucide-react';

import { ErrorCard, PaginationControls, SearchBar } from './ui';
import { useCountryEmissions, MergedCountryData } from '../hooks/useCountryEmissions';
import { useTableState } from '../hooks/useTableState';
import { formatNumber, getEmissionsGradientColor } from '../lib/utils';

type SortKey = string & keyof MergedCountryData;
type SortDirection = 'asc' | 'desc';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const SKELETON_ROW_COUNT = 10;

interface ColumnDef {
  label: string;
  subtitle?: string;
  sortKey: SortKey;
  align?: 'left' | 'right';
  width?: string;
}

const COLUMNS: ColumnDef[] = [
  { label: 'Country', sortKey: 'countryName', align: 'left', width: 'w-64' },
  { label: 'Nodes', subtitle: 'count', sortKey: 'nodeCount' },
  { label: 'Node %', subtitle: 'of total', sortKey: 'nodePercentage' },
  { label: 'Intensity', subtitle: 'gCO\u2082e/kWh', sortKey: 'carbonIntensity' },
  { label: 'Emissions %', subtitle: 'of total', sortKey: 'emissionsPercentage' },
  { label: 'Relative Emissions', subtitle: 'emissions % / node %', sortKey: 'relativeEmissions' },
];

const COLUMN_COUNT = COLUMNS.length + 1;

const formatNullable = (value: number | null, formatter: (v: number) => string): string =>
  value === null ? 'N/A' : formatter(value);

const nullCellClass = (value: number | null) =>
  value === null ? 'text-muted-foreground opacity-50' : '';

const SortIndicator = ({ active, direction }: { active: boolean; direction: SortDirection }) => {
  if (!active) {
    return <span className="text-xs opacity-40">&#8693;</span>;
  }
  return direction === 'asc' ? (
    <ChevronUp size={14} className="text-primary" />
  ) : (
    <ChevronDown size={14} className="text-primary" />
  );
};

const SortableHeader = ({
  label,
  subtitle,
  sortKey,
  sortConfig,
  onSort,
  align = 'right',
  width,
}: {
  label: string;
  subtitle?: string;
  sortKey: SortKey;
  sortConfig: { key: SortKey; direction: SortDirection };
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
  width?: string;
}) => (
  <th
    className={`hover:bg-muted/70 cursor-pointer px-4 py-3 ${align === 'right' ? 'text-right' : 'text-left'} text-xs font-semibold tracking-wide uppercase transition-colors ${width ?? ''}`}
    onClick={() => onSort(sortKey)}
  >
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} gap-1`}>
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <SortIndicator active={sortConfig.key === sortKey} direction={sortConfig.direction} />
      </div>
      {subtitle && (
        <span className="text-muted-foreground text-xs font-normal normal-case">{subtitle}</span>
      )}
    </div>
  </th>
);

const TableSkeleton = () => (
  <div className="bg-card border-border shadow-card overflow-hidden rounded-lg border">
    <SearchBar query="" onChange={() => {}} disabled />
    <div className="overflow-x-auto">
      <table className="w-full min-w-160">
        <thead className="bg-muted/50 border-border border-b">
          <tr>
            {Array.from({ length: COLUMN_COUNT }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="bg-muted h-4 animate-pulse rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: COLUMN_COUNT }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div className="bg-muted h-4 animate-pulse rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CountryRow = ({ country, rowNumber }: { country: MergedCountryData; rowNumber: number }) => (
  <tr className="hover:bg-muted/30 transition-colors">
    <td className="text-muted-foreground w-16 px-4 py-3 text-center font-mono text-sm">
      {rowNumber}
    </td>
    <td className="w-64 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-xl" aria-label={country.countryName}>
          {country.flagEmoji}
        </span>
        <span className="font-medium">{country.countryName}</span>
      </div>
    </td>
    <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">
      {formatNumber(country.nodeCount, 0)}
    </td>
    <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">
      {formatNullable(country.nodePercentage, (v) => `${v.toFixed(2)}%`)}
    </td>
    <td
      className={`px-4 py-3 text-right font-mono text-sm tabular-nums ${nullCellClass(country.carbonIntensity)}`}
    >
      {formatNullable(country.carbonIntensity, (v) => formatNumber(v, 2))}
    </td>
    <td
      className={`px-4 py-3 text-right font-mono text-sm tabular-nums ${nullCellClass(country.emissionsPercentage)}`}
    >
      {formatNullable(country.emissionsPercentage, (v) => `${v.toFixed(2)}%`)}
    </td>
    <td
      className={`px-4 py-3 text-right font-mono text-sm font-bold tabular-nums ${nullCellClass(country.relativeEmissions)}`}
      style={{
        backgroundColor: getEmissionsGradientColor(country.relativeEmissions),
        color: country.relativeEmissions !== null ? '#000000' : undefined,
      }}
    >
      {formatNullable(country.relativeEmissions, (v) => v.toFixed(3))}
    </td>
  </tr>
);

const filterCountry = (country: MergedCountryData, query: string): boolean =>
  country.countryName.toLowerCase().includes(query) ||
  country.countryCode2.toLowerCase().includes(query) ||
  (country.countryCode3?.toLowerCase().includes(query) ?? false);

export const CountryEmissionsTable = () => {
  const { data, isLoading, error } = useCountryEmissions();

  const {
    sortConfig,
    searchQuery,
    currentPage,
    rowsPerPage,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
    sortedData,
    handleSort,
    handleSearchChange,
    handleRowsPerPageChange,
    goToPage,
  } = useTableState(data, filterCountry, { defaultSortKey: 'nodeCount' });

  return (
    <div>
      <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
        Country Emissions Analysis
      </h3>
      <div className="text-muted-foreground mb-3 text-xs">
        <p>Node distribution and carbon intensity by country</p>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : error || !data ? (
        <ErrorCard title="Failed to load emissions data" />
      ) : (
        <div className="bg-card border-border shadow-card overflow-hidden rounded-lg border">
          <SearchBar
            query={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by country name or code..."
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-160">
              <thead className="bg-muted/50 border-border border-b">
                <tr>
                  <th className="w-16 px-4 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                    <span>#</span>
                  </th>
                  {COLUMNS.map((col) => (
                    <SortableHeader
                      key={col.sortKey}
                      label={col.label}
                      subtitle={col.subtitle}
                      sortKey={col.sortKey}
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      align={col.align}
                      width={col.width}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMN_COUNT} className="px-4 py-8 text-center">
                      <p className="text-muted-foreground text-sm">
                        {searchQuery ? 'No countries match your search' : 'No data available'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((country, index) => (
                    <CountryRow
                      key={country.countryCode2}
                      country={country}
                      rowNumber={startIndex + index + 1}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            startIndex={startIndex}
            endIndex={endIndex}
            totalRows={sortedData.length}
            onPageChange={goToPage}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </div>
      )}
    </div>
  );
};
