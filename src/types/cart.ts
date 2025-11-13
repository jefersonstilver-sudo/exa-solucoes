import { Panel } from '@/types/panel';

export interface CartItem {
  id: string; // ID único para o item no carrinho
  panel: Panel;
  duration: number; // em dias
  addedAt: number; // timestamp
  price: number; // preço calculado
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isAnimating: boolean;
  isNavigating: boolean;
  version: number; // para controle de versão
  lastSync: number; // timestamp da última sincronização
}

export interface CartSyncData {
  items: CartItem[];
  version: number;
  timestamp: number;
}
