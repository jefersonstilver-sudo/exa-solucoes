
import { Panel } from '@/types/panel';

// Calculate base price for a panel
export const getPanelBasePrice = (panel: Panel): number => {
  // Base price calculation logic
  const building = panel.buildings;
  
  // If building has a set basePrice, use that
  if (building && building.basePrice) {
    return building.basePrice;
  }
  
  // Default base pricing tiers based on panel resolution
  const resolutionPricing = {
    '4K': 100,
    '2K': 80,
    'HD': 60,
    'SD': 40
  };
  
  // Get price based on resolution or default to 50
  const resolution = panel.resolucao || '4K';
  const basePrice = resolutionPricing[resolution as keyof typeof resolutionPricing] || 50;
  
  return basePrice;
};

// Calculate the final price considering duration
export const calculatePanelPrice = (basePrice: number, duration: number): number => {
  // Price calculation with duration
  return basePrice * duration;
};
