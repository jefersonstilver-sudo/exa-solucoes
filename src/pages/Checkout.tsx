
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useCartManager } from '@/hooks/useCartManager';
import { useCouponValidator } from '@/hooks/useCouponValidator';
import { useSimplifiedPixCheckout } from '@/hooks/useSimplifiedPixCheckout';
import { calculatePixPrice } from '@/utils/priceCalculator';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard, QrCode, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUserSession();
  const { cartItems, selectedPlan } = useCartManager();
  const { couponId, validationResult, couponValid } = useCouponValidator();
  const { processPixPayment, isProcessing } = useSimplifiedPixCheckout();

  // Verificar se há dados necessários
  if (!selectedPlan || cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Carrinho vazio</h2>
              <p className="text-gray-600 mb-4">Adicione painéis ao carrinho para continuar</p>
              <Button onClick={() => navigate('/paineis-digitais/loja')}>
                Ver Painéis Disponíveis
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Calcular preços
  const couponDiscountPercent = couponValid && validationResult?.coupon ? validationResult.coupon.desconto_percentual : 0;
  const finalPrice = calculatePixPrice(selectedPlan, cartItems, couponDiscountPercent);

  const handlePixPayment = async () => {
    if (!user?.id) {
      toast.error("Faça login para continuar");
      navigate('/login');
      return;
    }

    const success = await processPixPayment(couponId, couponDiscountPercent);
    if (!success) {
      toast.error("Erro ao processar pagamento. Tente novamente.");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Finalizar Pedido</h1>
          </div>

          {/* Resumo do Pedido */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Painéis selecionados:</span>
                  <span>{cartItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plano:</span>
                  <span>{selectedPlan} {selectedPlan === 1 ? 'mês' : 'meses'}</span>
                </div>
                {couponValid && validationResult?.coupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto cupom:</span>
                    <span>-{validationResult.coupon.desconto_percentual}%</span>
                  </div>
                )}
                <div className="flex justify-between text-green-600">
                  <span>Desconto PIX:</span>
                  <span>-5%</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>R$ {finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métodos de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Método de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* PIX */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <QrCode className="h-5 w-5 mr-2" />
                      <span className="font-medium">PIX</span>
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                        5% desconto
                      </Badge>
                    </div>
                    <span className="font-semibold">R$ {finalPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Pagamento instantâneo via PIX
                  </p>
                  <Button 
                    onClick={handlePixPayment}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? 'Processando...' : 'Pagar com PIX'}
                  </Button>
                </div>

                {/* Cartão (desabilitado temporariamente) */}
                <div className="border rounded-lg p-4 opacity-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      <span className="font-medium">Cartão de Crédito</span>
                    </div>
                    <span className="text-sm text-gray-500">Em breve</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Parcelamento disponível em breve
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
