import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateDistanceToBuilding, calculateDistance, formatDistance } from '@/services/distanceCalculation';
import { getLocationCoordinates, getGoogleCoordinates } from '@/services/geocoding';

// Cache simples em memória por endereço
const geocodeDistanceCache = new Map<string, string>();

interface BuildingCardDistanceProps {
  building: {
    id?: string;
    latitude?: number;
    longitude?: number;
    manual_latitude?: number;
    manual_longitude?: number;
    endereco?: string;
  };
  businessLocation: { lat: number; lng: number } | null;
}

const BuildingCardDistance: React.FC<BuildingCardDistanceProps> = ({
  building,
  businessLocation
}) => {
  const [approxDistance, setApproxDistance] = useState<string | null>(null);
  const [triedGeocode, setTriedGeocode] = useState(false);

  if (!businessLocation) {
    return null;
  }

  const distance = calculateDistanceToBuilding(businessLocation, building as any);

  // Fallback: geocodificar endereço quando não houver coordenadas
  useEffect(() => {
    if (distance || triedGeocode || !businessLocation) return;
    const address = building.endereco?.trim();
    if (!address) return;

    const cacheKey = address.toLowerCase();
    const cached = geocodeDistanceCache.get(cacheKey);
    if (cached) {
      setApproxDistance(cached);
      setTriedGeocode(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        let coords = await getLocationCoordinates(address);
        if ((!coords || !coords.precise) && !cancelled) {
          const alt = await getGoogleCoordinates(address);
          if (alt) coords = alt;
        }
        if (coords && !cancelled) {
          const meters = calculateDistance(businessLocation, { lat: coords.lat, lng: coords.lng });
          const formatted = formatDistance(meters);
          geocodeDistanceCache.set(cacheKey, formatted);
          setApproxDistance(formatted);
        }
      } catch (e) {
        // Silenciar erros nesta UI
      } finally {
        if (!cancelled) setTriedGeocode(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [distance, triedGeocode, businessLocation, building.endereco]);

  const displayDistance = distance || (approxDistance ? `≈ ${approxDistance}` : null);
  
  if (!displayDistance) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium"
    >
      <MapPin className="w-3.5 h-3.5 mr-1.5" />
      <span>{displayDistance}</span>
    </motion.div>
  );
};

export default BuildingCardDistance;