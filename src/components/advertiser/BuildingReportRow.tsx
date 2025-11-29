import React from 'react';
import { Building2, MapPin, Tv, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateCommercialPath } from '@/utils/buildingSlugUtils';
import { BuildingInfo } from '@/hooks/useVideoReportData';

interface BuildingReportRowProps {
  building: BuildingInfo;
}

export const BuildingReportRow = ({ building }: BuildingReportRowProps) => {
  const handleWatchLive = () => {
    if (building.codigo_predio) {
      const commercialPath = generateCommercialPath(building.nome, building.codigo_predio);
      window.open(commercialPath, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-border/40 hover:bg-accent/10 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Bullet vermelho */}
        <div className="w-2 h-2 rounded-full bg-[#9C1E1E] flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#9C1E1E] flex-shrink-0" />
            <p className="font-medium text-sm text-foreground truncate">{building.nome}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {building.bairro}
            </span>
            <span className="flex items-center gap-1">
              <Tv className="w-3 h-3" />
              {building.quantidade_telas || 0} {building.quantidade_telas === 1 ? 'tela' : 'telas'}
            </span>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={handleWatchLive}
        className="flex-shrink-0 border-[#9C1E1E]/20 text-[#9C1E1E] hover:bg-[#9C1E1E]/10 hover:text-[#9C1E1E] hover:border-[#9C1E1E]/30"
      >
        <Eye className="w-3.5 h-3.5 mr-1.5" />
        Ver ao Vivo
      </Button>
    </div>
  );
};
