import React from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotificationSound, SOUND_OPTIONS } from '@/hooks/useNotificationSound';
import { useUserPermissions } from '@/hooks/useUserPermissions';

const NotificationSoundControl: React.FC = () => {
  const { hasAnyPermission } = useUserPermissions();
  const { enabled, volume, soundType, toggleSound, setVolume, setSoundType, playPreview } = useNotificationSound();

  // Only show for users with orders or financial permissions
  if (!hasAnyPermission(['canViewOrders', 'canViewFinancialReports'])) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white"
          title={enabled ? 'Som de notificação ativado' : 'Som de notificação desativado'}
        >
          {enabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          {/* Header with toggle */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Som de Notificação</h4>
            <Switch 
              checked={enabled} 
              onCheckedChange={toggleSound}
              className="data-[state=checked]:bg-indexa-purple"
            />
          </div>

          {/* Sound Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="sound-type" className="text-sm text-gray-700">
              Tipo de Som
            </Label>
            <Select
              value={soundType}
              onValueChange={setSoundType}
              disabled={!enabled}
            >
              <SelectTrigger id="sound-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOUND_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="volume-slider" className="text-sm text-gray-700">
                Volume
              </Label>
              <span className="text-sm font-medium text-indexa-purple">
                {volume}%
              </span>
            </div>
            <Slider 
              id="volume-slider"
              value={[volume]} 
              onValueChange={([v]) => setVolume(v)}
              max={100}
              step={5}
              disabled={!enabled}
              className="[&_[role=slider]]:bg-indexa-purple [&_[role=slider]]:border-indexa-purple"
            />
          </div>

          {/* Preview Button */}
          <Button 
            variant="outline" 
            className="w-full border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white"
            onClick={playPreview}
            disabled={!enabled}
          >
            <Play className="h-4 w-4 mr-2" />
            Testar Som Selecionado
          </Button>

          {/* Info */}
          <p className="text-xs text-gray-600 leading-relaxed">
            💰 O som escolhido será tocado quando um novo pedido for pago.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationSoundControl;
