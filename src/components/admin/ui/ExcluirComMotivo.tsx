// EXA (07/11/2026) — exclusão com motivo obrigatório e log de auditoria (admin_auditoria_log), via RPC admin_excluir_com_motivo.
import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BOTAO2, CAMPO } from './exa';

export async function excluirComMotivo(tabela: string, id: string, motivo: string) {
  const { error } = await (supabase as any).rpc('admin_excluir_com_motivo', { p_tabela: tabela, p_id: id, p_motivo: motivo });
  if (error) throw error;
}

export const ExcluirComMotivo: React.FC<{
  tabela: string; ids: string[]; nome: string; onFeito?: () => void;
  className?: string; children?: React.ReactNode; title?: string;
}> = ({ tabela, ids, nome, onFeito, className, children, title }) => {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [indo, setIndo] = useState(false);
  const confirmar = async () => {
    if (motivo.trim().length < 3) { toast.error('Escreva o motivo (fica no log de auditoria).'); return; }
    setIndo(true);
    try {
      for (const id of ids) await excluirComMotivo(tabela, id, motivo.trim());
      toast.success(ids.length === 1 ? `${nome} excluído. Motivo guardado no log.` : `${ids.length} registros excluídos. Motivo guardado no log.`);
      setAberto(false); setMotivo(''); onFeito?.();
    } catch (e: any) { toast.error('Não excluiu: ' + (e?.message || e)); }
    finally { setIndo(false); }
  };
  return (
    <>
      <button type="button" onClick={() => setAberto(true)} title={title || 'Excluir (com motivo)'} className={className || 'grid h-9 w-9 place-items-center rounded-xl bg-white/80 text-[#B0261D] ring-1 ring-black/[0.08] hover:bg-[#FDECEC]'}>
        {children || <Trash2 className="h-4 w-4" />}
      </button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Excluir {ids.length === 1 ? nome : `${ids.length} registros`}</DialogTitle></DialogHeader>
          <p className="text-sm text-[#6A6B70]">O registro inteiro e o motivo ficam guardados no log de auditoria. Não dá pra desfazer pela tela.</p>
          <label className="block"><span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">Motivo</span>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Ex.: cadastro de teste, prédio não existe" className={`${CAMPO} mt-1 h-auto py-2`} autoFocus /></label>
          <DialogFooter className="gap-2">
            <button type="button" className={BOTAO2} onClick={() => setAberto(false)}>Cancelar</button>
            <button type="button" disabled={indo} onClick={confirmar} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#B0261D] px-3.5 text-sm font-bold text-white hover:bg-[#8f1e17] disabled:opacity-50">
              {indo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default ExcluirComMotivo;
