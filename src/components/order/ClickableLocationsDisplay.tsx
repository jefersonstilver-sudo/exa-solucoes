
import React, { useState } from 'react';
import { MapPin, Eye, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBuildingNames } from '@/hooks/useBuildingNames';

interface ClickableLocationsDisplayProps {
  listaPaineis: string[];
  listaPredios?: string[];
  className?: string;
  orderDetails?: any;
}

export const ClickableLocationsDisplay: React.FC<ClickableLocationsDisplayProps> = ({
  listaPaineis,
  listaPredios,
  className = "",
  orderDetails
}) => {
  const { buildingNames, loading, error } = useBuildingNames(listaPaineis, listaPredios);
  const [isOpen, setIsOpen] = useState(false);

  console.log('🏢 [CLICKABLE_LOCATIONS] Dados recebidos:', {
    listaPaineis,
    listaPredios,
    buildingNames,
    loading,
    error,
    orderDetails: orderDetails ? {
      id: orderDetails.id,
      log_pagamento: orderDetails.log_pagamento
    } : null
  });

  // Enhanced fallback para pedidos antigos
  const getFallbackLocationInfo = () => {
    if (!orderDetails?.log_pagamento) return null;
    
    const logData = orderDetails.log_pagamento;
    
    // Check for panel IDs in different log structures
    const panelIds = logData.panel_ids_saved || 
                    logData.cart_items_debug?.map((item: any) => item.panel_id) ||
                    [];
    
    const panelNames = logData.cart_items_debug?.map((item: any) => 
      item.panel_name || 'Local não identificado'
    ) || [];
    
    console.log('🔄 [CLICKABLE_LOCATIONS] Fallback data:', { panelIds, panelNames });
    
    return { panelIds, panelNames };
  };

  const fallbackData = getFallbackLocationInfo();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <MapPin className="h-4 w-4 text-gray-400 animate-pulse" />
        <span className="text-gray-500">Carregando locais...</span>
      </div>
    );
  }

  // Melhor tratamento de erros com priorização de lista_predios
  if (error || (buildingNames.length === 0 && !fallbackData?.panelNames?.length)) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <span className="text-orange-600 font-medium">Locais não carregados</span>
        </div>
        
        {listaPredios && listaPredios.length === 0 && listaPaineis.length === 0 ? (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Este pedido foi criado sem informações de locais. 
              Entre em contato com o suporte para correção.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Erro ao carregar informações dos locais.
              {listaPredios && listaPredios.length > 0 && (
                <div className="mt-1">
                  IDs dos prédios: {listaPredios.join(', ')}
                </div>
              )}
              {listaPaineis.length > 0 && (
                <div className="mt-1">
                  IDs dos painéis: {listaPaineis.join(', ')}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Use building names from hook or fallback data
  const displayNames = buildingNames.length > 0 ? buildingNames : fallbackData?.panelNames || [];
  const firstLocation = displayNames[0];
  const totalLocations = displayNames.length;

  if (totalLocations === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <span className="text-orange-600">Nenhum local encontrado</span>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center space-x-2 h-auto p-2 hover:bg-gray-50 max-w-full ${className}`}
        >
          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <div className="text-left min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">
              {totalLocations === 1 ? firstLocation : `${firstLocation} + ${totalLocations - 1} mais`}
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              Clique para ver todos
            </div>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-500" />
            Locais Contratados ({totalLocations})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {displayNames.map((nome, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              <span className="font-medium text-gray-900 break-words min-w-0">{nome}</span>
            </div>
          ))}
        </div>
        
        <div className="text-sm text-gray-600 mt-4 p-3 bg-blue-50 rounded-lg">
          <strong>Total:</strong> {totalLocations} {totalLocations === 1 ? 'local selecionado' : 'locais selecionados'} para exibição do seu conteúdo.
        </div>

        {/* DEBUG INFO for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 rounded">
            <strong>Debug:</strong>
            {listaPredios && listaPredios.length > 0 && (
              <div>Prédios: {listaPredios.join(', ')}</div>
            )}
            <div>Painéis: {listaPaineis.join(', ')}</div>
            {fallbackData && (
              <div>Fallback: {fallbackData.panelIds.join(', ')}</div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
