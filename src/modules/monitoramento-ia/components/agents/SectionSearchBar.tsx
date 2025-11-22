import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SectionSearchBarProps {
  onSearch: (query: string) => void;
  totalResults?: number;
}

export const SectionSearchBar = ({ onSearch, totalResults }: SectionSearchBarProps) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const debounce = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, onSearch]);

  return (
    <div className="mb-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar no conteúdo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-9 text-sm bg-background/50 border-border/50 focus:border-primary/50"
        />
        {query && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
            {totalResults !== undefined && (
              <span className="absolute -right-20 top-1/2 -translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap">
                {totalResults} {totalResults === 1 ? 'resultado' : 'resultados'}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
