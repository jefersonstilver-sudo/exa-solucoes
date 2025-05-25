
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getPanelStatusConfig } from './PanelStatusConfig';
import PanelCardHeader from './PanelCardHeader';
import PanelCardContent from './PanelCardContent';
import PanelCardActions from './PanelCardActions';
import { usePanelCardOperations } from './hooks/usePanelCardOperations';

interface PanelCardProps {
  panel: {
    id: string;
    code: string;
    status: string;
    resolucao?: string;
    modo?: string;
    ultima_sync?: string;
  };
  onRemove: (panel: any) => void;
  onSync: (panelId: string) => void;
  onViewDetails: (panelId: string) => void;
  canManage?: boolean;
  disabled?: boolean;
}

const PanelCard: React.FC<PanelCardProps> = ({
  panel,
  onRemove,
  onSync,
  onViewDetails,
  canManage = true,
  disabled = false
}) => {
  console.log('🎯 [PANEL CARD] Renderizando painel:', {
    id: panel.id,
    code: panel.code,
    status: panel.status,
    disabled
  });

  const statusConfig = getPanelStatusConfig(panel.status);

  const {
    handleRemove,
    handleSync,
    handleViewDetails,
    isActionDisabled
  } = usePanelCardOperations({
    panelId: panel.id,
    panelCode: panel.code,
    onRemove,
    onSync,
    onViewDetails,
    disabled
  });

  return (
    <Card className={`
      hover:shadow-lg transition-all duration-300 hover:scale-[1.02]
      bg-gradient-to-br ${statusConfig.bgGradient}
      border-2 ${statusConfig.borderColor}
      ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}>
      <PanelCardHeader 
        panelCode={panel.code}
        statusConfig={statusConfig}
      />
      
      <CardContent className="space-y-4">
        <PanelCardContent
          resolucao={panel.resolucao}
          modo={panel.modo}
          ultima_sync={panel.ultima_sync}
        />

        <PanelCardActions
          onViewDetails={() => handleViewDetails()}
          onSync={handleSync}
          onRemove={() => handleRemove(panel)}
          isActionDisabled={isActionDisabled}
          canManage={canManage}
        />
      </CardContent>
    </Card>
  );
};

export default PanelCard;
