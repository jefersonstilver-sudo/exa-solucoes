import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, X, Loader2, Home, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGooglePlacesAutocomplete, PlaceResult } from '@/hooks/useGooglePlacesAutocomplete';
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: { 
    address: string; 
    coordinates: { lat: number; lng: number }; 
    placeId: string;
    neighborhood?: string;
  }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onClear?: () => void;
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Digite o endereço...",
  className,
  disabled = false,
  onClear,
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { trackSearch } = useBehaviorTracking();

  const {
    suggestions,
    isLoading,
    isApiLoaded,
    searchPlaces,
    getPlaceDetails,
    clearSuggestions,
  } = useGooglePlacesAutocomplete();

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue.trim()) {
      searchPlaces(newValue);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      clearSuggestions();
      setIsOpen(false);
    }
  };

  // Handle place selection
  const handlePlaceSelect = async (place: PlaceResult) => {
    if (!onPlaceSelect) {
      onChange(place.description);
      setIsOpen(false);
      clearSuggestions();
      return;
    }

    const placeDetails = await getPlaceDetails(place.placeId);
    
    if (placeDetails?.geometry?.location) {
      const coordinates = {
        lat: placeDetails.geometry.location.lat(),
        lng: placeDetails.geometry.location.lng(),
      };

      // Track address selection from autocomplete
      trackSearch(placeDetails.formatted_address || place.description, {
        source: 'address_autocomplete',
        coordinates,
        placeId: place.placeId,
        types: place.types
      });

      onPlaceSelect({
        address: placeDetails.formatted_address || place.description,
        coordinates,
        placeId: place.placeId,
      });

      onChange(placeDetails.formatted_address || place.description);
    } else {
      // Track even without coordinates
      trackSearch(place.description, {
        source: 'address_autocomplete',
        placeId: place.placeId,
        types: place.types
      });
      
      onChange(place.description);
    }

    setIsOpen(false);
    clearSuggestions();
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handlePlaceSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle clear
  const handleClear = () => {
    onChange('');
    clearSuggestions();
    setIsOpen(false);
    setSelectedIndex(-1);
    onClear?.();
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        listRef.current &&
        !listRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for place type
  const getPlaceIcon = (types: string[]) => {
    if (types.includes('establishment') || types.includes('point_of_interest')) {
      return <Building className="w-4 h-4 text-muted-foreground" />;
    }
    return <Home className="w-4 h-4 text-muted-foreground" />;
  };

  const showDropdown = isOpen && (suggestions.length > 0 || isLoading);

  return (
    <div className="relative w-full" style={{ zIndex: isOpen ? 9999 : 'auto' }}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={!isApiLoaded ? "Carregando Google Maps..." : placeholder}
          disabled={disabled || !isApiLoaded}
          className={cn("pl-10 pr-20", className)}
          autoComplete="off"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          )}
          
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 w-7 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white dark:bg-gray-800 border border-border rounded-md shadow-lg">
          <ul
            ref={listRef}
            className="max-h-[400px] overflow-auto py-1"
            role="listbox"
          >
            {isLoading && suggestions.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando endereços...
              </li>
            )}

            {suggestions.map((place, index) => (
              <li
                key={place.placeId}
                className={cn(
                  "px-4 py-3 cursor-pointer text-sm border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors min-h-[60px]",
                  selectedIndex === index && "bg-muted"
                )}
                onClick={() => handlePlaceSelect(place)}
                role="option"
                aria-selected={selectedIndex === index}
              >
                <div className="flex items-start gap-3">
                  {getPlaceIcon(place.types)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">
                      {place.mainText}
                    </div>
                    {place.secondaryText && (
                      <div className="text-muted-foreground text-xs mt-1">
                        {place.secondaryText}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}

            {!isLoading && suggestions.length === 0 && value.trim() && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum endereço encontrado
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}