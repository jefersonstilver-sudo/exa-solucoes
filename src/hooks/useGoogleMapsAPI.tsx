
import { useCallback } from 'react';
import { useToast } from './use-toast';

// API key from configuration
const GOOGLE_MAPS_API_KEY = 'AIzaSyAVQPvo8asVwVVuWBxReck6ohF9vvDR_qM';

/**
 * Initialize Google Maps API safely with improved error handling
 */
export const initializeGoogleMapsAPI = () => {
  return new Promise<void>((resolve, reject) => {
    // If API already loaded, resolve immediately
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      resolve();
      return;
    }

    // Set up callback for when API loads
    window.initMap = () => {
      console.log('Google Maps API loaded successfully');
      resolve();
    };

    // Error handler for domain restrictions
    window.gm_authFailure = () => {
      const error = new Error(
        'Google Maps authentication failed. This may be due to an invalid API key or domain restrictions. ' +
        'Please ensure that your current domain is whitelisted in the Google Cloud Console.'
      );
      console.error(error);
      
      // Create a visible error message on the page
      const mapContainers = document.querySelectorAll('[data-map-id]');
      mapContainers.forEach(container => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 p-4 rounded-lg text-center';
        errorDiv.innerHTML = `
          <p class="text-red-600 font-medium">Erro de autenticação do Google Maps</p>
          <p class="text-sm text-gray-600 mt-1">Domínio não autorizado. Por favor, verifique as configurações da API no Google Cloud Console.</p>
        `;
        
        // Clear container and append error
        container.innerHTML = '';
        container.appendChild(errorDiv);
      });
      
      reject(error);
    };

    // Check if script already exists
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      console.log('Google Maps script is already loading');
      return; // Script is loading, wait for callback
    }

    try {
      // Validate API key format before attempting to load
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 20) {
        throw new Error('Invalid Google Maps API key format. Please check your configuration.');
      }
      
      console.log('Loading Google Maps API script');
      
      // Create and add script element
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Set proper timeout for script loading
      const timeoutId = setTimeout(() => {
        if (!window.google || !window.google.maps) {
          reject(new Error('Google Maps API failed to load within timeout period'));
          
          // Try to remove the script if it failed
          try {
            const scriptElement = document.getElementById('google-maps-script');
            if (scriptElement && scriptElement.parentNode) {
              scriptElement.parentNode.removeChild(scriptElement);
            }
          } catch (e) {
            console.error('Failed to remove script element:', e);
          }
        }
      }, 10000); // 10-second timeout
      
      script.onload = () => {
        clearTimeout(timeoutId);
      };
      
      script.onerror = (e) => {
        clearTimeout(timeoutId);
        console.error('Failed to load Google Maps API:', e);
        reject(new Error('Failed to load Google Maps API. Check network connection and API key.'));
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      reject(error);
    }
  });
};

/**
 * Hook for initializing Google Maps API with toast notifications
 */
export const useGoogleMapsAPI = () => {
  const { toast } = useToast();
  
  /**
   * Initialize Google Maps API safely with toast notifications
   */
  const initializeGoogleMaps = useCallback(() => {
    return initializeGoogleMapsAPI().catch(error => {
      // Show user-friendly error toast
      toast({
        variant: "destructive",
        title: "Erro ao carregar mapa",
        description: "Não foi possível inicializar o Google Maps. Verifique sua conexão ou contate o suporte."
      });
      
      throw error; // Re-throw to propagate to caller
    });
  }, [toast]);

  return { initializeGoogleMapsAPI: initializeGoogleMaps };
};
