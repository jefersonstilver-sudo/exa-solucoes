
// Sistema de Integridade de Preços - Correção Completa

interface PriceCalculationInput {
  selectedPlan: number;
  cartItems: any[];
  couponDiscount?: number;
  couponValid?: boolean;
}

interface PriceValidationResult {
  isValid: boolean;
  calculatedPrice: number;
  issues: string[];
  correctedPrice?: number;
}

class PriceIntegrityManager {
  private static instance: PriceIntegrityManager;
  private calculationHistory: Map<string, number> = new Map();

  static getInstance(): PriceIntegrityManager {
    if (!PriceIntegrityManager.instance) {
      PriceIntegrityManager.instance = new PriceIntegrityManager();
    }
    return PriceIntegrityManager.instance;
  }

  // CORREÇÃO: Cálculo de preço com validação rigorosa
  calculateWithIntegrity(input: PriceCalculationInput): PriceValidationResult {
    const { selectedPlan, cartItems, couponDiscount = 0, couponValid = false } = input;
    
    console.log("🔍 [PriceIntegrity] INICIANDO CÁLCULO VALIDADO:", {
      selectedPlan,
      cartItemsCount: cartItems.length,
      couponDiscount,
      couponValid,
      timestamp: new Date().toISOString()
    });

    const issues: string[] = [];
    
    // Validação de entrada
    if (!selectedPlan || selectedPlan <= 0) {
      issues.push("Plano inválido");
    }
    
    if (!cartItems || cartItems.length === 0) {
      issues.push("Carrinho vazio");
    }

    // Cálculo base com validação
    let subtotal = 0;
    cartItems.forEach((item, index) => {
      const basePrice = item.panel?.buildings?.preco_base || 0;
      
      if (basePrice <= 0) {
        issues.push(`Item ${index}: preço base inválido (${basePrice})`);
      }
      
      subtotal += basePrice;
      
      console.log(`🔍 [PriceIntegrity] Item ${index}:`, {
        panelId: item.panel?.id,
        buildingName: item.panel?.buildings?.nome,
        basePrice,
        subtotalAtual: subtotal
      });
    });

    // Aplicar multiplicador do plano
    const planMultiplier = selectedPlan;
    let totalWithPlan = subtotal * planMultiplier;
    
    console.log("🔍 [PriceIntegrity] APÓS MULTIPLICADOR DO PLANO:", {
      subtotal,
      planMultiplier,
      totalWithPlan
    });

    // Aplicar desconto se válido
    let finalPrice = totalWithPlan;
    if (couponValid && couponDiscount > 0) {
      const discountAmount = (totalWithPlan * couponDiscount) / 100;
      finalPrice = totalWithPlan - discountAmount;
      
      console.log("🔍 [PriceIntegrity] DESCONTO APLICADO:", {
        totalWithPlan,
        couponDiscount,
        discountAmount,
        finalPrice
      });
    }

    // Arredondar para 2 casas decimais
    finalPrice = Math.round(finalPrice * 100) / 100;

    // Validações finais
    if (finalPrice <= 0) {
      issues.push("Preço final inválido (zero ou negativo)");
    }

    if (finalPrice < 0.01) {
      issues.push("Preço final muito baixo (suspeito de erro de cálculo)");
    }

    // Detectar possível divisão por erro
    if (finalPrice < 1 && totalWithPlan > finalPrice * 10) {
      issues.push("Possível erro de divisão detectado");
    }

    const result: PriceValidationResult = {
      isValid: issues.length === 0,
      calculatedPrice: finalPrice,
      issues,
      correctedPrice: issues.length > 0 ? totalWithPlan : undefined
    };

    console.log("🔍 [PriceIntegrity] RESULTADO FINAL:", result);

    // Registrar no histórico para auditoria
    const key = `${selectedPlan}-${cartItems.length}-${Date.now()}`;
    this.calculationHistory.set(key, finalPrice);

    return result;
  }

  // Sistema de cache para evitar recálculos desnecessários
  getCachedPrice(key: string): number | null {
    return this.calculationHistory.get(key) || null;
  }

  // Limpar histórico quando necessário
  clearHistory(): void {
    this.calculationHistory.clear();
  }

  // Detectar inconsistências entre cálculos
  detectInconsistencies(): string[] {
    const prices = Array.from(this.calculationHistory.values());
    const uniquePrices = [...new Set(prices)];
    
    if (uniquePrices.length > 1 && prices.length > 1) {
      return [`Inconsistência detectada: ${uniquePrices.length} preços diferentes para cálculos similares`];
    }
    
    return [];
  }
}

export const priceIntegrityManager = PriceIntegrityManager.getInstance();

// Função helper para usar em toda a aplicação
export const calculatePriceWithIntegrity = (input: PriceCalculationInput): number => {
  const result = priceIntegrityManager.calculateWithIntegrity(input);
  
  if (!result.isValid) {
    console.error("❌ [PriceIntegrity] PROBLEMAS DETECTADOS:", result.issues);
    
    // Em produção, poderíamos enviar alerta
    if (process.env.NODE_ENV === 'production') {
      // Enviar alerta para sistema de monitoramento
    }
    
    // Retornar preço corrigido se disponível
    return result.correctedPrice || result.calculatedPrice;
  }
  
  return result.calculatedPrice;
};
