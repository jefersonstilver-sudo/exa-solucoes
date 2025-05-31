
// 🔧 MODIFICAÇÃO DE PERFORMANCE/SEGURANÇA
// Sistema de proteção anti-engenharia reversa

interface SecurityConfig {
  enableDevToolsDetection: boolean;
  enableRightClickProtection: boolean;
  enableTextSelectionProtection: boolean;
  enableKeyboardProtection: boolean;
  redirectOnDetection: boolean;
  warningMessage: string;
}

class SecurityManager {
  private config: SecurityConfig;
  private devToolsOpen = false;
  private checkInterval: number | null = null;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableDevToolsDetection: true,
      enableRightClickProtection: true,
      enableTextSelectionProtection: true,
      enableKeyboardProtection: true,
      redirectOnDetection: false,
      warningMessage: "Acesso não autorizado detectado",
      ...config,
    };
  }

  // Detectar se DevTools está aberto
  private detectDevTools(): boolean {
    const threshold = 160;
    
    // Método 1: Diferença de tamanho da janela
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    
    // Método 2: Detecção por console
    let consoleOpen = false;
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: () => {
        consoleOpen = true;
        return 'detected';
      }
    });
    
    // Trigger console detection
    console.dir(element);
    
    return heightDiff || widthDiff || consoleOpen;
  }

  // Bloquear botão direito
  private disableRightClick(): void {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    }, { passive: false });
  }

  // Bloquear seleção de texto
  private disableTextSelection(): void {
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    }, { passive: false });

    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    }, { passive: false });

    // CSS adicional para garantir
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      input, textarea, [contenteditable] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Bloquear teclas perigosas
  private disableKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, { passive: false });
  }

  // Obscurecer código fonte
  private obfuscateSourceAccess(): void {
    // Remover referências óbvias
    delete (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    
    // Mascarar console
    const noop = () => {};
    if (typeof window !== 'undefined' && window.console) {
      Object.keys(window.console).forEach(key => {
        if (typeof (window.console as any)[key] === 'function') {
          (window.console as any)[key] = noop;
        }
      });
    }
  }

  // Inicializar proteções
  public initialize(): void {
    // Só ativar em produção
    if (import.meta.env.DEV) {
      return;
    }

    try {
      if (this.config.enableRightClickProtection) {
        this.disableRightClick();
      }

      if (this.config.enableTextSelectionProtection) {
        this.disableTextSelection();
      }

      if (this.config.enableKeyboardProtection) {
        this.disableKeyboardShortcuts();
      }

      if (this.config.enableDevToolsDetection) {
        this.startDevToolsDetection();
      }

      this.obfuscateSourceAccess();
      
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      console.info = () => {};
      console.debug = () => {};
      
    } catch (error) {
      // Silenciar erros de segurança
    }
  }

  // Monitoramento contínuo de DevTools
  private startDevToolsDetection(): void {
    this.checkInterval = window.setInterval(() => {
      const isOpen = this.detectDevTools();
      
      if (isOpen && !this.devToolsOpen) {
        this.devToolsOpen = true;
        this.handleDevToolsDetection();
      } else if (!isOpen && this.devToolsOpen) {
        this.devToolsOpen = false;
      }
    }, 1000);
  }

  // Ação quando DevTools é detectado
  private handleDevToolsDetection(): void {
    if (this.config.redirectOnDetection) {
      window.location.href = '/';
    } else {
      // Apenas limpar a tela temporariamente
      document.body.style.display = 'none';
      setTimeout(() => {
        document.body.style.display = 'block';
      }, 2000);
    }
  }

  // Limpar recursos
  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Exportar instância singleton
export const securityManager = new SecurityManager();

// Função de inicialização
export const initializeSecurity = () => {
  securityManager.initialize();
};

// Auto-inicializar em produção
if (!import.meta.env.DEV && typeof window !== 'undefined') {
  // Aguardar DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSecurity);
  } else {
    initializeSecurity();
  }
}
