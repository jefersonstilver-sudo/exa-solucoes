
export const getUserInfo = async (userId: string) => {
  try {
    console.log("👤 SISTEMA CORRIGIDO - Buscando dados do usuário:", userId);
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Buscar dados do usuário na tabela users
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("❌ Erro ao buscar usuário na tabela users:", error);
    }
    
    // Buscar dados adicionais do auth se necessário
    let authUser = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!authError && authData.user) {
        authUser = authData.user;
      }
    } catch (authError) {
      console.error("❌ Erro ao buscar dados auth:", authError);
    }
    
    const email = user?.email || authUser?.email || '';
    const fullName = authUser?.user_metadata?.full_name || 
                     authUser?.user_metadata?.name || 
                     email.split('@')[0] || 
                     'Cliente';
    
    const userInfo = {
      email: email,
      nome: fullName
    };
    
    console.log("✅ SISTEMA CORRIGIDO - Dados do usuário encontrados:", userInfo);
    return userInfo;
    
  } catch (error) {
    console.error("❌ SISTEMA CORRIGIDO - Erro ao buscar informações do usuário:", error);
    return null;
  }
};
