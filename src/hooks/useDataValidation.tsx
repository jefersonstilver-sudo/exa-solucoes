
import { useState, useEffect, useRef } from 'react';
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

  const attemptsRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const validationRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Reset attempts when data changes
    attemptsRef.current = 0;
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (validationRef.current) {
      clearTimeout(validationRef.current);
    }

    const validateData = () => {
      console.log('🔍 [DATA VALIDATION] Validando dados:', { 
        data: data ? 'presente' : 'ausente', 
        attempts: attemptsRef.current,
        required 
      });

      // Se dados não são obrigatórios e estão ausentes, considerar válido
      if (!required && (!data || data === null || data === undefined)) {
        console.log('✅ [DATA VALIDATION] Dados opcionais ausentes - considerando válido');
        setState({
          isValid: true,
          data: null,
          error: null,
          isLoading: false
        });
        return;
      }

      // Se dados são obrigatórios mas estão ausentes
      if (required && (!data || data === null || data === undefined)) {
        if (attemptsRef.current < retryAttempts) {
          console.log(`⏳ [DATA VALIDATION] Tentativa ${attemptsRef.current + 1}/${retryAttempts}`);
          attemptsRef.current++;
          
          // Delay crescente entre tentativas
          validationRef.current = setTimeout(validateData, 1000 * attemptsRef.current);
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

    // Iniciar validação
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Timeout de segurança
    timeoutRef.current = setTimeout(() => {
      console.error('⏰ [DATA VALIDATION] Timeout na validação');
      setState({
        isValid: false,
        data: null,
        error: 'Timeout na validação de dados',
        isLoading: false
      });
      if (!required) {
        // Para dados opcionais, não mostrar toast de erro
        return;
      }
      toast.error('Timeout ao carregar dados');
    }, timeout);

    // Executar validação com pequeno delay para evitar execução excessiva
    validationRef.current = setTimeout(validateData, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (validationRef.current) {
        clearTimeout(validationRef.current);
      }
    };
  }, [data, required, timeout, retryAttempts, validator]);

  return state;
};
