/**
 * Utilitários de debug para facilitar troubleshooting
 */

/**
 * Habilita modo debug
 */
export const enableDebugMode = () => {
  localStorage.setItem('debug_mode', 'true');
  console.log('🐛 Debug mode ENABLED - Reload page to see debug button');
};

/**
 * Desabilita modo debug
 */
export const disableDebugMode = () => {
  localStorage.removeItem('debug_mode');
  console.log('🐛 Debug mode DISABLED - Reload page to hide debug button');
};

/**
 * Verifica se debug mode está ativo
 */
export const isDebugMode = () => {
  return localStorage.getItem('debug_mode') === 'true' || import.meta.env.DEV;
};

// Expor funções globalmente para facilitar acesso via console
if (typeof window !== 'undefined') {
  (window as any).enableDebugMode = enableDebugMode;
  (window as any).disableDebugMode = disableDebugMode;
  
  console.log(`
╔════════════════════════════════════════╗
║   🐛 DEBUG HELPERS DISPONÍVEIS        ║
╠════════════════════════════════════════╣
║ enableDebugMode()  - Ativa logs       ║
║ disableDebugMode() - Desativa logs    ║
║ videoLogger        - Sistema de logs  ║
╚════════════════════════════════════════╝
  `);
}

export default {
  enableDebugMode,
  disableDebugMode,
  isDebugMode
};
