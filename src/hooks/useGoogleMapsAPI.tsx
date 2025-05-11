
import { useCallback } from 'react';
import { useToast } from './use-toast';

// 🔐 API key do Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyAVQPvo8asVwVVuWBxReck6ohF9vvDR_qM';

// Variável de controle para rastrear o estado de carregamento do script
let isLoadingScript = false;
let isScriptLoaded = false;

/**
 * Inicializa a API do Google Maps com tratamento de erro seguro e gerenciamento idempotente do script
 */
export const initializeGoogleMapsAPI = () => {
  return new Promise<void>((resolve, reject) => {
    // Early resolve if API is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      isScriptLoaded = true;
      resolve();
      return;
    }
    
    // Se já estamos carregando o script, não tente novamente
    if (isLoadingScript) {
      console.log('Google Maps script is already loading');
      // Adicionar um ouvinte para resolver quando o carregamento atual terminar
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      
      // Timeout para não ficar verificando indefinidamente
      setTimeout(() => {
        clearInterval(checkLoaded);
        reject(new Error('Timeout waiting for existing script load'));
      }, 10000);
      
      return;
    }

    // Definir manipuladores de inicialização apenas uma vez
    if (!window.initMap) {
      window.initMap = () => {
        console.log('Google Maps API loaded successfully');
        isLoadingScript = false;
        isScriptLoaded = true;
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
        isLoadingScript = false;

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

    try {
      // Validar a chave da API
      if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 20) {
        throw new Error('Invalid Google Maps API key format. Please check your configuration.');
      }

      console.log('Loading Google Maps API script');
      isLoadingScript = true;

      // Verificar se o script já existe no DOM
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        console.log('Script já existente, aguardando carregamento');
        return; // O callback initMap vai lidar com a resolução
      }

      // Criar o elemento script
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;

      // Definir timeout seguro
      const timeoutId = window.setTimeout(() => {
        if (!window.google || !window.google.maps) {
          console.error('Google Maps API failed to load within timeout period');
          isLoadingScript = false;
          
          // Verificação segura para remoção do script
          const scriptElement = document.getElementById('google-maps-script');
          if (scriptElement && scriptElement.parentNode) {
            try {
              scriptElement.parentNode.removeChild(scriptElement);
            } catch (e) {
              console.error('Failed to remove script element:', e);
            }
          }
          
          reject(new Error('Google Maps API failed to load within timeout period'));
        }
      }, 10000);

      // Limpar timeout ao carregar
      script.onload = () => {
        window.clearTimeout(timeoutId);
      };

      // Tratar erro de carregamento do script
      script.onerror = (e) => {
        window.clearTimeout(timeoutId);
        isLoadingScript = false;
        console.error('Failed to load Google Maps API:', e);
        
        // Tentar remover o script com segurança
        try {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        } catch (removeError) {
          console.error('Error removing failed script:', removeError);
        }
        
        reject(new Error('Failed to load Google Maps API. Check network connection and API key.'));
      };

      // Adicionar o script ao documento
      document.head.appendChild(script);
    } catch (error) {
      isLoadingScript = false;
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
