// Utility to load Google Maps JS API once and provide a Promise-based loader
// SECURITY NOTE: Google Maps API keys can be safely exposed in frontend when properly configured
// with domain restrictions in the Google Cloud Console. This key should be restricted to your domains.
const GOOGLE_MAPS_API_KEY = 'AIzaSyA2dsrmO1bZLL27oiNbKr3Xh9DU8zUva9Y';

let googleMapsPromise: Promise<typeof google.maps> | null = null;

function injectScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If script already exists, resolve on load
    const existing = Array.from(document.getElementsByTagName('script')).find((s) =>
      s.src && s.src.includes('https://maps.googleapis.com/maps/api/js')
    );

    if (existing) {
      if ((window as any).google?.maps) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if ((window as any).google?.maps) {
    return Promise.resolve((window as any).google.maps);
  }

  if (!googleMapsPromise) {
    googleMapsPromise = injectScript().then(() => (window as any).google.maps);
  }

  return googleMapsPromise;
}

export default loadGoogleMaps;
