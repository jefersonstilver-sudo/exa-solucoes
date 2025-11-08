
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
  try {
    const { email, adminType, nome, cpf, tipo_documento } = await req.json();
    console.log('📦 [CREATE-ADMIN] Dados recebidos:', { email, adminType, nome, cpf: cpf ? '***' : undefined });

    // Validações básicas
    if (!email || !adminType) {
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

    // Validar tipo de admin
    const validRoles = ['admin', 'admin_marketing', 'admin_financeiro', 'super_admin'];
    if (!validRoles.includes(adminType)) {
      return {
        error: { 
          error: 'Tipo de administrador inválido',
          code: 'INVALID_ROLE',
          details: 'Tipos válidos: admin, admin_marketing, admin_financeiro, super_admin'
        },
        status: 400
      };
    }

    return { 
      data: { 
        email, 
        adminType,
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
