import React, { useEffect, useState } from 'react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut, Clock, Eye } from 'lucide-react';

const fmt = (ms: number) => {
  if (ms < 0) ms = 0;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const useTelaGrande = () => {
  const q = '(min-width: 1024px)';
  const [g, setG] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setG(m.matches);
    m.addEventListener?.('change', f);
    return () => m.removeEventListener?.('change', f);
  }, []);
  return g;
};

/**
 * Aviso de "Acessar como cliente".
 * Computador: faixa vermelha fixa no topo.
 * Celular/app: pílula escura presa acima da barra de abas (sempre alcançável, fora do entalhe do iPhone),
 * com o nome do cliente, o tempo restante e o botão Sair.
 */
const ImpersonationTopBar: React.FC = () => {
  const { impersonation, isImpersonating, endSession } = useImpersonation();
  const [now, setNow] = useState(Date.now());
  const [saindo, setSaindo] = useState(false);
  const telaGrande = useTelaGrande();

  useEffect(() => {
    if (!isImpersonating) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isImpersonating]);

  if (!isImpersonating || !impersonation) return null;

  const remaining = new Date(impersonation.expires_at).getTime() - now;
  const target = impersonation.target_user;
  const targetLabel = target?.empresa_nome || target?.nome || target?.email || impersonation.target_user_id.slice(0, 8);
  const sair = () => { setSaindo(true); endSession('manual'); };

  if (!telaGrande) {
    return (
      <>
        {/* espaço no fim da página para a pílula não cobrir o último conteúdo */}
        <style>{'.exa-anunciante main>div::after{content:"";display:block;height:68px}'}</style>
        <div
          role="alert"
          style={{
            position: 'fixed', left: 10, right: 10, zIndex: 1000,
            bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 8px 8px 14px', borderRadius: 18,
            background: 'rgba(23,24,26,.94)', color: '#fff',
            boxShadow: '0 14px 34px -14px rgba(0,0,0,.6)',
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            fontFamily: 'Manrope, system-ui, sans-serif',
          }}
        >
          <Eye size={18} style={{ flex: 'none', color: '#FF8A80' }} />
          <div style={{ minWidth: 0, flex: 1, lineHeight: 1.2 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,.62)' }}>Vendo como cliente · {fmt(remaining)}</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{targetLabel}</div>
          </div>
          <button
            type="button"
            onClick={sair}
            disabled={saindo}
            style={{ flex: 'none', height: 40, padding: '0 16px', borderRadius: 12, border: 0, background: '#fff', color: '#9C1E1E', fontWeight: 800, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: saindo ? 0.7 : 1 }}
          >
            <LogOut size={16} /> {saindo ? 'Saindo…' : 'Sair'}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="h-12" aria-hidden />
      <div
        className="fixed top-0 inset-x-0 z-[1000] flex items-center justify-between gap-3 px-4 py-2 text-white shadow-lg"
        style={{ background: 'linear-gradient(90deg, #7D1818 0%, #C7141A 100%)' }}
        role="alert"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm font-semibold truncate">
            Modo Admin — visualizando como cliente <span className="font-bold">{targetLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-xs font-mono bg-black/20 rounded px-2 py-1">
            <Clock className="h-3.5 w-3.5" /> {fmt(remaining)}
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-[#7D1818] hover:bg-white/90 font-semibold"
            onClick={sair}
            disabled={saindo}
          >
            <LogOut className="h-4 w-4 mr-1" /> Sair do modo cliente
          </Button>
        </div>
      </div>
    </>
  );
};

export default ImpersonationTopBar;
