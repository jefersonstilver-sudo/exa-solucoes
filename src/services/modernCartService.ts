
import { CartItem, CartSyncData } from '@/types/cart';
import { Panel } from '@/types/panel';

export const MODERN_CART_KEY = 'indexa_modern_cart';
export const CART_VERSION_KEY = 'indexa_cart_version';

class ModernCartService {
  private static instance: ModernCartService;
  private currentVersion: number = 1;
  private subscribers: Array<(items: CartItem[]) => void> = [];

  static getInstance(): ModernCartService {
    if (!ModernCartService.instance) {
      ModernCartService.instance = new ModernCartService();
    }
    return ModernCartService.instance;
  }

  private constructor() {
    this.loadVersion();
    // Escutar mudanças no localStorage de outras abas
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  private loadVersion(): void {
    const savedVersion = localStorage.getItem(CART_VERSION_KEY);
    this.currentVersion = savedVersion ? parseInt(savedVersion, 10) : 1;
  }

  private saveVersion(): void {
    localStorage.setItem(CART_VERSION_KEY, this.currentVersion.toString());
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key === MODERN_CART_KEY) {
      const items = this.loadCart();
      this.notifySubscribers(items);
    }
  }

  subscribe(callback: (items: CartItem[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(items: CartItem[]): void {
    this.subscribers.forEach(callback => callback(items));
  }

  generateItemId(panel: Panel): string {
    return `cart_${panel.id}_${Date.now()}`;
  }

  createCartItem(panel: Panel, duration: number = 30): CartItem {
    return {
      id: this.generateItemId(panel),
      panel,
      duration,
      addedAt: Date.now()
      // REMOVIDO: price - será calculado dinamicamente quando necessário
    };
  }

  loadCart(): CartItem[] {
    try {
      const savedData = localStorage.getItem(MODERN_CART_KEY);
      if (!savedData) return [];

      const parsedData: CartSyncData = JSON.parse(savedData);
      
      // Validar estrutura
      if (!parsedData.items || !Array.isArray(parsedData.items)) {
        console.warn('ModernCartService: Estrutura inválida do carrinho, resetando');
        this.clearCart();
        return [];
      }

      // Validar e limpar itens órfãos
      const validItems = parsedData.items.filter(item => {
        return item &&
               item.id &&
               item.panel &&
               item.panel.id &&
               typeof item.duration === 'number' &&
               typeof item.addedAt === 'number';
        // REMOVIDO: validação de price
      });

      if (validItems.length !== parsedData.items.length) {
        console.warn(`ModernCartService: ${parsedData.items.length - validItems.length} itens órfãos removidos`);
        this.saveCart(validItems);
      }

      return validItems;
    } catch (error) {
      console.error('ModernCartService: Erro ao carregar carrinho', error);
      this.clearCart();
      return [];
    }
  }

  saveCart(items: CartItem[]): boolean {
    try {
      this.currentVersion++;
      
      const syncData: CartSyncData = {
        items,
        version: this.currentVersion,
        timestamp: Date.now()
      };

      localStorage.setItem(MODERN_CART_KEY, JSON.stringify(syncData));
      this.saveVersion();
      
      console.log(`ModernCartService: Carrinho salvo - ${items.length} itens, versão ${this.currentVersion}`);
      return true;
    } catch (error) {
      console.error('ModernCartService: Erro ao salvar carrinho', error);
      return false;
    }
  }

  addItem(panel: Panel, duration: number = 30): CartItem[] {
    const items = this.loadCart();
    
    // Verificar se já existe
    const existingIndex = items.findIndex(item => item.panel.id === panel.id);
    
    if (existingIndex >= 0) {
      // Atualizar item existente
      items[existingIndex] = {
        ...items[existingIndex],
        duration,
        addedAt: Date.now() // Atualizar timestamp
        // REMOVIDO: price - não é mais calculado aqui
      };
    } else {
      // Adicionar novo item
      const newItem = this.createCartItem(panel, duration);
      items.push(newItem);
    }

    this.saveCart(items);
    this.notifySubscribers(items);
    return items;
  }

  removeItem(panelId: string): CartItem[] {
    const items = this.loadCart();
    const filteredItems = items.filter(item => item.panel.id !== panelId);
    
    this.saveCart(filteredItems);
    this.notifySubscribers(filteredItems);
    return filteredItems;
  }

  updateItemDuration(panelId: string, duration: number): CartItem[] {
    const items = this.loadCart();
    const updatedItems = items.map(item => {
      if (item.panel.id === panelId) {
        return {
          ...item,
          duration
          // REMOVIDO: price - não é mais calculado aqui
        };
      }
      return item;
    });

    this.saveCart(updatedItems);
    this.notifySubscribers(updatedItems);
    return updatedItems;
  }

  clearCart(): CartItem[] {
    localStorage.removeItem(MODERN_CART_KEY);
    this.currentVersion++;
    this.saveVersion();
    
    this.notifySubscribers([]);
    return [];
  }

  getItemCount(): number {
    return this.loadCart().length;
  }

  // REMOVIDO: getTotalPrice - deve ser calculado externamente com plano selecionado

  // Debug e analytics
  getCartAnalytics() {
    const items = this.loadCart();
    return {
      itemCount: items.length,
      // REMOVIDO: totalPrice - deve ser calculado externamente
      averageDuration: items.length > 0 ? items.reduce((sum, item) => sum + item.duration, 0) / items.length : 0,
      oldestItem: items.length > 0 ? Math.min(...items.map(item => item.addedAt)) : null,
      version: this.currentVersion
    };
  }
}

export const modernCartService = ModernCartService.getInstance();
