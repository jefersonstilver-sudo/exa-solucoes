import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, User, Building2, Mail, Phone, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAutocompleteHistory, AutocompleteEntry } from '@/hooks/useAutocompleteHistory';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (entry: AutocompleteEntry) => void;
  fieldType: 'client_name' | 'company_name' | 'cnpj' | 'email' | 'phone';
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

const fieldIcons = {
  client_name: User,
  company_name: Building2,
  cnpj: FileText,
  email: Mail,
  phone: Phone
};

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  fieldType,
  placeholder,
  className,
  disabled,
  id
}) => {
  const [suggestions, setSuggestions] = useState<AutocompleteEntry[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const { getSuggestions, removeFromHistory, loading } = useAutocompleteHistory();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const Icon = fieldIcons[fieldType];

  // Buscar sugestões com debounce
  const fetchSuggestions = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
    
    const results = await getSuggestions(fieldType, searchTerm);
    setSuggestions(results);
    setShowDropdown(results.length > 0);
  }, [fieldType, getSuggestions]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (entry: AutocompleteEntry) => {
    onChange(entry.field_value);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    onSelectSuggestion?.(entry);
  };

  const handleRemove = async (e: React.MouseEvent, entry: AutocompleteEntry) => {
    e.stopPropagation();
    await removeFromHistory(entry.id);
    setSuggestions(prev => prev.filter(s => s.id !== entry.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const highlightMatch = (text: string, search: string) => {
    if (!search) return text;
    const index = text.toLowerCase().indexOf(search.toLowerCase());
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <span className="font-semibold text-primary">{text.slice(index, index + search.length)}</span>
        {text.slice(index + search.length)}
      </>
    );
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl rounded-xl border border-border/50 shadow-lg overflow-hidden"
        >
          <div className="py-1">
            {suggestions.map((entry, index) => (
              <div
                key={entry.id}
                onClick={() => handleSelect(entry)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors",
                  highlightedIndex === index 
                    ? "bg-primary/10" 
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">
                      {highlightMatch(entry.field_value, value)}
                    </p>
                    {entry.display_label && entry.display_label !== entry.field_value && (
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.display_label}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleRemove(e, entry)}
                  className="flex-shrink-0 p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Remover do histórico"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-border/30 bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center">
              Sugestões baseadas no seu histórico
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
