import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

type SortableKey<T> = string & keyof T;

interface SortConfig<T> {
  key: SortableKey<T>;
  direction: SortDirection;
}

interface UseTableStateOptions<T> {
  defaultSortKey: SortableKey<T>;
  defaultRowsPerPage?: number;
}

interface UseTableStateReturn<T> {
  sortConfig: SortConfig<T>;
  searchQuery: string;
  currentPage: number;
  rowsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  paginatedData: T[];
  sortedData: T[];
  handleSort: (key: SortableKey<T>) => void;
  handleSearchChange: (value: string) => void;
  handleRowsPerPageChange: (rows: number) => void;
  goToPage: (page: number) => void;
}

export function useTableState<T extends object>(
  data: T[] | null,
  filterFn: (item: T, query: string) => boolean,
  options: UseTableStateOptions<T>
): UseTableStateReturn<T> {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: options.defaultSortKey,
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(options.defaultRowsPerPage ?? 25);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();
    return data.filter((item) => filterFn(item, query));
  }, [data, searchQuery, filterFn]);

  const sortedData = useMemo(() => {
    if (filteredData.length === 0) return [];

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, sortedData.length);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (key: SortableKey<T>) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  return {
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
  };
}
