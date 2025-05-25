
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ValidationResult<T> {
  isValid: boolean;
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface ValidationOptions {
  required?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

export const useDataValidation = <T,>(
  data: T | undefined | null,
  validator?: (data: T) => boolean,
  options: ValidationOptions = {}
): ValidationResult<T> => {
  const {
    required = true,
    timeout = 5000,
    retryAttempts = 3
  } = options;

  const [state, setState] = useState<ValidationResult<T>>({
    isValid: false,
    data: null,
    error: null,
    isLoading: true
  });

  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const validateData = () => {
      console.log('🔍 [DATA VALIDATION] Validando dados:', { data, attempts });

      // Verificar se dados existem quando obrigatórios
      if (required && (!data || data === null || data === undefined)) {
        if (attempts < retryAttempts) {
          console.log(`⏳ [DATA VALIDATION] Tentativa ${attempts + 1}/${retryAttempts}`);
          setAttempts(prev => prev + 1);
          setTimeout(validateData, 1000 * (attempts + 1)); // Delay crescente
          return;
        }

        console.error('❌ [DATA VALIDATION] Dados obrigatórios ausentes após todas as tentativas');
        setState({
          isValid: false,
          data: null,
          error: 'Dados obrigatórios não encontrados',
          isLoading: false
        });
        return;
      }

      // Se dados não são obrigatórios e estão ausentes
      if (!required && (!data || data === null || data === undefined)) {
        setState({
          isValid: true,
          data: null,
          error: null,
          isLoading: false
        });
        return;
      }

      // Executar validação customizada se fornecida
      if (validator && data && !validator(data)) {
        console.error('❌ [DATA VALIDATION] Falha na validação customizada');
        setState({
          isValid: false,
          data: null,
          error: 'Dados inválidos',
          isLoading: false
        });
        return;
      }

      // Dados válidos
      console.log('✅ [DATA VALIDATION] Dados válidos');
      setState({
        isValid: true,
        data: data as T,
        error: null,
        isLoading: false
      });
    };

    setState(prev => ({ ...prev, isLoading: true }));
    
    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      if (state.isLoading) {
        console.error('⏰ [DATA VALIDATION] Timeout na validação');
        setState({
          isValid: false,
          data: null,
          error: 'Timeout na validação de dados',
          isLoading: false
        });
        toast.error('Timeout ao carregar dados');
      }
    }, timeout);

    validateData();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [data, attempts, required, timeout, retryAttempts, validator]);

  return state;
};
