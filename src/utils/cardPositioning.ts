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
  cardHeight = 280
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

  // Check if there's enough space for each direction with larger buffer
  const buffer = 30; // Increased buffer
  const spaceTop = distanceFromTop >= cardHeight + buffer;
  const spaceBottom = distanceFromBottom >= cardHeight + buffer;
  const spaceLeft = distanceFromLeft >= cardWidth + buffer;
  const spaceRight = distanceFromRight >= cardWidth + buffer;

  // Determine position based on viewport thirds
  const isInTopThird = rect.top < viewport.height / 3;
  const isInBottomThird = rect.bottom > (viewport.height * 2) / 3;
  const isInLeftThird = rect.left < viewport.width / 3;
  const isInRightThird = rect.right > (viewport.width * 2) / 3;

  // Priority-based positioning to avoid cutoffs
  if (isInTopThird && spaceBottom) return 'bottom';
  if (isInBottomThird && spaceTop) return 'top';
  if (isInLeftThird && spaceRight) return 'right';
  if (isInRightThird && spaceLeft) return 'left';

  // Fallback: use best available space
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