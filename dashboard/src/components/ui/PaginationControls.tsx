import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

const PAGE_BUTTON_CLASS =
  'border-border hover:bg-muted/50 rounded border px-3 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  rowsPerPageOptions: number[];
  startIndex: number;
  endIndex: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export const PaginationControls = ({
  currentPage,
  totalPages,
  rowsPerPage,
  rowsPerPageOptions,
  startIndex,
  endIndex,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}: PaginationControlsProps) => (
  <div className="border-border flex flex-col items-center justify-between gap-4 border-t px-6 py-4 sm:flex-row">
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">Rows per page:</span>
      <select
        value={rowsPerPage}
        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        className="border-border bg-card text-foreground focus:ring-primary rounded border px-2 py-0.5 text-xs focus:ring-2 focus:outline-none"
      >
        {rowsPerPageOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>

    <span className="text-muted-foreground text-xs">
      {startIndex + 1}-{endIndex} of {totalRows}
    </span>

    <div className="flex gap-2">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={PAGE_BUTTON_CLASS}
        aria-label="First page"
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={PAGE_BUTTON_CLASS}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={PAGE_BUTTON_CLASS}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={PAGE_BUTTON_CLASS}
        aria-label="Last page"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  </div>
);
