import {
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';

import { useCountryEmissions, MergedCountryData } from '../hooks/useCountryEmissions';
import { formatNumber, getEmissionsGradientColor } from '../lib/utils';

type SortKey = keyof MergedCountryData;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_ROWS_PER_PAGE = 25;

const SortIndicator = ({ active, direction }: { active: boolean; direction: SortDirection }) => {
  if (!active) {
    return <span className="text-xs opacity-40">⇅</span>;
  }
  return direction === 'asc' ? (
    <ChevronUp size={14} className="text-primary" />
  ) : (
    <ChevronDown size={14} className="text-primary" />
  );
};

export const CountryEmissionsTable = () => {
  const { data, isLoading, error } = useCountryEmissions();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'nodeCount',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase().trim();
    return data.filter(
      (country) =>
        country.countryName.toLowerCase().includes(query) ||
        country.countryCode2.toLowerCase().includes(query) ||
        country.countryCode3?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const sortedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null values (always sort to bottom)
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortConfig.direction === 'asc') {
        return (aValue as number) - (bValue as number);
      }
      return (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, sortedData.length);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const changeRowsPerPage = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="bg-card border-border shadow-card overflow-hidden rounded-lg border">
        <div className="border-border border-b px-6 py-4">
          <div className="bg-muted h-6 w-1/4 animate-pulse rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160">
            <thead className="bg-muted/50 border-border border-b">
              <tr>
                {[...Array(7)].map((_, i) => (
                  <th key={i} className="px-4 py-3">
                    <div className="bg-muted h-4 animate-pulse rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {[...Array(10)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
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
  }

  if (error || !data) {
    return (
      <div className="bg-card border-destructive/30 shadow-card rounded-lg border p-5">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-destructive" size={24} />
          <div>
            <p className="text-destructive font-semibold">Failed to load emissions data</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Please check your connection and try again
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatPercentage = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatIntensity = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    return formatNumber(value, 2);
  };

  const formatRelativeEmissions = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(3);
  };

  return (
    <div>
      <h3 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
        Country Emissions Analysis
      </h3>
      <div className="text-muted-foreground mb-3 text-xs">
        <p>Node distribution and carbon intensity by country</p>
      </div>

      <div className="bg-card border-border shadow-card overflow-hidden rounded-lg border">
        <div className="border-border border-b px-6 py-4">
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by country name or code..."
              className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-primary w-full rounded border py-2 pr-9 pl-9 text-xs focus:ring-2 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-160">
            <thead className="bg-muted/50 border-border border-b">
              <tr>
                <th className="w-16 px-4 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                  <span>#</span>
                </th>
                <th
                  className="hover:bg-muted/70 w-64 cursor-pointer px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase transition-colors"
                  onClick={() => handleSort('countryName')}
                >
                  <div className="flex items-center gap-2">
                    <span>Country</span>
                    <SortIndicator
                      active={sortConfig.key === 'countryName'}
                      direction={sortConfig.direction}
                    />
                  </div>
                </th>
                <th
                  className="hover:bg-muted/70 cursor-pointer px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase transition-colors"
                  onClick={() => handleSort('nodeCount')}
                >
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span>Nodes</span>
                      <SortIndicator
                        active={sortConfig.key === 'nodeCount'}
                        direction={sortConfig.direction}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs font-normal normal-case">
                      count
                    </span>
                  </div>
                </th>
                <th
                  className="hover:bg-muted/70 cursor-pointer px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase transition-colors"
                  onClick={() => handleSort('nodePercentage')}
                >
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span>Node %</span>
                      <SortIndicator
                        active={sortConfig.key === 'nodePercentage'}
                        direction={sortConfig.direction}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs font-normal normal-case">
                      of total
                    </span>
                  </div>
                </th>
                <th
                  className="hover:bg-muted/70 cursor-pointer px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase transition-colors"
                  onClick={() => handleSort('carbonIntensity')}
                >
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span>Intensity</span>
                      <SortIndicator
                        active={sortConfig.key === 'carbonIntensity'}
                        direction={sortConfig.direction}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs font-normal normal-case">
                      gCO₂e/kWh
                    </span>
                  </div>
                </th>
                <th
                  className="hover:bg-muted/70 cursor-pointer px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase transition-colors"
                  onClick={() => handleSort('emissionsPercentage')}
                >
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span>Emissions %</span>
                      <SortIndicator
                        active={sortConfig.key === 'emissionsPercentage'}
                        direction={sortConfig.direction}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs font-normal normal-case">
                      of total
                    </span>
                  </div>
                </th>
                <th
                  className="hover:bg-muted/70 cursor-pointer px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase transition-colors"
                  onClick={() => handleSort('relativeEmissions')}
                >
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span>Relative Emissions</span>
                      <SortIndicator
                        active={sortConfig.key === 'relativeEmissions'}
                        direction={sortConfig.direction}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs font-normal normal-case">
                      emissions % / node %
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      {searchQuery ? 'No countries match your search' : 'No data available'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((country, index) => (
                  <tr key={country.countryCode2} className="hover:bg-muted/30 transition-colors">
                    <td className="text-muted-foreground w-16 px-4 py-3 text-center font-mono text-sm">
                      {startIndex + index + 1}
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
                      {formatPercentage(country.nodePercentage)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-sm tabular-nums ${
                        country.carbonIntensity === null ? 'text-muted-foreground opacity-50' : ''
                      }`}
                    >
                      {formatIntensity(country.carbonIntensity)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-sm tabular-nums ${
                        country.emissionsPercentage === null
                          ? 'text-muted-foreground opacity-50'
                          : ''
                      }`}
                    >
                      {formatPercentage(country.emissionsPercentage)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono text-sm font-bold tabular-nums ${
                        country.relativeEmissions === null ? 'text-muted-foreground opacity-50' : ''
                      }`}
                      style={{
                        backgroundColor: getEmissionsGradientColor(country.relativeEmissions),
                        color: country.relativeEmissions !== null ? '#000000' : undefined,
                      }}
                    >
                      {formatRelativeEmissions(country.relativeEmissions)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-border flex flex-col items-center justify-between gap-4 border-t px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => changeRowsPerPage(Number(e.target.value))}
              className="border-border bg-card text-foreground focus:ring-primary rounded border px-2 py-0.5 text-xs focus:ring-2 focus:outline-none"
            >
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <span className="text-muted-foreground text-xs">
            {startIndex + 1}-{endIndex} of {sortedData.length}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="border-border hover:bg-muted/50 rounded border px-3 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-border hover:bg-muted/50 rounded border px-3 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-border hover:bg-muted/50 rounded border px-3 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="border-border hover:bg-muted/50 rounded border px-3 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
