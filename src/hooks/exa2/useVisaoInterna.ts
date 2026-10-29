import { useAuth } from '@/hooks/useAuth';

/**
 * true quando quem está olhando é da equipe EXA (admin acessando a área do cliente).
 * Detalhes técnicos de entrega (confirmação por prédio, fila da tela) só aparecem para a equipe —
 * o cliente vê o resultado, não a engrenagem.
 */
const INTERNOS = ['super_admin', 'admin', 'admin_marketing', 'admin_financeiro', 'comercial'];
export const useVisaoInterna = () => {
  const { userProfile } = useAuth();
  return INTERNOS.includes(String((userProfile as any)?.role || ''));
};
