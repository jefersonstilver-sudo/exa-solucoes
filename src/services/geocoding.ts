
/**
 * Geocoding service for converting addresses to coordinates
 */

/**
 * Enhanced geocoding with multiple strategies and Google fallback
 * @param query The address or location to search for
 * @returns Promise with lat/lng coordinates and precision info
 */
export async function getLocationCoordinates(query: string): Promise<{lat: number, lng: number, precise?: boolean, address?: string} | null> {
  console.log('🔍 [GEOCODING] Iniciando busca para:', query);

  // Try multiple query formats for better precision
  const queryVariations = [
    `${query}, Foz do Iguaçu, PR, Brazil`,
    `${query}, Foz do Iguaçu, Paraná, Brazil`,
    `${query}, Foz do Iguaçu`,
    query
  ];

  for (const [index, searchQuery] of queryVariations.entries()) {
    console.log(`🔍 [GEOCODING] Tentativa ${index + 1}:`, searchQuery);
    
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=3&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': 'IndexaDigitalWebApp/1.0'
          }
        }
      );

      if (!response.ok) {
        console.warn(`🔍 [GEOCODING] Resposta não ok para tentativa ${index + 1}`);
        continue;
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        // Filter results to prioritize those in Foz do Iguaçu
        const fozResults = data.filter((result: any) => {
          const displayName = result.display_name?.toLowerCase() || '';
          return displayName.includes('foz do iguaçu') || displayName.includes('foz');
        });

        const bestResult = fozResults.length > 0 ? fozResults[0] : data[0];
        
        // Determine precision based on result type and class
        const resultType = bestResult.type || '';
        const resultClass = bestResult.class || '';
        const importance = parseFloat(bestResult.importance || '0');
        
        const isPrecise = (
          resultType === 'house' ||
          resultClass === 'building' ||
          resultClass === 'place' ||
          importance > 0.3
        );

        const coordinates = {
          lat: parseFloat(bestResult.lat),
          lng: parseFloat(bestResult.lon),
          precise: isPrecise,
          address: bestResult.display_name
        };

        console.log(`✅ [GEOCODING] Sucesso na tentativa ${index + 1}:`, {
          coordinates: `${coordinates.lat}, ${coordinates.lng}`,
          precise: coordinates.precise,
          type: resultType,
          class: resultClass,
          importance,
          address: coordinates.address
        });

        return coordinates;
      }
    } catch (error) {
      console.error(`❌ [GEOCODING] Erro na tentativa ${index + 1}:`, error);
      continue;
    }
  }

  console.warn('❌ [GEOCODING] Todas as tentativas falharam');
  return null;
}

/**
 * Fallback to Google Geocoding if available
 */
export async function getGoogleCoordinates(query: string): Promise<{lat: number, lng: number, precise?: boolean, address?: string} | null> {
  if (typeof window === 'undefined' || !(window as any).google?.maps?.Geocoder) {
    return null;
  }

  return new Promise((resolve) => {
    const geocoder = new (window as any).google.maps.Geocoder();
    
    geocoder.geocode({ address: `${query}, Foz do Iguaçu, PR` }, (results: any[], status: string) => {
      console.log('🔍 [GOOGLE GEOCODING] Status:', status);
      
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        const location = result.geometry.location;
        const locationType = result.geometry.location_type;
        const types = result.types || [];
        
        const isPrecise = (
          locationType === 'ROOFTOP' ||
          types.includes('street_address') ||
          types.includes('premise')
        );

        const coordinates = {
          lat: location.lat(),
          lng: location.lng(),
          precise: isPrecise,
          address: result.formatted_address
        };

        console.log('✅ [GOOGLE GEOCODING] Sucesso:', coordinates);
        resolve(coordinates);
      } else {
        console.warn('❌ [GOOGLE GEOCODING] Falhou:', status);
        resolve(null);
      }
    });
  });
}
