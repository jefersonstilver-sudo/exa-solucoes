import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Botão da Sofia (voz) LEVE: o SDK de voz (ElevenLabs + LiveKit, ~1 MB) só é baixado quando o CEO toca no botão.
 * Antes ele era carregado em todas as páginas do painel.
 */
const SofiaVozCompleta = lazy(() => import('./SofiaVozCompleta'));
const ROTAS_SEM_BOTAO = ['tarefas/fullscreen', '/tarefas'];

export const SofiaLauncher: React.FC = () => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const [ativa, setAtiva] = useState<boolean | null>(null);
  const [carregar, setCarregar] = useState(false);
  const isSuperAdmin = userProfile?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) return;
    let vivo = true;
    supabase.from('configuracoes_adicionais').select('sofia_ativa').limit(1).single()
      .then(({ data }) => { if (vivo) setAtiva(data?.sofia_ativa ?? true); });
    return () => { vivo = false; };
  }, [isSuperAdmin]);

  if (!isSuperAdmin || ativa !== true) return null;
  if (ROTAS_SEM_BOTAO.some((r) => location.pathname.includes(r))) return null;

  if (carregar) {
    return (
      <Suspense fallback={<BotaoSofia carregando />}>
        <SofiaVozCompleta />
      </Suspense>
    );
  }
  return <BotaoSofia onClick={() => setCarregar(true)} />;
};

const BotaoSofia = ({ onClick, carregando }: { onClick?: () => void; carregando?: boolean }) => (
  <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 md:bottom-6 md:right-6">
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      aria-label="Falar com a Sofia"
      title="Falar com a Sofia"
      className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-transform hover:scale-105 disabled:opacity-80"
      style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
    >
      {carregando
        ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
        : <Phone className="h-6 w-6" />}
    </button>
  </div>
);

export default SofiaLauncher;
