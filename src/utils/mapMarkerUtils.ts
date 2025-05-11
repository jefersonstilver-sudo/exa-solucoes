
import { Panel } from '@/types/panel';

/**
 * Creates a marker icon configuration for panels based on their status
 */
export const createPanelMarkerIcon = (status: string): google.maps.Symbol => {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: status === 'online' ? '#10B981' : '#F59E0B',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: '#ffffff',
  };
};

/**
 * Creates a marker icon configuration for selected locations
 */
export const createSelectedLocationIcon = (): google.maps.Symbol => {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 12,
    fillColor: '#7C3AED', // purple
    fillOpacity: 0.7,
    strokeWeight: 2,
    strokeColor: '#ffffff',
  };
};

/**
 * Creates HTML content for a panel info window
 */
export const createPanelInfoWindowContent = (panel: Panel, instanceId: string): string => {
  return `
    <div class="p-2 min-w-[220px]">
      <h4 class="font-semibold text-sm">${panel.buildings?.nome || 'Painel'}</h4>
      <p class="text-xs text-gray-500 mb-2">
        ${panel.buildings?.endereco || ''}, ${panel.buildings?.bairro || ''}
      </p>
      <p class="text-xs mb-1">Status: <span class="font-semibold ${
        panel.status === 'online' ? 'text-green-600' : 'text-amber-600'
      }">${panel.status === 'online' ? 'Ativo' : 'Instalando'}</span></p>
      <div class="flex justify-between text-xs text-gray-500">
        <span>${panel.resolucao || '1080p'}</span>
        <span>Visualizações: 1.2k/mês</span>
      </div>
      <button id="add-to-cart-${panel.id}-${instanceId}" class="mt-2 text-xs bg-[#7C3AED] hover:bg-[#00F894] text-white px-2 py-1 rounded w-full transition-all hover:scale-105 duration-200">
        Adicionar ao Carrinho
      </button>
    </div>
  `;
};

/**
 * Safely tries to clear Google Maps event listeners
 */
export const clearMapEventListeners = (element: any): void => {
  if (window.google && window.google.maps && google.maps.event && element) {
    try {
      google.maps.event.clearInstanceListeners(element);
    } catch (error) {
      console.error('Error clearing event listeners:', error);
    }
  }
};
