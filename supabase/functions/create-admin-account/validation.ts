import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface ValidationResult {
  data?: { 
    email: string; 
    adminType: string;
    nome?: string;
    cpf?: string;
    tipo_documento?: string;
  };
  error?: any;
  status?: number;
}

export const validateRequest = async (req: Request): Promise<ValidationResult> => {
  console.log('🔧 [VALIDATION] v4 - Dynamic role_types validation');
  try {
    const { email, adminType, nome, cpf, tipo_documento } = await req.json();
    const cleanAdminType = (adminType || '').trim();
    console.log('📦 [CREATE-ADMIN] Dados recebidos:', { email, adminType: cleanAdminType, nome, cpf: cpf ? '***' : undefined });

    // Validações básicas
    if (!email || !cleanAdminType) {
      return {
        error: { 
          error: 'Email e tipo de administrador são obrigatórios',
          code: 'MISSING_FIELDS' 
        },
        status: 400
      };
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        error: { 
          error: 'Email inválido',
          code: 'INVALID_EMAIL' 
        },
        status: 400
      };
    }

    // Buscar roles válidos do banco de dados
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: roleTypes, error: roleError } = await supabase
      .from('role_types')
      .select('key')
      .eq('is_active', true);

    if (roleError) {
      console.error('❌ [VALIDATION] Erro ao buscar role_types:', roleError);
      // Fallback para roles padrão se houver erro - incluindo roles operacionais
      const fallbackRoles = ['admin', 'admin_marketing', 'admin_financeiro', 'super_admin', 'client', 'painel', 'eletricista_', 'comercial', 'sindico', 'porteiro', 'tecnico', 'operacional'];
      if (!fallbackRoles.includes(cleanAdminType)) {
        return {
          error: { 
            error: 'Tipo de conta inválido',
            code: 'INVALID_ROLE',
            details: `Role recebido: "${cleanAdminType}". Tipos válidos: ${fallbackRoles.join(', ')}`
          },
          status: 400
        };
      }
    } else {
      // Validar contra roles do banco
      const validRoles = roleTypes?.map(r => r.key) || [];
      console.log('📋 [VALIDATION] Roles válidos do banco:', validRoles);
      console.log('📋 [VALIDATION] Role recebido (limpo):', cleanAdminType);
      
      if (!validRoles.includes(cleanAdminType)) {
        return {
          error: { 
            error: 'Tipo de conta inválido',
            code: 'INVALID_ROLE',
            details: `Role recebido: "${cleanAdminType}". Tipos válidos do banco: ${validRoles.join(', ')}`
          },
          status: 400
        };
      }
    }

    console.log('✅ [VALIDATION] Role validado com sucesso:', cleanAdminType);

    return { 
      data: { 
        email: email.trim(), 
        adminType: cleanAdminType,
        nome,
        cpf,
        tipo_documento 
      } 
    };
  } catch (error) {
    console.error('❌ [VALIDATION] Erro ao processar requisição:', error);
    return {
      error: { 
        error: 'Dados da requisição inválidos',
        code: 'INVALID_REQUEST' 
      },
      status: 400
    };
  }
};
