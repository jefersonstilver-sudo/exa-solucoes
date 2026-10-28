import React from 'react';
import { TelaCarregando, temaDaRota } from './MarcaCarregando';

interface GlobalLoadingPageProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

/**
 * Tela de carregamento com a marca EXA animada (layout novo). Versão clara por padrão;
 * escura nas telas de acesso (login, criar senha). Aparece com 200 ms de atraso.
 * O texto genérico "Carregando..." não aparece — a marca já mostra que está carregando.
 */
const GENERICAS = /^\s*carregando\s*(\.\.\.|…)?\s*$/i;

const GlobalLoadingPage: React.FC<GlobalLoadingPageProps> = ({ message, showProgress = false, progress = 0 }) => {
  const tema = typeof window !== 'undefined' ? temaDaRota(window.location.pathname) : 'claro';
  const msg = message && !GENERICAS.test(message) ? message : undefined;
  return <TelaCarregando tema={tema} mensagem={msg} progresso={showProgress ? progress : null} />;
};

export default GlobalLoadingPage;
