
import { useState, useEffect, useRef, useCallback } from 'react';
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
  enabled?: boolean; // Nova opção para controlar execução
}

export const useDataValidation = <T,>(
  data: T | undefined | null,
  validator?: (data: T) => boolean,
  options: ValidationOptions = {}
): ValidationResult<T> => {
  const {
    required = true,
    timeout = 5000,
    retryAttempts = 3,
    enabled = true // Default habilitado
  } = options;

  const [state, setState] = useState<ValidationResult<T>>({
    isValid: false,
    data: null,
    error: null,
    isLoading: enabled && required // Só loading se enabled e required
  });

  const attemptsRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const validationRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<T | undefined | null>();
  const isProcessingRef = useRef(false);

  // Debounce para evitar execução excessiva
  const debouncedValidate = useCallback(() => {
    if (isProcessingRef.current || !enabled) {
      return;
    }

    console.log('🔍 [DATA VALIDATION] Iniciando validação debounced:', { 
      enabled,
      required,
      hasData: !!data,
      attempts: attemptsRef.current 
    });

    isProcessingRef.current = true;

    const validateData = () => {
      // Se não está habilitado, retornar estado neutro
      if (!enabled) {
        setState({
          isValid: true,
          data: null,
          error: null,
          isLoading: false
        });
        isProcessingRef.current = false;
        return;
      }

      // Se dados não são obrigatórios e estão ausentes, considerar válido
      if (!required && (!data || data === null || data === undefined)) {
        console.log('✅ [DATA VALIDATION] Dados opcionais ausentes - considerando válido');
        setState({
          isValid: true,
          data: null,
          error: null,
          isLoading: false
        });
        isProcessingRef.current = false;
        return;
      }

      // Se dados são obrigatórios mas estão ausentes
      if (required && (!data || data === null || data === undefined)) {
        if (attemptsRef.current < retryAttempts) {
          console.log(`⏳ [DATA VALIDATION] Tentativa ${attemptsRef.current + 1}/${retryAttempts}`);
          attemptsRef.current++;
          
          // Delay crescente entre tentativas com limite
          const delay = Math.min(1000 * attemptsRef.current, 3000);
          validationRef.current = setTimeout(() => {
            isProcessingRef.current = false;
            validateData();
          }, delay);
          return;
        }

        console.error('❌ [DATA VALIDATION] Dados obrigatórios ausentes após todas as tentativas');
        setState({
          isValid: false,
          data: null,
          error: 'Dados obrigatórios não encontrados',
          isLoading: false
        });
        isProcessingRef.current = false;
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
        isProcessingRef.current = false;
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
      isProcessingRef.current = false;
    };

    // Executar validação com pequeno delay para debounce
    validationRef.current = setTimeout(validateData, 50);
  }, [data, required, retryAttempts, validator, enabled]);

  useEffect(() => {
    // Verificar se os dados mudaram realmente
    if (lastDataRef.current === data && enabled) {
      return;
    }
    lastDataRef.current = data;

    // Reset attempts quando dados mudam
    attemptsRef.current = 0;
    isProcessingRef.current = false;
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (validationRef.current) {
      clearTimeout(validationRef.current);
    }

    // Se não habilitado, definir estado neutro imediatamente
    if (!enabled) {
      setState({
        isValid: true,
        data: null,
        error: null,
        isLoading: false
      });
      return;
    }

    // Iniciar validação
    setState(prev => ({ ...prev, isLoading: required }));
    
    // Timeout de segurança apenas se required
    if (required) {
      timeoutRef.current = setTimeout(() => {
        console.error('⏰ [DATA VALIDATION] Timeout na validação');
        setState({
          isValid: false,
          data: null,
          error: 'Timeout na validação de dados',
          isLoading: false
        });
        isProcessingRef.current = false;
        toast.error('Timeout ao carregar dados');
      }, timeout);
    }

    // Executar validação debounced
    debouncedValidate();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (validationRef.current) {
        clearTimeout(validationRef.current);
      }
      isProcessingRef.current = false;
    };
  }, [data, required, timeout, retryAttempts, validator, enabled, debouncedValidate]);

  return state;
};
