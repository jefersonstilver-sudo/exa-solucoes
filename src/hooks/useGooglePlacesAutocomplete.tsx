import { useState, useEffect, useCallback, useRef } from 'react';
import { loadGoogleMaps } from '@/utils/googleMapsLoader';

export interface PlaceResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface UseGooglePlacesAutocompleteOptions {
  debounceMs?: number;
  componentRestrictions?: { country: string };
  types?: string[];
  bounds?: google.maps.LatLngBounds;
}

export function useGooglePlacesAutocomplete(options: UseGooglePlacesAutocompleteOptions = {}) {
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  const {
    debounceMs = 300,
    componentRestrictions = { country: 'br' },
    types = ['address'],
  } = options;

  // Initialize Google Maps API
  useEffect(() => {
    loadGoogleMaps().then(() => {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      
      // Create a dummy div for PlacesService
      const dummyMap = new google.maps.Map(document.createElement('div'));
      placesService.current = new google.maps.places.PlacesService(dummyMap);
      
      setIsApiLoaded(true);
    }).catch((error) => {
      console.error('Failed to load Google Maps API:', error);
    });
  }, []);

  const searchPlaces = useCallback((input: string) => {
    if (!autocompleteService.current || !input.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    const request: google.maps.places.AutocompletionRequest = {
      input: input.trim(),
      componentRestrictions,
      types,
      // Bias results towards Foz do Iguaçu
      location: new google.maps.LatLng(-25.5478, -54.5882),
      radius: 50000, // 50km radius
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      setIsLoading(false);

      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        const formattedSuggestions: PlaceResult[] = predictions.map((prediction) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text || '',
          types: prediction.types,
        }));

        setSuggestions(formattedSuggestions);
      } else {
        setSuggestions([]);
      }
    });
  }, [componentRestrictions, types]);

  const debouncedSearch = useCallback((input: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      searchPlaces(input);
    }, debounceMs);
  }, [searchPlaces, debounceMs]);

  const getPlaceDetails = useCallback((placeId: string): Promise<google.maps.places.PlaceResult | null> => {
    return new Promise((resolve) => {
      if (!placesService.current) {
        resolve(null);
        return;
      }

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['formatted_address', 'geometry', 'name', 'types'],
      };

      placesService.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          resolve(null);
        }
      });
    });
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    isApiLoaded,
    searchPlaces: debouncedSearch,
    getPlaceDetails,
    clearSuggestions,
  };
}