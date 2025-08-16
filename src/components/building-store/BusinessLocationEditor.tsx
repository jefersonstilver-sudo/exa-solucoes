import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Edit3, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';
import { toast } from 'sonner';

interface BusinessLocationEditorProps {
  businessLocation: { lat: number; lng: number };
  businessAddress: string;
}

const BusinessLocationEditor: React.FC<BusinessLocationEditorProps> = ({
  businessLocation,
  businessAddress
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [originalLocation] = useState(businessLocation);
  const { setBusinessLocation, refreshBuildings } = useBuildingStore();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700"
    >
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
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditToggle}
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Ajustar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="flex items-center gap-1"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleConfirmEdit}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800"
        >
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Modo de edição ativo:</strong> Clique no mapa para reposicionar seu pin vermelho. 
            Use os botões acima para confirmar ou cancelar as alterações.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BusinessLocationEditor;