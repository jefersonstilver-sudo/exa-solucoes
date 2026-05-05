import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { QrCode, Crosshair, Save, Trash2, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VideoQRConfigData {
  enabled: boolean;
  redirect_url: string;
  position: { x: number; y: number } | null;
  updated_at?: string;
}

interface VideoQRConfigProps {
  /** Quando informado: modo persistido (edita o slot existente). */
  pedidoVideoId?: string;
  initial?: VideoQRConfigData | null;
  disabled?: boolean;
  /** Quando informado: modo inline/controlado (captação durante upload, sem DB). */
  value?: VideoQRConfigData | null;
  onChange?: (next: VideoQRConfigData | null) => void;
  /** No modo controlado: bloqueia o seletor de localização até haver vídeo. */
  hasVideoSelected?: boolean;
}

const urlSchema = z.string().trim().url('URL inválida').max(2048, 'URL muito longa');

export const VideoQRConfig: React.FC<VideoQRConfigProps> = ({ pedidoVideoId, initial, disabled, value, onChange, hasVideoSelected = true }) => {
  const isControlled = typeof onChange === 'function';
  const source = isControlled ? value : initial;

  const [enabled, setEnabled] = useState<boolean>(!!source?.enabled);
  const [url, setUrl] = useState<string>(source?.redirect_url ?? '');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(source?.position ?? null);
  const [saving, setSaving] = useState(false);
  const [showLocator, setShowLocator] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setEnabled(!!source?.enabled);
    setUrl(source?.redirect_url ?? '');
    setPosition(source?.position ?? null);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoVideoId, source?.enabled, source?.redirect_url, source?.position?.x, source?.position?.y]);

  // Modo controlado: emite mudanças ao pai sem salvar no banco
  const emitChange = (next: { enabled: boolean; url: string; position: { x: number; y: number } | null }) => {
    if (!isControlled) return;
    if (!next.enabled) {
      onChange!(null);
      return;
    }
    onChange!({
      enabled: true,
      redirect_url: next.url,
      position: next.position,
    });
  };

  const handleSave = async () => {
    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'URL inválida');
      return;
    }
    if (!pedidoVideoId) return;
    setSaving(true);
    try {
      const payload: VideoQRConfigData = {
        enabled: true,
        redirect_url: parsed.data,
        position,
        updated_at: new Date().toISOString(),
      };
      const { error } = await (supabase as any)
        .from('pedido_videos')
        .update({ qr_config: payload })
        .eq('id', pedidoVideoId);
      if (error) throw error;
      toast.success('QR rastreável salvo');
      setDirty(false);
    } catch (e: any) {
      console.error('[VideoQRConfig] save error', e);
      toast.error('Erro ao salvar: ' + (e.message || 'desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!pedidoVideoId) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('pedido_videos')
        .update({ qr_config: null })
        .eq('id', pedidoVideoId);
      if (error) throw error;
      setEnabled(false);
      setUrl('');
      setPosition(null);
      setDirty(false);
      toast.success('QR rastreável removido');
    } catch (e: any) {
      toast.error('Erro ao remover: ' + (e.message || 'desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = isControlled
    ? !!value?.enabled && !!value?.redirect_url
    : !!initial?.enabled && !!initial?.redirect_url;

  return (
    <div className="mt-3 rounded-xl border border-border bg-background/60 backdrop-blur-sm p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={enabled}
            disabled={disabled || saving}
            onCheckedChange={(checked) => {
              const next = !!checked;
              setEnabled(next);
              setDirty(true);
              emitChange({ enabled: next, url, position });
            }}
          />
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <QrCode className="h-4 w-4 text-primary" />
            Adicionar QR rastreável
          </span>
        </label>
        {isConfigured && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <QrCode className="h-3 w-3" /> Configurado
          </Badge>
        )}
      </div>

      {enabled && (
        <div className="space-y-2 pt-1 animate-fade-in">
          <div className="space-y-1">
            <Label htmlFor={`qr-url-${pedidoVideoId}`} className="text-xs text-muted-foreground">
              Link de redirecionamento
            </Label>
            <Input
              id={`qr-url-${pedidoVideoId}`}
              type="url"
              inputMode="url"
              placeholder="https://seusite.com/promo"
              value={url}
              disabled={disabled || saving}
              onChange={(e) => {
                const v = e.target.value;
                setUrl(v);
                setDirty(true);
                emitChange({ enabled, url: v, position });
              }}
              maxLength={2048}
              className="h-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || saving}
              onClick={() => setShowLocator(true)}
              className="h-8 text-xs"
            >
              <Crosshair className="h-3.5 w-3.5 mr-1" />
              {position ? `Local: ${position.x}, ${position.y} px` : 'Selecionar localização do QR'}
            </Button>

            {!isControlled && (
              <div className="ml-auto flex items-center gap-2">
                {isConfigured && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    disabled={disabled || saving}
                    className="h-8 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remover
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={disabled || saving || !dirty || !url}
                  className="h-8 text-xs"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Salvar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={showLocator} onOpenChange={setShowLocator}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crosshair className="h-4 w-4" />
              Selecionar localização do QR
            </DialogTitle>
            <DialogDescription>
              O seletor visual com sombreado sobre o vídeo será disponibilizado em breve.
              Por enquanto, salve o link e nossa equipe definirá uma posição padrão para o QR no vídeo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocator(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
