import { useCallback, useMemo } from 'react';
import { useSindicoFormStore } from './formStore';

/**
 * Detecta se o usuário começou a preencher o formulário em qualquer etapa.
 * Retorna também um helper para checar se há dados antes de navegar para fora.
 */
export function useExitGuard() {
  const predio = useSindicoFormStore((s) => s.predio);
  const sindico = useSindicoFormStore((s) => s.sindico);

  const formStarted = useMemo(() => {
    const p = predio || {};
    const s = sindico || {};
    return Boolean(
      p.nomePredio ||
        p.logradouro ||
        p.numero ||
        p.complemento ||
        p.bairro ||
        p.cidade ||
        p.uf ||
        p.cep ||
        (p.internetOps && p.internetOps.length > 0) ||
        p.tipoPredio ||
        p.permiteAirbnb !== undefined ||
        s.nomeCompleto ||
        s.cpf ||
        s.whatsappRaw ||
        s.email ||
        s.mandatoAte ||
        (s.fotos && s.fotos.length > 0)
    );
  }, [predio, sindico]);

  const shouldGuard = useCallback(() => formStarted, [formStarted]);

  return { formStarted, shouldGuard };
}
