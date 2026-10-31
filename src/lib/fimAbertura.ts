import { useEffect } from 'react';

/**
 * Painéis (admin e anunciante) só tiram a abertura do app quando o próprio layout já está na tela:
 * assim a marca voa direto até o logo do topo, sem uma segunda tela de carregamento no meio.
 * Se algo travar, o index.html tira a abertura sozinho em 9 s.
 */
export const ROTA_COM_LAYOUT = /^\/(super_admin|admin|anunciante)(\/|$)/i;

export function useFimAbertura() {
  useEffect(() => {
    // dois quadros: o topo já pintou e o logo já tem tamanho
    const id = requestAnimationFrame(() => requestAnimationFrame(() => (window as any).__exaSplashFim?.()));
    return () => cancelAnimationFrame(id);
  }, []);
}
