/**
 * Utility functions for intelligent card positioning
 * Prevents HoverCard cutoff by choosing optimal side based on viewport position
 */

export type CardSide = 'top' | 'right' | 'bottom' | 'left';

interface ViewportPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates the best side for HoverCard placement based on element position
 * @param element - The trigger element (pin)
 * @param cardWidth - Expected width of the card (default: 320px)
 * @param cardHeight - Expected height of the card (default: 400px)
 * @returns Optimal side for card placement
 */
export const getOptimalCardSide = (
  element: HTMLElement,
  cardWidth = 320,
  cardHeight = 400
): CardSide => {
  const rect = element.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  // Calculate distances from edges
  const distanceFromTop = rect.top;
  const distanceFromBottom = viewport.height - rect.bottom;
  const distanceFromLeft = rect.left;
  const distanceFromRight = viewport.width - rect.right;

  // Check if there's enough space for each direction
  const spaceTop = distanceFromTop >= cardHeight + 20; // 20px buffer
  const spaceBottom = distanceFromBottom >= cardHeight + 20;
  const spaceLeft = distanceFromLeft >= cardWidth + 20;
  const spaceRight = distanceFromRight >= cardWidth + 20;

  // Priority order based on UX best practices:
  // 1. Top (most common for map pins)
  // 2. Bottom 
  // 3. Right
  // 4. Left

  if (spaceTop) return 'top';
  if (spaceBottom) return 'bottom';
  if (spaceRight) return 'right';
  if (spaceLeft) return 'left';

  // Fallback: choose the side with most space
  const maxDistance = Math.max(
    distanceFromTop,
    distanceFromBottom,
    distanceFromLeft,
    distanceFromRight
  );

  if (maxDistance === distanceFromTop) return 'top';
  if (maxDistance === distanceFromBottom) return 'bottom';
  if (maxDistance === distanceFromRight) return 'right';
  return 'left';
};

/**
 * Get dynamic side offset based on screen size
 */
export const getDynamicSideOffset = (): number => {
  const isMobile = window.innerWidth < 768;
  return isMobile ? 8 : 12;
};