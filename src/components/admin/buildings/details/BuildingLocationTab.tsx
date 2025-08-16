import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Save, RotateCcw, Target, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import loadGoogleMaps from '@/utils/googleMapsLoader';
import CustomMapPin from '@/components/maps/CustomMapPin';

interface BuildingLocationTabProps {
  building: any;
  onRefresh?: () => void;
}

const BuildingLocationTab: React.FC<BuildingLocationTabProps> = ({
  building,
  onRefresh
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedPosition, setDraggedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Get current coordinates (manual takes priority over automatic)
  const getCurrentCoords = () => {
    if (building.manual_latitude && building.manual_longitude) {
      return { lat: building.manual_latitude, lng: building.manual_longitude, isManual: true };
    }
    if (building.latitude && building.longitude) {
      return { lat: building.latitude, lng: building.longitude, isManual: false };
    }
    return { lat: -25.5163, lng: -54.5854, isManual: false }; // Foz default
  };

  const currentCoords = getCurrentCoords();

  // Initialize map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      const maps = await loadGoogleMaps();
      if (!isMounted || !mapRef.current) return;

      const map = new maps.Map(mapRef.current, {
        center: { lat: currentCoords.lat, lng: currentCoords.lng },
        zoom: 18,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        scrollwheel: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
        ]
      });

      mapInstanceRef.current = map;
      setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update marker when map is ready or coordinates change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    const maps = (window as any).google.maps;
    const map = mapInstanceRef.current;

    // Clear existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const position = draggedPosition || { lat: currentCoords.lat, lng: currentCoords.lng };

    // Create custom marker
    const marker = new maps.Marker({
      position,
      map,
      title: building.nome,
      draggable: isEditing,
      animation: maps.Animation.DROP,
      icon: {
        path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
        fillColor: currentCoords.isManual ? '#10B981' : '#6366F1',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 8,
        rotation: 180
      }
    });

    markerRef.current = marker;

    // Add drag listener when editing
    if (isEditing) {
      marker.addListener('dragend', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setDraggedPosition({ lat, lng });
      });
    }

    // Center map on marker
    map.setCenter(position);

  }, [mapReady, currentCoords, isEditing, draggedPosition, building.nome]);

  const handleAutoGeocode = async () => {
    if (!building.endereco) {
      toast.error('Endereço não encontrado para geocodificação');
      return;
    }

    const maps = (window as any).google?.maps;
    if (!maps || !mapInstanceRef.current) {
      toast.error('Google Maps não está carregado');
      return;
    }

    const geocoder = new maps.Geocoder();
    const address = `${building.endereco}, ${building.bairro || ''}, Foz do Iguaçu, PR`;

    geocoder.geocode({ address }, (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const newPosition = { lat: location.lat(), lng: location.lng() };
        setDraggedPosition(newPosition);
        
        if (markerRef.current) {
          markerRef.current.setPosition(newPosition);
          mapInstanceRef.current?.setCenter(newPosition);
        }
        
        toast.success('Coordenadas atualizadas automaticamente');
      } else {
        toast.error('Não foi possível geocodificar o endereço');
      }
    });
  };

  const handleSave = async () => {
    const positionToSave = draggedPosition || { lat: currentCoords.lat, lng: currentCoords.lng };
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('buildings')
        .update({
          manual_latitude: positionToSave.lat,
          manual_longitude: positionToSave.lng,
          position_validated: true,
          position_validation_date: new Date().toISOString()
        })
        .eq('id', building.id);

      if (error) throw error;

      toast.success('Posição do pin salva com sucesso');
      setIsEditing(false);
      setDraggedPosition(null);
      onRefresh?.();
    } catch (error: any) {
      console.error('Erro ao salvar posição:', error);
      toast.error('Erro ao salvar posição: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setDraggedPosition(null);
    setIsEditing(false);
  };

  const getDistanceFromAddress = () => {
    if (!draggedPosition && currentCoords.isManual) return null;
    // Calculate approximate distance (simplified)
    const position = draggedPosition || { lat: currentCoords.lat, lng: currentCoords.lng };
    // This is a simplified distance check - in production you'd use proper geocoding
    return Math.abs(position.lat - currentCoords.lat) + Math.abs(position.lng - currentCoords.lng) > 0.01 ? 'Longe do endereço' : 'Próximo ao endereço';
  };

  const distance = getDistanceFromAddress();

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Status da Posição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {currentCoords.isManual ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Posição Manual
                  </Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <Badge variant="secondary">
                    Posição Automática
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Coordenadas Atuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div>Lat: {(draggedPosition?.lat || currentCoords.lat).toFixed(6)}</div>
              <div>Lng: {(draggedPosition?.lng || currentCoords.lng).toFixed(6)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Navigation className="h-4 w-4 mr-2" />
              Validação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {building.position_validated ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Validado
                </Badge>
              ) : (
                <Badge variant="outline">
                  Não Validado
                </Badge>
              )}
              {distance && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {distance}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Posicionamento do Pin
              </CardTitle>
              <CardDescription>
                Ajuste a posição exata do pin no mapa para melhor precisão na loja pública
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" onClick={handleAutoGeocode}>
                    <Target className="h-4 w-4 mr-2" />
                    Auto-localizar
                  </Button>
                  <Button onClick={() => setIsEditing(true)}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Editar Posição
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Posição'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center text-blue-800 text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Arraste o pin para a posição exata do prédio e clique em "Salvar Posição"</span>
              </div>
            </div>
          )}
          
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-md border bg-muted"
          />
          
          <Separator className="my-4" />
          
          {/* Address Information */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Endereço Cadastrado:</h4>
            <p className="text-sm text-muted-foreground">
              {building.endereco}
              {building.bairro && `, ${building.bairro}`}
              , Foz do Iguaçu - PR
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildingLocationTab;