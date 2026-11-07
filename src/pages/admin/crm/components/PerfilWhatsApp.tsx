// EXA (07/11/2026) — Perfil do WhatsApp de cada agente (Sofia, Nando, Lívia), lido e alterado pela Evolution (exa2-crm-chat:
// perfil / perfil_atualizar): foto, nome, recado e privacidade. "Réplica do WhatsApp e das configurações", pedido do Jeferson.
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Camera, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { chamarChat, CX_TEMA, type CxAgente } from './chat/ChatEXA';
import { BOTAO, BOTAO2, CAMPO, ROTULO, Chip, TOM } from '@/components/admin/ui/exa';

export interface PerfilAgente { instancia: string; numero: string; foto: string | null; nome: string | null; recado: string | null; privacidade: Record<string, string> | null; conexao: string | null }

export async function lerPerfil(agente: CxAgente): Promise<PerfilAgente> {
  return await chamarChat('perfil', { agente });
}

const NOME: Record<CxAgente, string> = { sofia: 'Sofia', nando: 'Nando', livia: 'Lívia' };
const OPC = {
  last: [['all', 'Todos'], ['contacts', 'Meus contatos'], ['contact_blacklist', 'Contatos, exceto…'], ['none', 'Ninguém']],
  profile: [['all', 'Todos'], ['contacts', 'Meus contatos'], ['contact_blacklist', 'Contatos, exceto…'], ['none', 'Ninguém']],
  status: [['all', 'Todos'], ['contacts', 'Meus contatos'], ['contact_blacklist', 'Contatos, exceto…'], ['none', 'Ninguém']],
  online: [['all', 'Todos'], ['match_last_seen', 'Igual ao "visto por último"']],
  readreceipts: [['all', 'Ligadas'], ['none', 'Desligadas']],
  groupadd: [['all', 'Todos'], ['contacts', 'Meus contatos'], ['contact_blacklist', 'Contatos, exceto…']],
} as const;
const ROT: Record<keyof typeof OPC, string> = { last: 'Visto por último', profile: 'Foto do perfil', status: 'Recado', online: 'Online', readreceipts: 'Confirmações de leitura', groupadd: 'Quem pode me adicionar a grupos' };

export const PerfilWhatsApp: React.FC<{ agente: CxAgente; aberto: boolean; onFechar: () => void; onAtualizado?: (p: PerfilAgente) => void }> = ({ agente, aberto, onFechar, onAtualizado }) => {
  const [perfil, setPerfil] = useState<PerfilAgente | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState('');
  const [recado, setRecado] = useState('');
  const [priv, setPriv] = useState<Record<string, string>>({});
  const [fotoLocal, setFotoLocal] = useState<{ file: File; url: string } | null>(null);
  const inputFoto = useRef<HTMLInputElement>(null);
  const tema = CX_TEMA[agente];

  const carregar = async () => {
    setCarregando(true);
    try {
      const p = await lerPerfil(agente);
      setPerfil(p); setNome(p.nome || ''); setRecado(p.recado || ''); setPriv(p.privacidade || {}); setFotoLocal(null);
      onAtualizado?.(p);
    } catch (e: any) { toast.error('Não consegui ler o perfil no WhatsApp: ' + (e?.message || e)); }
    finally { setCarregando(false); }
  };
  useEffect(() => { if (aberto) carregar(); }, [aberto, agente]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = async () => {
    if (!perfil) return;
    setSalvando(true);
    try {
      const corpo: Record<string, unknown> = {};
      if (nome.trim() && nome.trim() !== (perfil.nome || '')) corpo.nome = nome.trim();
      if (recado !== (perfil.recado || '')) corpo.recado = recado;
      const mudouPriv = Object.entries(priv).some(([k, v]) => (perfil.privacidade || {})[k] !== v);
      if (mudouPriv) corpo.privacidade = priv;
      if (fotoLocal) {
        const mime = fotoLocal.file.type || 'image/jpeg';
        const u = await chamarChat('upload_url', { agente, mime });
        const { error } = await supabase.storage.from('crm-midia').uploadToSignedUrl(u.caminho, u.token, fotoLocal.file, { contentType: mime });
        if (error) throw new Error('Falha ao subir a foto: ' + error.message);
        corpo.foto_caminho = u.caminho;
      }
      if (!Object.keys(corpo).length) { toast.message('Nada mudou.'); setSalvando(false); return; }
      const r = await chamarChat('perfil_atualizar', { agente, ...corpo });
      toast.success(`Perfil d${agente === 'nando' ? 'o' : 'a'} ${NOME[agente]} atualizado no WhatsApp (${(r.feito || []).join(', ')}).`);
      setPerfil(r.perfil); setFotoLocal(null); onAtualizado?.(r.perfil);
    } catch (e: any) { toast.error('Não atualizou: ' + (e?.message || e)); }
    finally { setSalvando(false); }
  };
  const removerFoto = async () => {
    if (!window.confirm(`Remover a foto do WhatsApp d${agente === 'nando' ? 'o' : 'a'} ${NOME[agente]}?`)) return;
    setSalvando(true);
    try { const r = await chamarChat('perfil_atualizar', { agente, remover_foto: true }); setPerfil(r.perfil); onAtualizado?.(r.perfil); toast.success('Foto removida.'); }
    catch (e: any) { toast.error('Não removeu: ' + (e?.message || e)); } finally { setSalvando(false); }
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>WhatsApp d{agente === 'nando' ? 'o' : 'a'} {NOME[agente]}</DialogTitle></DialogHeader>
        {carregando && !perfil ? <div className="flex items-center gap-2 py-10 text-sm text-[#6A6B70]"><Loader2 className="h-4 w-4 animate-spin" /> Lendo o perfil no WhatsApp…</div> : perfil && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => inputFoto.current?.click()} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-4" style={{ boxShadow: `0 0 0 4px ${tema.clara}` }} title="Trocar a foto">
                {(fotoLocal?.url || perfil.foto) ? <img src={fotoLocal?.url || perfil.foto || ''} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-2xl font-extrabold text-white" style={{ background: tema.cor }}>{NOME[agente][0]}</span>}
                <span className="absolute inset-x-0 bottom-0 grid h-7 place-items-center bg-black/55 text-white"><Camera className="h-4 w-4" /></span>
              </button>
              <input ref={inputFoto} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFotoLocal({ file: f, url: URL.createObjectURL(f) }); e.target.value = ''; }} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-extrabold">{perfil.nome || '—'}</span>
                  <Chip {...(perfil.conexao === 'open' ? TOM.verde : TOM.vermelho)}>{perfil.conexao === 'open' ? 'conectado' : perfil.conexao || 'sem estado'}</Chip>
                </div>
                <div className="text-[12.5px] text-[#6A6B70]">+{perfil.numero} · instância {perfil.instancia}</div>
                <div className="mt-2 flex gap-2">
                  <button type="button" className={`${BOTAO2} h-8 text-[12.5px]`} onClick={carregar} disabled={carregando}><RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} /> Reler do WhatsApp</button>
                  {perfil.foto && <button type="button" className={`${BOTAO2} h-8 text-[12.5px] text-[#B0261D]`} onClick={removerFoto} disabled={salvando}><Trash2 className="h-3.5 w-3.5" /> Remover foto</button>}
                </div>
              </div>
            </div>
            <label className="block"><span className={ROTULO}>Nome no WhatsApp</span><input className={`${CAMPO} mt-1`} maxLength={25} value={nome} onChange={(e) => setNome(e.target.value)} /></label>
            <label className="block"><span className={ROTULO}>Recado</span><input className={`${CAMPO} mt-1`} maxLength={139} value={recado} onChange={(e) => setRecado(e.target.value)} placeholder="Ex.: Financeiro da EXA Mídia · seg a sex, 9h às 18h" /></label>
            <div>
              <div className={ROTULO}>Privacidade</div>
              {!perfil.privacidade ? <p className="mt-1 text-sm text-[#8A8B90]">A Evolution não devolveu as configurações de privacidade desta instância.</p> : (
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  {(Object.keys(OPC) as (keyof typeof OPC)[]).map((k) => (
                    <label key={k} className="block"><span className="text-[12px] font-semibold text-[#6A6B70]">{ROT[k]}</span>
                      <select className={`${CAMPO} mt-0.5`} value={priv[k] || ''} onChange={(e) => setPriv({ ...priv, [k]: e.target.value })}>
                        {!priv[k] && <option value="">—</option>}
                        {OPC[k].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={BOTAO2} onClick={onFechar}><X className="h-4 w-4" /> Fechar</button>
              <button type="button" className={BOTAO} onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar no WhatsApp</button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PerfilWhatsApp;
