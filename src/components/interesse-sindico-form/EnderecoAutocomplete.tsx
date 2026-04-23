import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { loadGoogleMaps } from '@/utils/googleMapsLoader';

export interface ParsedAddress {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string;
  formattedAddress: string;
}

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface Props {
  onSelect: (parsed: ParsedAddress) => void;
  initialValue?: string;
}

function findComponent(comps: google.maps.GeocoderAddressComponent[], type: string): string {
  return comps.find((c) => c.types.includes(type))?.long_name || '';
}
function findComponentShort(comps: google.maps.GeocoderAddressComponent[], type: string): string {
  return comps.find((c) => c.types.includes(type))?.short_name || '';
}

function parseAddressComponents(place: google.maps.places.PlaceResult): ParsedAddress {
  const comps = place.address_components || [];
  const bairro =
    findComponent(comps, 'sublocality_level_1') ||
    findComponent(comps, 'sublocality') ||
    findComponent(comps, 'neighborhood');
  const cidade =
    findComponent(comps, 'administrative_area_level_2') ||
    findComponent(comps, 'locality');
  return {
    logradouro: findComponent(comps, 'route'),
    numero: findComponent(comps, 'street_number'),
    bairro,
    cidade,
    uf: findComponentShort(comps, 'administrative_area_level_1'),
    cep: findComponent(comps, 'postal_code').replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
    latitude: place.geometry?.location?.lat() ?? null,
    longitude: place.geometry?.location?.lng() ?? null,
    googlePlaceId: place.place_id || '',
    formattedAddress: place.formatted_address || '',
  };
}

export const EnderecoAutocomplete: React.FC<Props> = ({ onSelect, initialValue = '' }) => {
  const [input, setInput] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const autoRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        autoRef.current = new google.maps.places.AutocompleteService();
        const dummy = new google.maps.Map(document.createElement('div'));
        placesRef.current = new google.maps.places.PlacesService(dummy);
      })
      .catch((e) => console.error('[EnderecoAutocomplete] falha ao carregar Google Maps:', e));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = (q: string) => {
    if (!autoRef.current || !q.trim() || q.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    autoRef.current.getPlacePredictions(
      {
        input: q.trim(),
        componentRestrictions: { country: 'br' },
        types: ['address'],
        locationBias: {
          center: { lat: -25.5478, lng: -54.5882 },
          radius: 50000,
        } as google.maps.places.LocationBias,
      },
      (preds, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && preds) {
          setSuggestions(
            preds.map((p) => ({
              placeId: p.place_id,
              mainText: p.structured_formatting.main_text,
              secondaryText: p.structured_formatting.secondary_text || '',
            })),
          );
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      },
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  };

  const handlePick = (s: Suggestion) => {
    if (!placesRef.current) return;
    setIsOpen(false);
    placesRef.current.getDetails(
      {
        placeId: s.placeId,
        fields: ['address_components', 'geometry', 'place_id', 'formatted_address'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const parsed = parseAddressComponents(place);
          setInput(parsed.formattedAddress || `${s.mainText}, ${s.secondaryText}`);
          onSelect(parsed);
        }
      },
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="sif-label" htmlFor="endereco-autocomplete">
        Endereço do prédio
      </label>
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
        />
        <input
          id="endereco-autocomplete"
          type="text"
          value={input}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Comece a digitar a rua e o número..."
          className="sif-input pl-10"
          autoComplete="off"
          aria-label="Buscar endereço do prédio"
        />
        {isLoading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 animate-spin" />
        )}
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul className="sif-autocomplete-list" role="listbox">
          {suggestions.map((s) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected={false}
              className="sif-autocomplete-item"
              onClick={() => handlePick(s)}
            >
              <MapPin size={18} className="text-[var(--exa-red,#c7141a)] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{s.mainText}</div>
                <div className="text-xs text-white/55 truncate">{s.secondaryText}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="sif-help">Selecione a sugestão para preencher os campos automaticamente.</p>
    </div>
  );
};

export default EnderecoAutocomplete;
