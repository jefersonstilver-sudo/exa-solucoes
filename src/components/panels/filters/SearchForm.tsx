
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchFormProps {
  onSearch: (location: string) => void;
  loading: boolean;
  defaultValue?: string;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, loading, defaultValue = '' }) => {
  const [searchInput, setSearchInput] = useState(defaultValue);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput);
    }
  };
  
  return (
    <form onSubmit={handleSearch} className="mb-6">
      <div className="relative">
        <Input
          placeholder="Digite endereço ou bairro..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pr-10 border-[#7C3AED] focus-visible:ring-[#00F894]"
          disabled={loading}
        />
        <Button 
          type="submit" 
          size="sm" 
          className="absolute right-1 top-1 h-7 w-7 p-0 bg-[#7C3AED] hover:bg-[#00F894] transition-all" 
          disabled={!searchInput.trim() || loading}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="sr-only">Buscar</span>
        </Button>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Ex: Avenida Paraná, Vila A, Rua Jorge Sanwais 1500
      </div>
    </form>
  );
};

export default SearchForm;
