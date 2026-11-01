/**
 * /conectar?c=123456 — o QR code da TV que ainda não tem local. Quem lê com o celular cai direto no
 * "conectar esta TV": equipe → Telas (adicionar, já no passo do código); cliente → Minhas telas.
 * Sem login: vai para o login e volta para cá.
 */
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TelaCarregando } from '@/components/loading/MarcaCarregando';

const EQUIPE = ['super_admin', 'admin', 'admin_marketing', 'admin_financeiro', 'diretora_operacoes', 'gestor_comercial'];

export default function ConectarTV() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isLoading, isLoggedIn, userProfile } = useAuth() as any;
  const codigo = (params.get('c') || '').replace(/\D/g, '').slice(0, 6);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(`/conectar?c=${codigo}`)}`, { replace: true });
      return;
    }
    if (!userProfile) return;
    const papel = String(userProfile.role || '');
    if (EQUIPE.includes(papel)) {
      const base = papel === 'super_admin' ? '/super_admin' : '/admin';
      navigate(`${base}/telas?adicionar=1&codigo=${codigo}`, { replace: true });
    } else {
      navigate(`/anunciante/telas?conectar=${codigo}`, { replace: true });
    }
  }, [isLoading, isLoggedIn, userProfile, codigo, navigate]);

  return <TelaCarregando tema="escuro" />;
}
