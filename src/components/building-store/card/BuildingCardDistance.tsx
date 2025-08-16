import React from 'react';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateDistanceToBuilding } from '@/services/distanceCalculation';

interface BuildingCardDistanceProps {
  building: {
    latitude?: number;
    longitude?: number;
    manual_latitude?: number;
    manual_longitude?: number;
  };
  businessLocation: { lat: number; lng: number } | null;
}

const BuildingCardDistance: React.FC<BuildingCardDistanceProps> = ({
  building,
  businessLocation
}) => {
  if (!businessLocation) {
    return null;
  }

  const distance = calculateDistanceToBuilding(businessLocation, building);
  
  if (!distance) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg"
    >
      <MapPin className="w-3 h-3 mr-1" />
      <span>{distance}</span>
    </motion.div>
  );
};

export default BuildingCardDistance;