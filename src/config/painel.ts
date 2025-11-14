/**
 * Configurações específicas para painéis (telas de conteúdo)
 * Define domínios e URLs baseados no ambiente
 */

import { PRIMARY_DOMAIN } from './domain';

// Detecta se estamos em produção baseado no domínio
const isProduction = PRIMARY_DOMAIN.includes('examidia.com.br');

/**
 * Configuração de URLs para painéis
 */
export const PAINEL_CONFIG = {
  // Domínio base do sistema
  baseDomain: PRIMARY_DOMAIN,
  
  // URL do conteúdo que será exibido no painel
  contentUrl: isProduction 
    ? 'https://examidia.com.br/painel-content'
    : `${PRIMARY_DOMAIN}/painel-content`,
  
  // URL padrão de fallback caso o prédio não tenha URL específica
  defaultContentUrl: isProduction
    ? 'https://examidia.com.br'
    : PRIMARY_DOMAIN,
};

/**
 * Obtém a URL de conteúdo para um painel
 * @param customUrl URL customizada do prédio (opcional)
 */
export const getPainelContentUrl = (customUrl?: string | null): string => {
  if (customUrl) {
    return customUrl;
  }
  return PAINEL_CONFIG.contentUrl;
};
