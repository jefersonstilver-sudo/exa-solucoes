
import { useCallback } from 'react';
import { useToast } from './use-toast';

// 🔐 API key do Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyAVQPvo8asVwVVuWBxReck6ohF9vvDR_qM';

/**
 * Inicializa a API do Google Maps com tratamento de erro seguro e gerenciamento idempotente do script
 */
export const initializeGoogleMapsAPI = () => {
  return new Promise<void>((resolve, reject) => {
    // Early resolve if API is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      resolve();
      return;
    }

    // Check if initialization handlers are already set
    if (!window.initMap) {
      window.initMap = () => {
        console.log('Google Maps API loaded successfully');
        resolve();
      };
    }

    if (!window.gm_authFailure) {
      window.gm_authFailure = () => {
        const error = new Error(
          'Google Maps authentication failed. This may be due to an invalid API key or domain restrictions. ' +
          'Please ensure that your current domain is whitelisted in the Google Cloud Console.'
        );
        console.error(error);

        const mapContainers = document.querySelectorAll('[data-map-id]');
        mapContainers.forEach(container => {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'bg-red-50 p-4 rounded-lg text-center';
          errorDiv.innerHTML = `
            <p class="text-red-600 font-medium">Erro de autenticação do Google Maps</p>
            <p class="text-sm text-gray-600 mt-1">Domínio não autorizado. Por favor, verifique as configurações da API no Google Cloud Console.</p>
          `;
          container.innerHTML = '';
          container.appendChild(errorDiv);
        });

        reject(error);
      };
    }

    // Check if script is already in the DOM
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      console.log('Google Maps script is already loading');
      return; // Let the existing script's callbacks handle resolution
    }

    try {
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 20) {
        throw new Error('Invalid Google Maps API key format. Please check your configuration.');
      }

      console.log('Loading Google Maps API script');

      // Create script element
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;

      // Handle timeout safely
      let timeoutId: number | null = window.setTimeout(() => {
        timeoutId = null;
        if (!window.google || !window.google.maps) {
          console.error('Google Maps API failed to load within timeout period');
          
          // Safely remove the script element
          const scriptElement = document.getElementById('google-maps-script');
          if (scriptElement && scriptElement.parentNode) {
            try {
              scriptElement.parentNode.removeChild(scriptElement);
            } catch (e) {
              console.error('Failed to remove script element:', e);
              // Just continue - don't reject here as we might have race conditions
            }
          }
          
          // Reject if promise hasn't been resolved/rejected yet
          reject(new Error('Google Maps API failed to load within timeout period'));
        }
      }, 10000);

      // Clear timeout on load
      script.onload = () => {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      // Handle script load error
      script.onerror = (e) => {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
        console.error('Failed to load Google Maps API:', e);
        reject(new Error('Failed to load Google Maps API. Check network connection and API key.'));
      };

      // Append script to document head
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      reject(error);
    }
  });
};

/**
 * Hook para inicializar Google Maps com notificação de erro
 */
export const useGoogleMapsAPI = () => {
  const { toast } = useToast();

  const initializeGoogleMaps = useCallback(() => {
    return initializeGoogleMapsAPI().catch(error => {
      toast({
        variant: "destructive",
        title: "Erro ao carregar mapa",
        description: "Não foi possível inicializar o Google Maps. Verifique sua conexão ou contate o suporte."
      });
      throw error;
    });
  }, [toast]);

  return { initializeGoogleMapsAPI: initializeGoogleMaps };
};
