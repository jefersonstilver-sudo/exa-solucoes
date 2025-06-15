
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, CreditCard, Tag, CheckCircle, TrendingDown } from 'lucide-react';
import { useCartManager } from '@/hooks/useCartManager';
import { useCouponValidator } from '@/hooks/useCouponValidator';
import { formatCurrency } from '@/utils/formatters';
import { calculateTotalPrice, calculateCartSubtotal } from '@/utils/checkoutUtils';
import { logPriceCalculation } from '@/utils/auditLogger';

const ReviewStep = () => {
  const { cartItems, selectedPlan } = useCartManager();
  const { couponValid, couponDiscount, couponCode } = useCouponValidator();

  if (!selectedPlan || cartItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Dados incompletos para revisão</p>
      </div>
    );
  }

  // Cálculos usando funções centralizadas
  const subtotal = calculateCartSubtotal(cartItems);
  const subtotalWithPlan = subtotal * selectedPlan;
  const finalPrice = calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
  
  // CORREÇÃO: Calcular desconto do plano anual (não cupom)
  const planDiscount = selectedPlan === 12 ? subtotalWithPlan - finalPrice : 0;
  const discountPercentage = selectedPlan === 12 ? 37.5 : 0; // 37.5% de desconto no plano anual

  // Log detalhado para auditoria
  console.log("📋 [ReviewStep] PREÇOS CORRIGIDOS:", {
    component: "ReviewStep",
    cartItemsCount: cartItems.length,
    selectedPlan,
    subtotal,
    subtotalWithPlan,
    finalPrice,
    planDiscount,
    discountPercentage,
    couponValid,
    couponDiscount
  });

  // Log para auditoria
  logPriceCalculation('ReviewStep', {
    selectedPlan,
    cartItemsCount: cartItems.length,
    subtotal,
    finalPrice,
    planDiscount,
    couponValid,
    couponDiscount
  });

  const getStartDate = () => new Date();
  const getEndDate = () => {
    const end = new Date();
    end.setMonth(end.getMonth() + selectedPlan);
    return end;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <CheckCircle className="mr-3 h-6 w-6 text-green-500" />
          Revisão do Pedido
        </h2>
        <p className="text-gray-600">Confirme os detalhes do seu pedido antes de prosseguir</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Detalhes do Pedido */}
        <div className="lg:col-span-2 space-y-6">
          {/* Painéis Selecionados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-lg p-4"
          >
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-[#3C1361]" />
              Painéis Selecionados ({cartItems.length})
            </h3>
            <p className="text-sm text-gray-600 mb-4">Painéis que serão utilizados em sua campanha</p>
            
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.panel.buildings?.nome || 'Painel sem nome'}
                      </h4>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>
                          {item.panel.buildings?.bairro}, {item.panel.buildings?.cidade}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(item.panel.buildings?.preco_base || 0)}/mês
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Duração da Campanha */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-50 rounded-lg p-4"
          >
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-[#3C1361]" />
              Duração da Campanha
            </h3>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Plano Selecionado</div>
                  <div className="font-semibold text-gray-900">
                    {selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Data de Início</div>
                  <div className="font-semibold text-gray-900">{formatDate(getStartDate())}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Data de Término</div>
                  <div className="font-semibold text-gray-900">{formatDate(getEndDate())}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cupom Aplicado */}
          {couponValid && couponCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50 rounded-lg p-4 border border-green-200"
            >
              <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                <Tag className="mr-2 h-5 w-5 text-green-600" />
                Cupom de Desconto Aplicado
              </h3>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-green-800">Código: {couponCode}</div>
                    <div className="text-sm text-green-600">Desconto de {couponDiscount}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      -{formatCurrency(couponDiscount ? subtotalWithPlan * (couponDiscount / 100) : 0)}
                    </div>
                    <div className="text-xs text-green-500">Economia garantida!</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Coluna Direita - Resumo de Preços CORRIGIDO */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-[#3C1361]" />
              Resumo de Preços
            </h3>
            
            <div className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Subtotal ({cartItems.length} {cartItems.length === 1 ? 'painel' : 'painéis'})
                </span>
                <span className="font-medium">{formatCurrency(subtotal)}/mês</span>
              </div>

              {/* Preço Original com Plano (RISCADO se houver desconto) */}
              {selectedPlan === 12 && planDiscount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm text-red-600 font-medium">Preço Original</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600 line-through">
                        {formatCurrency(subtotalWithPlan)}
                      </div>
                      <div className="text-xs text-red-500">Sem desconto anual</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grande Destaque da Economia do Plano Anual */}
              {selectedPlan === 12 && planDiscount > 0 && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <div className="text-center">
                    <div className="text-sm font-medium opacity-90 mb-1">🎉 Você está economizando</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(planDiscount)}
                    </div>
                    <div className="text-sm opacity-90 mt-1">
                      Com o plano anual! ({discountPercentage}% OFF)
                    </div>
                  </div>
                </div>
              )}

              {/* Desconto do Cupom (se aplicável) */}
              {couponValid && couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto Cupom ({couponDiscount}%)</span>
                  <span className="font-medium">-{formatCurrency(finalPrice * (couponDiscount / 100))}</span>
                </div>
              )}
              
              {/* Total Final com destaque */}
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-[#3C1361] rounded-lg p-4 text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Final</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{formatCurrency(finalPrice)}</div>
                      {selectedPlan === 12 && planDiscount > 0 && (
                        <div className="text-sm opacity-90">
                          Era {formatCurrency(subtotalWithPlan)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Método de Pagamento</div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 512 512" fill="currentColor">
                    <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
                  </svg>
                  PIX (Instantâneo)
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
