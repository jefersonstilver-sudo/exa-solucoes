
import { Panel } from '@/types/panel';

export interface CartItem {
  panel: Panel;
  duration: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isAnimating: boolean;
  isNavigating: boolean;
}
