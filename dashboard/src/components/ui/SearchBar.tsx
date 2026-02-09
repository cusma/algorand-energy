import { Search, X } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchBar = ({
  query,
  onChange,
  placeholder = 'Search...',
  disabled,
}: SearchBarProps) => (
  <div className="border-border border-b px-6 py-4">
    <div className="relative">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        size={16}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-primary w-full rounded border py-2 pr-9 pl-9 text-xs focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        readOnly={disabled}
      />
      {query && !disabled && (
        <button
          onClick={() => onChange('')}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  </div>
);
