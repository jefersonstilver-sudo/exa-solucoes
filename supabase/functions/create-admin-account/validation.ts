
interface ValidationResult {
  data?: { email: string; adminType: string };
  error?: any;
  status?: number;
}

export const validateRequest = async (req: Request): Promise<ValidationResult> => {
  try {
    const { email, adminType } = await req.json();
    console.log('📦 [CREATE-ADMIN] Dados recebidos:', { email, adminType });

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
    const validRoles = ['admin', 'admin_marketing', 'super_admin'];
    if (!validRoles.includes(adminType)) {
      return {
        error: { 
          error: 'Tipo de administrador inválido',
          code: 'INVALID_ROLE' 
        },
        status: 400
      };
    }

    return { data: { email, adminType } };
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
