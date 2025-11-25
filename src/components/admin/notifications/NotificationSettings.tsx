import React from 'react';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useAuth } from '@/hooks/useAuth';

/**
 * NotificationSettings - Controle de preferências de notificações
 * Usado no módulo de monitoramento e no perfil do admin
 */
export const NotificationSettings: React.FC<{ variant?: 'icon' | 'full' }> = ({ variant = 'icon' }) => {
  const { isSuperAdmin } = useAuth();
  const { preferences, updatePreferences, loading } = useNotificationPreferences();

  // Só mostrar para super admins
  if (!isSuperAdmin) return null;

  const playPreview = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = preferences.panel_alerts_volume;
    audio.play().catch(() => {
      console.log('Não foi possível tocar preview');
    });
  };

  if (variant === 'full') {
    // Versão completa para página de configurações
    return (
      <div className="space-y-6 p-6 bg-card rounded-lg border">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Notificações de Painéis</h3>
        </div>

        <div className="space-y-4">
          {/* Toggle de notificações */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="panel-alerts">Alertas de Painéis Offline</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações quando um painel ficar offline
              </p>
            </div>
            <Switch
              id="panel-alerts"
              checked={preferences.panel_alerts_enabled}
              onCheckedChange={(enabled) => updatePreferences({ panel_alerts_enabled: enabled })}
              disabled={loading}
            />
          </div>

          {/* Toggle de som */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="panel-sound">Som de Alerta</Label>
              <p className="text-sm text-muted-foreground">
                Tocar som quando receber uma notificação
              </p>
            </div>
            <Switch
              id="panel-sound"
              checked={preferences.panel_alerts_sound}
              onCheckedChange={(enabled) => updatePreferences({ panel_alerts_sound: enabled })}
              disabled={loading || !preferences.panel_alerts_enabled}
            />
          </div>

          {/* Slider de volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="volume">Volume</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(preferences.panel_alerts_volume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                id="volume"
                value={[preferences.panel_alerts_volume]}
                onValueChange={([value]) => updatePreferences({ panel_alerts_volume: value })}
                max={1}
                step={0.1}
                disabled={loading || !preferences.panel_alerts_enabled || !preferences.panel_alerts_sound}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={playPreview}
                disabled={!preferences.panel_alerts_enabled || !preferences.panel_alerts_sound}
              >
                Testar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Versão ícone para header do módulo
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Configurações de Notificação"
        >
          {preferences.panel_alerts_enabled ? (
            preferences.panel_alerts_sound ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="font-semibold">Notificações de Painéis</div>

          <div className="flex items-center justify-between">
            <Label htmlFor="alerts-enabled" className="text-sm">
              Alertas ativos
            </Label>
            <Switch
              id="alerts-enabled"
              checked={preferences.panel_alerts_enabled}
              onCheckedChange={(enabled) => updatePreferences({ panel_alerts_enabled: enabled })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sound-enabled" className="text-sm">
              Som de alerta
            </Label>
            <Switch
              id="sound-enabled"
              checked={preferences.panel_alerts_sound}
              onCheckedChange={(enabled) => updatePreferences({ panel_alerts_sound: enabled })}
              disabled={!preferences.panel_alerts_enabled}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="volume-slider" className="text-sm">Volume</Label>
              <span className="text-xs text-muted-foreground">
                {Math.round(preferences.panel_alerts_volume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                id="volume-slider"
                value={[preferences.panel_alerts_volume]}
                onValueChange={([value]) => updatePreferences({ panel_alerts_volume: value })}
                max={1}
                step={0.1}
                disabled={!preferences.panel_alerts_enabled || !preferences.panel_alerts_sound}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={playPreview}
                disabled={!preferences.panel_alerts_enabled || !preferences.panel_alerts_sound}
              >
                <Volume2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
