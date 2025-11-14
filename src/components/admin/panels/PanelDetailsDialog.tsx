
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor } from 'lucide-react';
import { usePanelDetailsData } from '@/hooks/usePanelDetailsData';
import PanelStatusCard from './details/PanelStatusCard';
import PanelTechnicalTab from './details/PanelTechnicalTab';
import PanelNetworkTab from './details/PanelNetworkTab';
import PanelDeviceTab from './details/PanelDeviceTab';
import PanelRemoteTab from './details/PanelRemoteTab';
import PanelAdditionalTab from './details/PanelAdditionalTab';

interface PanelDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel?: any;
}

const PanelDetailsDialog: React.FC<PanelDetailsDialogProps> = ({
  open,
  onOpenChange,
  panel
}) => {
  const {
    showPassword,
    setShowPassword,
    getStatusInfo,
    copyToClipboard
  } = usePanelDetailsData(panel);

  if (!panel) return null;

  const statusInfo = getStatusInfo(panel.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <Monitor className="h-6 w-6 mr-2" />
            Detalhes do Painel - {panel.code}
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações e configurações do painel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <PanelStatusCard panel={panel} statusInfo={statusInfo} />

          <Tabs defaultValue="device" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="device">Dispositivo</TabsTrigger>
              <TabsTrigger value="technical">Técnico</TabsTrigger>
              <TabsTrigger value="network">Rede</TabsTrigger>
              <TabsTrigger value="remote">Acesso Remoto</TabsTrigger>
              <TabsTrigger value="additional">Adicional</TabsTrigger>
            </TabsList>

            <TabsContent value="device" className="space-y-4">
              <PanelDeviceTab panel={panel} />
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <PanelTechnicalTab panel={panel} />
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              <PanelNetworkTab 
                panel={panel} 
                onCopyToClipboard={copyToClipboard}
              />
            </TabsContent>

            <TabsContent value="remote" className="space-y-4">
              <PanelRemoteTab 
                panel={panel}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                onCopyToClipboard={copyToClipboard}
              />
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              <PanelAdditionalTab panel={panel} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PanelDetailsDialog;
