import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Edit3, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';
import { toast } from 'sonner';
interface BusinessLocationEditorProps {
  businessLocation: {
    lat: number;
    lng: number;
  };
  businessAddress: string;
}
const BusinessLocationEditor: React.FC<BusinessLocationEditorProps> = ({
  businessLocation,
  businessAddress
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [originalLocation] = useState(businessLocation);
  const {
    setBusinessLocation,
    refreshBuildings
  } = useBuildingStore();
  const handleEditToggle = () => {
    if (!isEditing) {
      setIsEditing(true);
      toast.info('Clique no mapa para ajustar a posição do seu negócio');
    } else {
      setIsEditing(false);
    }
  };
  const handleConfirmEdit = async () => {
    setIsEditing(false);
    await refreshBuildings();
    toast.success('Localização atualizada! Distâncias recalculadas.');
  };
  const handleCancelEdit = () => {
    setBusinessLocation(originalLocation, businessAddress);
    setIsEditing(false);
    toast.info('Edição cancelada. Posição original restaurada.');
  };
  const handleReset = () => {
    setBusinessLocation(originalLocation, businessAddress);
    setIsEditing(false);
    toast.info('Posição resetada para a localização original');
  };
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Sua Empresa
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {businessAddress}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Lat: {businessLocation.lat.toFixed(6)}, Lng: {businessLocation.lng.toFixed(6)}
          </p>
        </div>
        
        
      </div>
      
      {isEditing}
    </motion.div>;
};
export default BusinessLocationEditor;