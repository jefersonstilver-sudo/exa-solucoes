
/**
 * Geocoding service for converting addresses to coordinates
 */

/**
 * Get coordinates from a location query string using OpenStreetMap Nominatim API
 * @param query The address or location to search for
 * @returns Promise with lat/lng coordinates or null if not found
 */
export async function getLocationCoordinates(query: string): Promise<{lat: number, lng: number} | null> {
  try {
    // URL encode the query
    const encodedQuery = encodeURIComponent(query);
    
    // Use OpenStreetMap's Nominatim API for geocoding
    // Add "São Paulo" to the query to focus search in Brazil
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}+São+Paulo&format=json&limit=1&addressdetails=1`,
      {
        headers: {
          // Add a user agent as requested by Nominatim usage policy
          'User-Agent': 'IndexaDigitalWebApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }

    const data = await response.json();
    
    // Check if we have results
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching location coordinates:', error);
    return null;
  }
}
