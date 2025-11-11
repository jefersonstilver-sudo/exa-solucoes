import { useEffect, useRef, useCallback } from 'react';

interface VideoProtectionOptions {
  preventDownload?: boolean;
  preventPrint?: boolean;
  preventDevTools?: boolean;
  preventScreenCapture?: boolean;
}

export const useVideoProtection = (options: VideoProtectionOptions = {}) => {
  const {
    preventDownload = true,
    preventPrint = true,
    preventDevTools = true,
    preventScreenCapture = true
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);

  // Prevenir context menu (botão direito) - MÁXIMA PRIORIDADE
  const preventContextMenu = useCallback((e: MouseEvent | Event) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }, []);

  // Prevenir mouse direito em QUALQUER lugar
  const preventRightClick = useCallback((e: MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }, []);

  // Prevenir teclas de atalho perigosas
  const preventKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    // Ctrl/Cmd + S (Salvar)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl/Cmd + P (Imprimir)
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      return false;
    }

    // Ctrl/Cmd + Shift + I (DevTools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }

    // F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Ctrl/Cmd + U (Ver código fonte)
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      return false;
    }

    // PrtScn (Print Screen)
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      // Limpar clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText('');
      }
      return false;
    }

    return true;
  }, []);

  // Detectar e prevenir abertura de DevTools
  const detectDevTools = useCallback(() => {
    if (!preventDevTools) return;

    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      // DevTools detectado - apenas proteção visual (SEM pausar)
      if (containerRef.current) {
        const videos = containerRef.current.querySelectorAll('video');
        videos.forEach(video => {
          video.style.filter = 'blur(50px)';
          // ✅ REMOVIDO: video.pause() - não interferir na reprodução
        });
      }
    }
  }, [preventDevTools]);

  // Prevenir drag and drop de vídeos
  const preventDragDrop = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  // Prevenir print
  const preventPrintScreen = useCallback(() => {
    if (!preventPrint) return;

    window.addEventListener('beforeprint', (e) => {
      e.preventDefault();
      if (containerRef.current) {
        const videos = containerRef.current.querySelectorAll('video');
        videos.forEach(video => {
          video.style.display = 'none';
        });
      }
    });

    window.addEventListener('afterprint', () => {
      if (containerRef.current) {
        const videos = containerRef.current.querySelectorAll('video');
        videos.forEach(video => {
          video.style.display = 'block';
        });
      }
    });
  }, [preventPrint]);

  // Detectar tentativas de captura de tela
  const detectScreenCapture = useCallback(() => {
    if (!preventScreenCapture) return;

    // Detectar quando a página perde foco (possível captura) - apenas visual
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && containerRef.current) {
        const videos = containerRef.current.querySelectorAll('video');
        videos.forEach(video => {
          // ✅ REMOVIDO: video.pause() - manter reprodução contínua
          video.style.filter = 'blur(50px)'; // Apenas proteção visual
        });
      }
    });

    // Detectar blur (possível captura com outra janela) - apenas visual
    window.addEventListener('blur', () => {
      if (containerRef.current) {
        const videos = containerRef.current.querySelectorAll('video');
        videos.forEach(video => {
          // ✅ REMOVIDO: video.pause() - manter reprodução contínua
          video.style.filter = 'blur(50px)'; // Apenas proteção visual
        });
      }
    });
  }, [preventScreenCapture]);

  // Adicionar overlay invisível sobre vídeos para prevenir extensões
  const addProtectionOverlay = useCallback(() => {
    if (!containerRef.current) return;

    const videos = containerRef.current.querySelectorAll('video');
    videos.forEach((video) => {
      // Desabilitar atributos que facilitam download
      video.removeAttribute('controls');
      video.setAttribute('controlsList', 'nodownload noplaybackrate nofullscreen');
      video.setAttribute('disablePictureInPicture', 'true');
      video.setAttribute('disableRemotePlayback', 'true');
      
      // Prevenir TODOS os eventos do mouse no vídeo
      video.style.pointerEvents = 'none';
      video.style.userSelect = 'none';
      video.style.webkitUserSelect = 'none';
      (video.style as any).msUserSelect = 'none';
      (video.style as any).mozUserSelect = 'none';

      // Adicionar overlay invisível
      const parent = video.parentElement;
      if (parent && !parent.querySelector('.video-protection-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'video-protection-overlay';
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 999999;
          background: transparent;
          pointer-events: auto;
          cursor: default;
        `;
        
        // Prevenir TUDO no overlay
        overlay.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }, { capture: true });
        
        overlay.addEventListener('mousedown', (e) => {
          if (e.button === 2) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }
        }, { capture: true });
        
        parent.style.position = 'relative';
        parent.appendChild(overlay);
      }
    });
  }, []);

  // Desabilitar todas as formas de inspeção
  const disableInspection = useCallback(() => {
    // Desabilitar seleção de texto
    if (containerRef.current) {
      containerRef.current.style.userSelect = 'none';
      containerRef.current.style.webkitUserSelect = 'none';
      (containerRef.current.style as any).msUserSelect = 'none';
      (containerRef.current.style as any).mozUserSelect = 'none';
    }

    // Prevenir arrastar imagens/vídeos
    document.addEventListener('dragstart', preventDragDrop, { capture: true });
    document.addEventListener('drop', preventDragDrop, { capture: true });
    
    // Adicionar CSS global para bloquear contexto
    const styleId = 'video-protection-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        video {
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          -ms-user-select: none !important;
          -moz-user-select: none !important;
        }
        video::cue {
          pointer-events: none !important;
        }
        video::-webkit-media-controls {
          display: none !important;
        }
        video::-webkit-media-controls-enclosure {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, [preventDragDrop]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Aplicar todas as proteções com MÁXIMA PRIORIDADE
    if (preventDownload) {
      // Context menu com capture phase
      container.addEventListener('contextmenu', preventContextMenu, { capture: true });
      document.addEventListener('contextmenu', preventContextMenu, { capture: true });
      
      // Mouse events com capture phase
      container.addEventListener('mousedown', preventRightClick as any, { capture: true });
      document.addEventListener('mousedown', preventRightClick as any, { capture: true });
      
      // Keyboard shortcuts
      document.addEventListener('keydown', preventKeyboardShortcuts, { capture: true });
      
      addProtectionOverlay();
      disableInspection();
    }

    if (preventPrint) {
      preventPrintScreen();
    }

    if (preventDevTools) {
      const devToolsInterval = setInterval(detectDevTools, 1000);
      
      return () => {
        clearInterval(devToolsInterval);
      };
    }

    if (preventScreenCapture) {
      detectScreenCapture();
    }

    // Cleanup
    return () => {
      container.removeEventListener('contextmenu', preventContextMenu as any, { capture: true } as any);
      document.removeEventListener('contextmenu', preventContextMenu as any, { capture: true } as any);
      container.removeEventListener('mousedown', preventRightClick as any, { capture: true } as any);
      document.removeEventListener('mousedown', preventRightClick as any, { capture: true } as any);
      document.removeEventListener('keydown', preventKeyboardShortcuts as any, { capture: true } as any);
      document.removeEventListener('dragstart', preventDragDrop);
      document.removeEventListener('drop', preventDragDrop);
    };
  }, [
    preventDownload,
    preventPrint,
    preventDevTools,
    preventScreenCapture,
    preventContextMenu,
    preventRightClick,
    preventKeyboardShortcuts,
    preventDragDrop,
    addProtectionOverlay,
    disableInspection,
    detectDevTools,
    detectScreenCapture,
    preventPrintScreen
  ]);

  return { containerRef };
};
