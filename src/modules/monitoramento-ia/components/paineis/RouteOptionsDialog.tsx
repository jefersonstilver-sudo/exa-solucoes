import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Navigation, ExternalLink } from 'lucide-react';

interface RouteOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  buildingName: string;
  latitude: number;
  longitude: number;
  address?: string | null;
}

export const RouteOptionsDialog: React.FC<RouteOptionsDialogProps> = ({
  isOpen,
  onClose,
  buildingName,
  latitude,
  longitude,
  address,
}) => {
  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    window.open(url, '_blank');
    onClose();
  };

  const openWaze = () => {
    const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Rotas até {buildingName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {address && (
            <p className="text-sm text-muted-foreground pb-2 border-b">
              📍 {address}
            </p>
          )}

          <Button
            onClick={openGoogleMaps}
            variant="outline"
            className="w-full justify-start gap-3 h-14 text-left hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold">Google Maps</p>
              <p className="text-xs text-muted-foreground">Abrir rota no navegador</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Button>

          <Button
            onClick={openWaze}
            variant="outline"
            className="w-full justify-start gap-3 h-14 text-left hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold">Waze</p>
              <p className="text-xs text-muted-foreground">Navegação em tempo real</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
