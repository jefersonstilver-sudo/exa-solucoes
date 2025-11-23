
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff } from 'lucide-react';

interface PanelRemoteTabProps {
  panel: any;
  showPassword: boolean;
  onTogglePassword: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
}

const PanelRemoteTab: React.FC<PanelRemoteTabProps> = ({ 
  panel, 
  showPassword, 
  onTogglePassword, 
  onCopyToClipboard 
}) => {
  return (
    <Card className="glass-card border-module-border">
      <CardHeader>
        <CardTitle className="text-module-primary">Acesso Remoto - AnyDesk</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-module-accent/10 rounded-lg border border-module-border">
            <div>
              <h4 className="font-medium text-sm text-module-secondary">Código AnyDesk</h4>
              <p className="text-sm font-mono text-module-primary">{panel.codigo_anydesk || 'Não configurado'}</p>
            </div>
            {panel.codigo_anydesk && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyToClipboard(panel.codigo_anydesk, 'Código AnyDesk')}
                className="hover:bg-module-accent/20"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between p-3 bg-module-accent/10 rounded-lg border border-module-border">
            <div>
              <h4 className="font-medium text-sm text-module-secondary">Senha AnyDesk</h4>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-mono text-module-primary">
                  {panel.senha_anydesk 
                    ? (showPassword ? panel.senha_anydesk : '••••••••')
                    : 'Não configurada'
                  }
                </p>
                {panel.senha_anydesk && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onTogglePassword}
                    className="hover:bg-module-accent/20"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
            {panel.senha_anydesk && showPassword && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyToClipboard(panel.senha_anydesk, 'Senha AnyDesk')}
                className="hover:bg-module-accent/20"
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

export default PanelRemoteTab;
