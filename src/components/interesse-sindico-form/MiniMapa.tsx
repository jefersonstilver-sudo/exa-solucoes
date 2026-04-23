import React, { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '@/utils/googleMapsLoader';

interface Props {
  lat: number;
  lng: number;
}

export const MiniMapa: React.FC<Props> = ({ lat, lng }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !ref.current) return;
      if (!mapRef.current) {
        mapRef.current = new google.maps.Map(ref.current, {
          center: { lat, lng },
          zoom: 17,
          disableDefaultUI: true,
          gestureHandling: 'cooperative',
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#1a1010' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#a5a5a5' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a1818' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0606' }] },
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          ],
        });
        markerRef.current = new google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#c7141a',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });
      } else {
        mapRef.current.setCenter({ lat, lng });
        markerRef.current?.setPosition({ lat, lng });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return (
    <div
      ref={ref}
      className="w-full rounded-xl overflow-hidden border border-white/10"
      style={{ height: 160 }}
      aria-label="Localização do prédio no mapa"
    />
  );
};

export default MiniMapa;
