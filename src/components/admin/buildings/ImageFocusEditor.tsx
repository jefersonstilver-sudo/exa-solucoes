import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Move, Check, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ImageFocusEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  buildingName: string;
  imagePath: string;
  slotIndex: number; // 0..3
  initialFocus?: { x: number; y: number };
  onSaved: () => void;
}

const focusFieldByIndex = ['imagem_principal_focus', 'imagem_2_focus', 'imagem_3_focus', 'imagem_4_focus'];

const presets = [
  { label: 'Centro', x: 50, y: 50 },
  { label: 'Topo', x: 50, y: 15 },
  { label: 'Inferior', x: 50, y: 85 },
  { label: 'Esquerda', x: 15, y: 50 },
  { label: 'Direita', x: 85, y: 50 },
];

const resolveImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl;
};

const ImageFocusEditor: React.FC<ImageFocusEditorProps> = ({
  open,
  onOpenChange,
  buildingId,
  buildingName,
  imagePath,
  slotIndex,
  initialFocus,
  onSaved,
}) => {
  const [focus, setFocus] = useState(initialFocus || { x: 50, y: 50 });
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (open) setFocus(initialFocus || { x: 50, y: 50 });
  }, [open, initialFocus]);

  const url = resolveImageUrl(imagePath);

  const updateFocusFromPointer = (clientX: number, clientY: number) => {
    const el = dragRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setFocus({ x: Math.round(x), y: Math.round(y) });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFocusFromPointer(e.clientX, e.clientY);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    updateFocusFromPointer(e.clientX, e.clientY);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const field = focusFieldByIndex[slotIndex];
      const { error } = await supabase
        .from('buildings')
        .update({ [field]: focus })
        .eq('id', buildingId);
      if (error) throw error;
      toast.success('Enquadramento salvo!');
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      console.error('Erro ao salvar foco:', e);
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Move className="h-5 w-5 mr-2 text-[#9C1E1E]" />
            Ajustar Enquadramento — {buildingName}
          </DialogTitle>
          <DialogDescription>
            Arraste o ponto sobre a imagem para definir qual parte da fachada deve aparecer em destaque na loja pública.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
          {/* Editor — imagem completa com crosshair arrastável */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Imagem original — arraste o ponto
            </div>
            <div
              ref={dragRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 select-none touch-none cursor-crosshair"
              style={{ backgroundImage: `url(${url})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
            >
              <motion.div
                animate={{ left: `${focus.x}%`, top: `${focus.y}%` }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-[3px] border-white shadow-[0_0_0_2px_rgba(156,30,30,0.9),0_4px_12px_rgba(0,0,0,0.4)] bg-[#9C1E1E]/30 backdrop-blur-sm" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </motion.div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setFocus({ x: p.x, y: p.y })}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:border-[#9C1E1E]/40 transition-colors"
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFocus({ x: 50, y: 50 })}
                className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Resetar
              </button>
            </div>

            <div className="text-xs text-gray-500 font-mono">
              Foco: x={focus.x}% · y={focus.y}%
            </div>
          </div>

          {/* Preview ao vivo — como aparecerá na loja */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Pré-visualização na loja (16:10)
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
                />
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-gray-900">{buildingName}</div>
                <div className="text-xs text-gray-500">Como o cliente verá na vitrine</div>
              </div>
            </div>

            {/* Preview adicional — proporção quadrada (mobile sheet) */}
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide pt-2">
              Pré-visualização quadrada
            </div>
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              <img
                src={url}
                alt="Preview square"
                className="w-full h-full object-cover"
                style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#9C1E1E] hover:bg-[#7d1818]">
            <Check className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar enquadramento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageFocusEditor;
