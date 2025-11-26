import React, { useState } from 'react';
import { Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MobileFullscreenMap from './MobileFullscreenMap';
import useBuildingStore from '@/hooks/building-store/useBuildingStore';
import { AnimatePresence } from 'framer-motion';

interface MobileMapDialogProps {
  buildingsCount: number;
  className?: string;
}

const MobileMapDialog: React.FC<MobileMapDialogProps> = ({ buildingsCount, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { buildings } = useBuildingStore();

  const validBuildingsCount = buildings?.filter(b => 
    b.latitude && b.longitude && 
    b.latitude !== 0 && b.longitude !== 0
  ).length || 0;

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline" 
        className={`flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 transition-all duration-200 rounded-lg justify-center ${className}`}
      >
        <Map className="h-4 w-4" />
        <span className="font-medium text-sm">Mapa</span>
        {validBuildingsCount > 0 && (
          <Badge variant="secondary" className="bg-blue-600 text-white text-xs font-bold h-5 px-2">
            {validBuildingsCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <MobileFullscreenMap onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileMapDialog;