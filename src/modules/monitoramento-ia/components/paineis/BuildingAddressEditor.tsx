import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import loadGoogleMaps from '@/utils/googleMapsLoader';

interface BuildingAddressEditorProps {
  buildingId: string;
  currentAddress: string | null;
  onSave: (newAddress: string, lat: number, lng: number) => void;
  onCancel: () => void;
}

export const BuildingAddressEditor: React.FC<BuildingAddressEditorProps> = ({
  buildingId,
  currentAddress,
  onSave,
  onCancel,
}) => {
  const [address, setAddress] = useState(currentAddress || '');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Google Places services
  useEffect(() => {
    const initServices = async () => {
      try {
        await loadGoogleMaps();
        const { AutocompleteService, PlacesService } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
        
        setAutocompleteService(new AutocompleteService());
        
        // PlacesService needs a map or div element
        const dummyDiv = document.createElement('div');
        setPlacesService(new PlacesService(dummyDiv));
      } catch (error) {
        console.error('[BuildingAddressEditor] Error initializing Places:', error);
      }
    };
    
    initServices();
  }, []);

  // Handle input change with debounce
  useEffect(() => {
    if (!autocompleteService || address.length < 3) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      autocompleteService.getPlacePredictions(
        {
          input: address,
          componentRestrictions: { country: 'br' },
          types: ['address'],
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [address, autocompleteService]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService) return;

    setLoading(true);
    setShowSuggestions(false);
    setAddress(prediction.description);

    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address'],
      },
      async (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const formattedAddress = place.formatted_address || prediction.description;

          try {
            // Update building in database
            const { error } = await supabase
              .from('buildings')
              .update({
                endereco: formattedAddress,
                manual_latitude: lat,
                manual_longitude: lng,
              })
              .eq('id', buildingId);

            if (error) throw error;

            toast.success('Localização atualizada com sucesso!');
            onSave(formattedAddress, lat, lng);
          } catch (err) {
            console.error('[BuildingAddressEditor] Error updating:', err);
            toast.error('Erro ao salvar localização');
          } finally {
            setLoading(false);
          }
        } else {
          toast.error('Não foi possível obter coordenadas');
          setLoading(false);
        }
      }
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Digite o endereço..."
            className="pl-8 pr-8 h-9 text-sm bg-background/50 backdrop-blur-sm"
            disabled={loading}
          />
          {loading && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors flex items-start gap-2 border-b border-border/50 last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {suggestion.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {suggestion.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuildingAddressEditor;
