
/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Info, Maximize, Minimize } from 'lucide-react';
import type { Panel } from '@/types/panel';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from 'framer-motion';

// Variável global para controlar o carregamento da API Google Maps
let googleMapsLoaded = false;
let googleMapsLoading = false;

interface PanelMapProps {
  panels: Panel[];
  selectedLocation: {lat: number, lng: number} | null;
  onAddToCart?: (panel: Panel, duration?: number) => void;
  miniMap?: boolean;
}

const PanelMap: React.FC<PanelMapProps> = ({ panels, selectedLocation, onAddToCart, miniMap = false }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapInstanceIdRef = useRef<string>(`map-${Math.random().toString(36).substr(2, 9)}`);
  
  // Função segura para carregar o script do Google Maps
  const loadGoogleMapsScript = useCallback(() => {
    if (googleMapsLoaded || window.mapsApiLoaded) {
      return Promise.resolve();
    }
    
    if (googleMapsLoading) {
      return new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (googleMapsLoaded || window.mapsApiLoaded) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Timeout para evitar loops infinitos
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(); // Resolve mesmo se não carregou
        }, 10000);
      });
    }
    
    return new Promise<void>((resolve) => {
      googleMapsLoading = true;
      console.log(`Iniciando carregamento do Google Maps - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      
      // Callback chamada quando o Google Maps estiver carregado
      window.initMap = () => {
        console.log(`Google Maps carregado com sucesso - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
        googleMapsLoaded = true;
        window.mapsApiLoaded = true;
        resolve();
      };
      
      // Criar e adicionar o script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAVQPvo8asVwVVuWBxReck6ohF9vvDR_qM&libraries=places&loading=async&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        console.error('Falha ao carregar script do Google Maps');
        googleMapsLoading = false;
        resolve(); // Resolve mesmo com erro para não bloquear
      };
      
      document.head.appendChild(script);
    });
  }, [miniMap]);

  // Limpar todos os marcadores e janelas de informação
  const clearMarkersAndInfoWindows = useCallback(() => {
    console.log(`Limpando marcadores e janelas de informação - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    // Limpar marcadores
    if (markersRef.current && markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        if (marker) {
          try {
            // Remover event listeners
            if (window.google && window.google.maps) {
              google.maps.event.clearInstanceListeners(marker);
            }
            // Remover marcador do mapa
            marker.setMap(null);
          } catch (error) {
            console.error('Erro ao limpar marcador:', error);
          }
        }
      });
      markersRef.current = [];
    }
    
    // Fechar e limpar janelas de informação
    if (infoWindowsRef.current && infoWindowsRef.current.length > 0) {
      infoWindowsRef.current.forEach(infoWindow => {
        if (infoWindow) {
          try {
            infoWindow.close();
            if (window.google && window.google.maps) {
              google.maps.event.clearInstanceListeners(infoWindow);
            }
          } catch (error) {
            console.error('Erro ao limpar infoWindow:', error);
          }
        }
      });
      infoWindowsRef.current = [];
    }
  }, [miniMap]);
  
  // Adicionar marcadores para todos os painéis
  const addMarkers = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps || !mapInitialized) {
      console.log(`Não é possível adicionar marcadores - mapa não está pronto - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      return;
    }
    
    console.log(`Adicionando marcadores - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    try {
      // Limpar marcadores existentes primeiro
      clearMarkersAndInfoWindows();
      
      // Adicionar novos marcadores para cada painel
      panels.forEach((panel, index) => {
        if (panel.buildings?.latitude && panel.buildings?.longitude) {
          try {
            const panelId = panel.id || `panel-${index}`;
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div class="p-2 min-w-[220px]">
                  <h4 class="font-semibold text-sm">${panel.buildings.nome}</h4>
                  <p class="text-xs text-gray-500 mb-2">${panel.buildings.endereco}, ${panel.buildings.bairro}</p>
                  <p class="text-xs mb-1">Status: <span class="font-semibold ${
                    panel.status === 'online' ? 'text-green-600' : 'text-amber-600'
                  }">${panel.status === 'online' ? 'Ativo' : 'Instalando'}</span></p>
                  <div class="flex justify-between text-xs text-gray-500">
                    <span>${panel.resolucao || '1080p'}</span>
                    <span>Visualizações: 1.2k/mês</span>
                  </div>
                  <button id="add-to-cart-${panelId}" class="mt-2 text-xs bg-[#7C3AED] hover:bg-[#00F894] text-white px-2 py-1 rounded w-full transition-all hover:scale-105 duration-200">
                    Adicionar ao Carrinho
                  </button>
                </div>
              `
            });
            
            // Armazenar a janela de informação para limpeza
            infoWindowsRef.current.push(infoWindow);
            
            const marker = new google.maps.Marker({
              position: { lat: panel.buildings.latitude, lng: panel.buildings.longitude },
              map: mapRef.current,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: panel.status === 'online' ? '#10B981' : '#F59E0B', // verde ou âmbar
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
              },
              title: panel.buildings.nome
            });
            
            marker.addListener('click', () => {
              // Fechar qualquer janela de informação aberta
              infoWindowsRef.current.forEach(window => {
                if (window) window.close();
              });
              
              infoWindow.open(mapRef.current, marker);
              
              // Adicionar event listener ao botão "Adicionar ao Carrinho" dentro da janela de informação
              google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
                const button = document.getElementById(`add-to-cart-${panelId}`);
                if (button) {
                  button.addEventListener('click', () => {
                    if (onAddToCart) onAddToCart(panel);
                    infoWindow.close();
                  });
                }
              });
            });
            
            // Armazenar o marcador para limpeza
            markersRef.current.push(marker);
          } catch (error) {
            console.error('Erro ao adicionar marcador:', error);
          }
        }
      });
      
      // Ajustar limites se houver marcadores e nenhuma localização selecionada
      if (markersRef.current.length > 0 && !selectedLocation && mapRef.current) {
        try {
          const bounds = new google.maps.LatLngBounds();
          markersRef.current.forEach(marker => {
            if (marker && marker.getPosition()) {
              bounds.extend(marker.getPosition() as google.maps.LatLng);
            }
          });
          
          mapRef.current.fitBounds(bounds);
          
          // Não ampliar demais
          const listener = google.maps.event.addListener(mapRef.current, 'idle', () => {
            if (mapRef.current && mapRef.current.getZoom() as number > 15) {
              mapRef.current.setZoom(15);
            }
            google.maps.event.removeListener(listener);
          });
        } catch (error) {
          console.error('Erro ao ajustar limites:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar marcadores:', error);
    }
  }, [panels, selectedLocation, clearMarkersAndInfoWindows, onAddToCart, miniMap, mapInitialized]);
  
  // Adicionar marcador para localização selecionada
  const addSelectedLocationMarker = useCallback(() => {
    if (!mapRef.current || !selectedLocation || !window.google || !window.google.maps || !mapInitialized) {
      console.log(`Não é possível adicionar marcador de localização selecionada - mapa não está pronto - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      return;
    }
    
    console.log(`Adicionando marcador de localização selecionada - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    try {
      const marker = new google.maps.Marker({
        position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#7C3AED', // roxo
          fillOpacity: 0.7,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
        title: 'Localização selecionada',
        zIndex: 1000 // Manter no topo
      });
      
      // Adicionar animação de ondulação
      const cityCircle = new google.maps.Circle({
        strokeColor: '#00F894',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#00F894',
        fillOpacity: 0.2,
        map: mapRef.current,
        center: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        radius: 300, // Metros
      });
      
      // Centralizar mapa na localização selecionada
      if (mapRef.current) {
        mapRef.current.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        mapRef.current.setZoom(14);
      }
      
      // Armazenar para limpeza
      markersRef.current.push(marker);
    } catch (error) {
      console.error('Erro ao adicionar marcador de localização selecionada:', error);
    }
  }, [selectedLocation, miniMap, mapInitialized]);
  
  // Inicializar mapa
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || !window.google || !window.google.maps || mapInitialized) {
      console.log(`Não é possível inicializar mapa - pré-requisitos não atendidos - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      return;
    }
    
    console.log(`Inicializando mapa - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    try {
      // Centralizar no Brasil se nenhuma localização for selecionada
      const defaultCenter = selectedLocation ? 
        { lat: selectedLocation.lat, lng: selectedLocation.lng } : 
        { lat: -15.793889, lng: -47.882778 }; // Padrão para Brasília
      
      // Verificar se o objeto ControlPosition existe antes de usá-lo
      let zoomControlOptions = {};
      if (window.google.maps.ControlPosition && window.google.maps.ControlPosition.RIGHT_TOP) {
        zoomControlOptions = {
          position: google.maps.ControlPosition.RIGHT_TOP
        };
      }
      
      const mapOptions: google.maps.MapOptions = {
        center: defaultCenter,
        zoom: selectedLocation ? 13 : 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      };
      
      // Criar nova instância de mapa
      if (mapContainerRef.current) {
        mapRef.current = new google.maps.Map(mapContainerRef.current, mapOptions);
        setMapInitialized(true);
        setMapLoaded(true);
        
        // Adicionar marcadores após inicialização do mapa
        if (panels.length > 0) {
          setTimeout(() => {
            addMarkers();
          }, 100);
        }
        
        // Adicionar marcador de localização selecionada se disponível
        if (selectedLocation) {
          setTimeout(() => {
            addSelectedLocationMarker();
          }, 200);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
    }
  }, [panels, selectedLocation, addMarkers, addSelectedLocationMarker, mapInitialized, miniMap]);
  
  // Carregar e inicializar Google Maps de forma segura
  useEffect(() => {
    console.log(`Configurando Google Maps - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    let isMounted = true;
    
    const setupMap = async () => {
      try {
        // Verificar se o Google Maps já está disponível
        if (window.google && window.google.maps) {
          console.log(`Google Maps já carregado - inicializando mapa - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
          if (isMounted) {
            initializeMap();
          }
          return;
        }
        
        // Carregar script do Google Maps
        await loadGoogleMapsScript();
        
        // Verificar novamente se o componente ainda está montado
        if (isMounted && window.google && window.google.maps) {
          console.log(`Script carregado, inicializando mapa - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
          initializeMap();
        }
      } catch (error) {
        console.error('Erro ao configurar mapa:', error);
      }
    };
    
    setupMap();
    
    // Função de limpeza
    return () => {
      console.log(`PanelMap desmontando - limpando - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
      isMounted = false;
      
      // Limpar todos os marcadores e janelas de informação quando o componente desmontar
      clearMarkersAndInfoWindows();
      
      // Limpar instância do mapa
      if (mapRef.current && window.google && window.google.maps) {
        try {
          console.log(`Limpando instância do mapa - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
          google.maps.event.clearInstanceListeners(mapRef.current);
        } catch (error) {
          console.error('Erro ao limpar event listeners do mapa:', error);
        }
      }
      mapRef.current = null;
    };
  }, [clearMarkersAndInfoWindows, initializeMap, loadGoogleMapsScript, miniMap]);
  
  // Atualizar marcadores quando os painéis ou localização selecionada mudarem
  useEffect(() => {
    console.log(`Painéis ou localização alterados - atualizando marcadores - ${miniMap ? 'mini' : 'full'} - ID: ${mapInstanceIdRef.current}`);
    
    if (mapInitialized && mapRef.current && window.google && window.google.maps) {
      // Usar setTimeout para garantir que as atualizações não colidam
      setTimeout(() => {
        addMarkers();
        
        if (selectedLocation) {
          setTimeout(() => {
            addSelectedLocationMarker();
          }, 100);
        }
      }, 200);
    }
  }, [panels, selectedLocation, addMarkers, addSelectedLocationMarker, mapInitialized, miniMap]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'}`} data-map-id={mapInstanceIdRef.current}>
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? 'Sair do modo tela cheia' : 'Ver em tela cheia'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {!miniMap && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Clique nos marcadores para adicionar o painel ao carrinho.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div ref={mapContainerRef} className="w-full h-full">
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full">
            <p>Carregando mapa...</p>
          </div>
        )}
      </div>
      
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
        >
          <Button 
            className="bg-[#7C3AED] hover:bg-[#00F894] transition-all hover:scale-105 duration-200"
            onClick={toggleFullscreen}
          >
            Fechar Mapa
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default PanelMap;
