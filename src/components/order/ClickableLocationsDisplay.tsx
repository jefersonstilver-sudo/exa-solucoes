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
  const {
    buildingNames,
    loading,
    error
  } = useBuildingNames(listaPaineis, listaPredios);
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
    const panelIds = logData.panel_ids_saved || logData.cart_items_debug?.map((item: any) => item.panel_id) || [];
    const panelNames = logData.cart_items_debug?.map((item: any) => item.panel_name || 'Local não identificado') || [];
    console.log('🔄 [CLICKABLE_LOCATIONS] Fallback data:', {
      panelIds,
      panelNames
    });
    return {
      panelIds,
      panelNames
    };
  };
  const fallbackData = getFallbackLocationInfo();
  if (loading) {
    return <div className={`flex items-center space-x-2 ${className}`}>
        <MapPin className="h-4 w-4 text-gray-400 animate-pulse" />
        <span className="text-gray-500">Carregando locais...</span>
      </div>;
  }

  // Melhor tratamento de erros
  if (error || (buildingNames.length === 0 && !fallbackData?.panelNames?.length)) {
    // Se não tem dados mas tem IDs, mostrar que está tentando carregar
    if ((listaPredios && listaPredios.length > 0) || listaPaineis.length > 0) {
      return (
        <div className={`space-y-2 ${className}`}>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <div className="font-medium mb-1">Carregando informações dos locais...</div>
              <div className="text-xs opacity-80">
                {listaPredios && listaPredios.length > 0 && (
                  <div>Verificando {listaPredios.length} {listaPredios.length === 1 ? 'local' : 'locais'}</div>
                )}
                {error && (
                  <div className="mt-2 text-red-700 font-medium">
                    Erro: {error}. Por favor, recarregue a página.
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    // Se realmente não tem dados
    return (
      <div className={`space-y-2 ${className}`}>
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm text-orange-900">
            <div className="font-medium">Locais não disponíveis</div>
            <div className="text-xs mt-1 opacity-80">
              Este pedido foi criado sem informações de locais. Entre em contato com o suporte.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Use building names from hook or fallback data
  const displayNames = buildingNames.length > 0 ? buildingNames : fallbackData?.panelNames || [];
  const firstLocation = displayNames[0];
  const totalLocations = displayNames.length;
  if (totalLocations === 0) {
    return <div className={`flex items-center space-x-2 ${className}`}>
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <span className="text-orange-600">Nenhum local encontrado</span>
      </div>;
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 h-auto p-2 hover:bg-blue-50 transition-colors rounded-lg w-full sm:w-auto justify-start"
        >
          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div className="text-left flex-1">
            <div className="font-medium text-gray-900 text-sm sm:text-base">
              {totalLocations === 1 ? firstLocation : `${firstLocation} + ${totalLocations - 1} mais`}
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              Ver todos os locais
            </div>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-base sm:text-lg">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Locais Contratados ({totalLocations})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {displayNames.map((nome, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                {index + 1}
              </div>
              <span className="font-medium text-gray-900 text-sm sm:text-base">{nome}</span>
            </div>
          ))}
        </div>
        
        <div className="text-sm text-gray-700 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <strong>Total:</strong> {totalLocations} {totalLocations === 1 ? 'local selecionado' : 'locais selecionados'} para exibição do seu conteúdo.
        </div>

        {/* DEBUG INFO for development */}
        {process.env.NODE_ENV === 'development'}
      </DialogContent>
    </Dialog>
  );
};