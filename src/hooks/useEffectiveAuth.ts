import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import type { UserProfile } from '@/types/userTypes';

/**
 * Drop-in replacement for `useAuth()` to be used inside the advertiser portal
 * (any page mounted under /anunciante). When an impersonation session is
 * active, `userProfile` and `user` are replaced by the **target client**'s
 * data so all queries `.eq('client_id', userProfile.id)` return the client's
 * data instead of the super_admin's.
 *
 * The underlying Supabase auth session is NOT changed — RLS still sees the
 * super_admin's auth.uid(), which keeps admin-only edge functions working.
 *
 * Pages outside /anunciante should continue using `useAuth()` directly.
 */
export const useEffectiveAuth = () => {
  const auth = useAuth();
  const { isImpersonating, effectiveUserProfile } = useImpersonation();

  return useMemo(() => {
    if (!isImpersonating || !effectiveUserProfile) {
      return { ...auth, isImpersonating: false } as const;
    }

    const target = effectiveUserProfile as any;
    // Map DB row -> UserProfile shape used across the app.
    const userProfile = {
      id: target.id,
      email: target.email ?? '',
      name: target.nome ?? target.name ?? undefined,
      nome: target.nome ?? undefined,
      documento: target.documento ?? target.cnpj ?? target.cpf ?? undefined,
      telefone: target.telefone ?? undefined,
      avatar_url: target.avatar_url ?? undefined,
      role: (target.role as any) ?? 'client',
      data_criacao: target.data_criacao ?? target.created_at ?? undefined,
      empresa_nome: target.empresa_nome ?? undefined,
      empresa_pais: target.empresa_pais ?? undefined,
      empresa_documento: target.empresa_documento ?? undefined,
      empresa_segmento: target.empresa_segmento ?? undefined,
      empresa_aceite_termo: target.empresa_aceite_termo ?? undefined,
    } as UserProfile & Record<string, any>;

    // Fake a `user` shape so code that reads `user.id` still works.
    const fakeUser = {
      ...(auth.user || {}),
      id: target.id,
      email: target.email ?? '',
    } as typeof auth.user;

    return {
      ...auth,
      user: fakeUser,
      userProfile,
      isLoggedIn: true,
      // Force false so super_admin redirects in advertiser pages don't kick us out.
      isSuperAdmin: false,
      isAdmin: false,
      isImpersonating: true,
    } as const;
  }, [auth, isImpersonating, effectiveUserProfile]);
};

export default useEffectiveAuth;
