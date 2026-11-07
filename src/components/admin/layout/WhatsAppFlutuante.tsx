// EXA (07/11/2026) — WhatsApp da equipe em todas as páginas do admin (Jeferson: "precisa ficar em todas as páginas,
// para todos os membros da equipe, efeito Glasswing"). Botão flutuante com os não lidos e gaveta de vidro com
// Sofia, Nando e Lívia — os mesmos painéis da página Equipe, sem sair de onde você está.
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Maximize2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { CX_TEMA, chamarChat, type CxAgente } from '@/pages/admin/crm/components/chat/ChatEXA';

const SofiaChatPanel = lazy(() => import('@/pages/admin/crm/components/SofiaChatPanel').then((m) => ({ default: m.SofiaChatPanel })));
const NandoChatPanel = lazy(() => import('@/pages/admin/crm/components/NandoChatPanel').then((m) => ({ default: m.NandoChatPanel })));
const LiviaChatPanel = lazy(() => import('@/pages/admin/crm/components/LiviaChatPanel').then((m) => ({ default: m.LiviaChatPanel })));

const NOME: Record<CxAgente, string> = { sofia: 'Sofia', nando: 'Nando', livia: 'Lívia' };
const CHAVE = 'exa_whats_flutuante_agente';

async function naoLidos(): Promise<Record<CxAgente, number>> {
  const out: Record<CxAgente, number> = { sofia: 0, nando: 0, livia: 0 };
  await Promise.all([
    supabase.functions.invoke('sofia-panel', { body: { action: 'list' } }).then(({ data }) => { out.sofia = ((data as any)?.conversations || []).filter((c: any) => c.mode === 'humano').length; /* Sofia: conversas que estão com a equipe */ }, () => {}),
    supabase.functions.invoke('nando-crm', { body: { action: 'list' } }).then(({ data }) => { out.nando = ((data as any)?.conversas || []).filter((c: any) => c.aguardando > 0 && c.modo !== 'humano').length; }, () => {}),
    chamarChat('livia_list', { agente: 'livia' }).then((d) => { out.livia = (d.conversas || []).filter((c: any) => c.aguardando > 0 && c.modo !== 'humano').length; }, () => {}),
  ]);
  return out;
}

export const WhatsAppFlutuante: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [agente, setAgente] = useState<CxAgente>(() => { try { return (localStorage.getItem(CHAVE) as CxAgente) || 'sofia'; } catch { return 'sofia'; } });
  const [contagem, setContagem] = useState<Record<CxAgente, number>>({ sofia: 0, nando: 0, livia: 0 });
  const [fotos, setFotos] = useState<Partial<Record<CxAgente, string | null>>>({});
  const naPaginaDeConversa = /crm-evolution\/conversas/.test(location.pathname);

  useEffect(() => {
    let vivo = true;
    const ler = () => naoLidos().then((c) => vivo && setContagem(c));
    ler();
    const t = setInterval(ler, 45000);
    (supabase as any).from('evolution_instances').select('collaborator_name, instance_name, is_notifications, profile_picture_url').then(({ data }: any) => {
      if (!vivo) return;
      const f: Partial<Record<CxAgente, string | null>> = {};
      for (const r of data || []) {
        const n = `${r.collaborator_name} ${r.instance_name || ''}`;
        if (/sofia/i.test(n)) f.sofia = r.profile_picture_url; else if (/nando/i.test(n)) f.nando = r.profile_picture_url; else if (r.is_notifications || /l[ií]via/i.test(n)) f.livia = r.profile_picture_url;
      }
      setFotos(f);
    });
    return () => { vivo = false; clearInterval(t); };
  }, []);
  useEffect(() => { try { localStorage.setItem(CHAVE, agente); } catch { /* sem armazenamento */ } }, [agente]);
  useEffect(() => {
    if (!aberto) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [aberto]);

  if (naPaginaDeConversa) return null;
  const total = contagem.sofia + contagem.nando + contagem.livia;
  const tema = CX_TEMA[agente];

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? 'Fechar WhatsApp da equipe' : 'Abrir WhatsApp da equipe'}
        className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[#17181A]/90 text-white shadow-[0_18px_40px_-14px_rgba(0,0,0,0.6)] backdrop-blur-xl ring-1 ring-white/15 transition hover:scale-105 md:bottom-6 md:right-6"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {aberto ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!aberto && total > 0 && <span className="absolute -right-1 -top-1 grid h-6 min-w-[24px] place-items-center rounded-full bg-[#E8352B] px-1.5 text-[11px] font-extrabold ring-2 ring-[#F4F1EC]">{total > 99 ? '99+' : total}</span>}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[85]" role="dialog" aria-modal="true" aria-label="WhatsApp da equipe">
          <button type="button" aria-label="Fechar" onClick={() => setAberto(false)} className="absolute inset-0 bg-[#17181A]/35 backdrop-blur-[2px]" />
          <div className="absolute bottom-0 right-0 top-0 flex w-full max-w-[1040px] flex-col overflow-hidden bg-[#F4F1EC]/85 shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.55)] backdrop-blur-2xl ring-1 ring-white/50 md:bottom-3 md:right-3 md:top-3 md:rounded-[28px]">
            <div className="flex items-center gap-2 border-b border-black/[0.06] bg-white/55 px-3 py-2 md:px-4">
              <div className="inline-flex rounded-xl bg-black/[0.05] p-1" role="tablist">
                {(['sofia', 'nando', 'livia'] as CxAgente[]).map((a) => (
                  <button key={a} type="button" role="tab" aria-selected={agente === a} onClick={() => setAgente(a)}
                    className={`relative flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${agente === a ? 'bg-white shadow-sm' : 'text-[#5E5F63] hover:text-[#17181A]'}`}>
                    {fotos[a] ? <img src={fotos[a] || ''} alt="" className="h-6 w-6 rounded-full object-cover" /> : <span className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-extrabold text-white" style={{ background: CX_TEMA[a].cor }}>{NOME[a][0]}</span>}
                    <span style={agente === a ? { color: CX_TEMA[a].escura } : undefined}>{NOME[a]}</span>
                    {contagem[a] > 0 && <span className="grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-[10.5px] font-extrabold text-white" style={{ background: CX_TEMA[a].cor }}>{contagem[a]}</span>}
                  </button>
                ))}
              </div>
              <span className="ml-auto hidden text-[12px] font-semibold text-[#8A8B90] md:inline">WhatsApp da equipe · Esc fecha</span>
              <button type="button" title="Abrir em página inteira" onClick={() => { setAberto(false); navigate(`/super_admin/crm-evolution/conversas/${agente}`); }} className="grid h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05]"><Maximize2 className="h-4 w-4" /></button>
              <button type="button" aria-label="Fechar" onClick={() => setAberto(false)} className="grid h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05]"><X className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1" style={{ ['--cx-cor' as any]: tema.cor }}>
              <Suspense fallback={<div className="flex h-full items-center justify-center gap-2 text-sm text-[#6A6B70]"><Loader2 className="h-4 w-4 animate-spin" /> Abrindo…</div>}>
                {agente === 'sofia' && <SofiaChatPanel fotoAgente={fotos.sofia || null} />}
                {agente === 'nando' && <NandoChatPanel fotoAgente={fotos.nando || null} />}
                {agente === 'livia' && <LiviaChatPanel fotoAgente={fotos.livia || null} />}
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsAppFlutuante;
