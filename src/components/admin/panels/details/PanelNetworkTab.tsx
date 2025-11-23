
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

interface PanelNetworkTabProps {
  panel: any;
  onCopyToClipboard: (text: string, label: string) => void;
}

const PanelNetworkTab: React.FC<PanelNetworkTabProps> = ({ panel, onCopyToClipboard }) => {
  return (
    <Card className="glass-card border-module-border">
      <CardHeader>
        <CardTitle className="text-module-primary">Configurações de Rede</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-3 bg-module-accent/10 rounded-lg border border-module-border">
            <div>
              <h4 className="font-medium text-sm text-module-secondary">IP Interno</h4>
              <p className="text-sm text-module-primary">{panel.ip_interno || 'Não configurado'}</p>
            </div>
            {panel.ip_interno && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyToClipboard(panel.ip_interno, 'IP Interno')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between p-3 bg-module-accent/10 rounded-lg border border-module-border">
            <div>
              <h4 className="font-medium text-sm text-module-secondary">Endereço MAC</h4>
              <p className="text-sm font-mono text-module-primary">{panel.mac_address || 'Não configurado'}</p>
            </div>
            {panel.mac_address && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyToClipboard(panel.mac_address, 'Endereço MAC')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PanelNetworkTab;
