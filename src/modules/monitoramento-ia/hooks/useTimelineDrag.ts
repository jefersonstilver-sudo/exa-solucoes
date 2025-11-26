import { useState, useRef, useEffect, RefObject } from 'react';

interface UseTimelineDragProps {
  containerRef: RefObject<HTMLDivElement>;
  onScrollToStart: () => void;
  onScrollToEnd: () => void;
}

export const useTimelineDrag = ({ 
  containerRef, 
  onScrollToStart,
  onScrollToEnd 
}: UseTimelineDragProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollCheckIntervalRef = useRef<number | null>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setScrollLeft(containerRef.current.scrollLeft);
    
    // Prevenir seleção de texto durante o drag
    e.preventDefault();
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const walk = (clientX - startX) * 2; // Velocidade do drag (multiplicador 2x)
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Verificar posição do scroll para disparar carregamento de dados
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      
      // Se chegou no início (arrastou para direita mostrando dia anterior)
      if (scrollLeft <= 50) {
        onScrollToStart();
      }
      
      // Se chegou no fim (arrastou para esquerda mostrando dias futuros - não aplicável aqui)
      if (scrollLeft + clientWidth >= scrollWidth - 50) {
        onScrollToEnd();
      }
    };

    const handleScroll = () => {
      checkScrollPosition();
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, onScrollToStart, onScrollToEnd]);

  return {
    isDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
};
