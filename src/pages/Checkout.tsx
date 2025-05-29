import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Lock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PaymentMethodCard from '@/components/checkout/payment/PaymentMethodCard';
import PaymentProgressHeader from '@/components/checkout/payment/PaymentProgressHeader';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Estados para o popup PIX
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [pixData, setPixData] = useState<{
    pix_url?: string;
    pix_base64?: string;
  }>({});
  
  const orderId = searchParams.get('id') || searchParams.get('pedido');
  
  // Calculate total amount from cart
  useEffect(() => {
    try {
      const cartItems = JSON.parse(localStorage.getItem('panelCart') || '[]');
      const total = cartItems.reduce((sum: number, item: any) => {
        const price = item.panel?.buildings?.basePrice || item.price || 250;
        return sum + price;
      }, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error("[Checkout] Error calculating total:", error);
      setTotalAmount(0);
    }
  }, []);

  // Authentication check
  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) {
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, isSessionLoading, navigate]);

  const handleBack = () => {
    navigate('/checkout/resumo');
  };

  const sendPixWebhook = async () => {
    if (!user) {
      toast.error("Dados do usuário não encontrados");
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      // Get selected plan from localStorage or default
      const selectedPlan = localStorage.getItem('selectedPlan') || '1';
      const planNames = {
        '1': '1 mês',
        '3': '3 meses', 
        '6': '6 meses',
        '12': '12 meses'
      };

      // Get cart items (prédios/painéis escolhidos)
      const cartItems = JSON.parse(localStorage.getItem('panelCart') || '[]');
      const prediosEscolhidos = cartItems.map((item: any) => ({
        painel_id: item.panel?.id || '',
        painel_codigo: item.panel?.code || '',
        predio_nome: item.panel?.buildings?.nome || '',
        predio_endereco: item.panel?.buildings?.endereco || '',
        predio_bairro: item.panel?.buildings?.bairro || '',
        predio_cidade: item.panel?.buildings?.cidade || '',
        duracao_dias: item.duration || 30,
        preco: item.panel?.buildings?.basePrice || item.price || 250
      }));

      const webhookData = {
        usuario_id: user.id,
        nome_usuario: user.email?.split('@')[0] || 'Cliente',
        email_usuario: user.email || '',
        plano_escolhido: planNames[selectedPlan as keyof typeof planNames] || '1 mês',
        valor_total: (totalAmount * 0.95).toFixed(2), // 5% discount for PIX
        predios_escolhidos: prediosEscolhidos,
        quantidade_paineis: prediosEscolhidos.length
      };

      console.log('[PIX Webhook] Enviando dados:', webhookData);

      const response = await fetch('https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('[PIX Webhook] Resposta recebida:', responseData);
        
        // Verificar se recebemos pix_url e pix_base64
        if (responseData.pix_url && responseData.pix_base64) {
          setPixData({
            pix_url: responseData.pix_url,
            pix_base64: responseData.pix_base64
          });
          setShowPixDialog(true);
          toast.success("QR Code PIX gerado com sucesso!");
        } else {
          console.warn('[PIX Webhook] Resposta sem dados PIX esperados:', responseData);
          toast.success("Dados enviados com sucesso! Processando pagamento PIX...");
          
          // Navigate to PIX payment page or show success
          setTimeout(() => {
            toast.info("Em breve você será redirecionado para o PIX");
          }, 1500);
        }
      } else {
        throw new Error(`Erro no webhook: ${response.status}`);
      }
    } catch (error) {
      console.error('[PIX Webhook] Erro ao enviar webhook:', error);
      toast.error("Erro ao processar pagamento PIX. Tente novamente.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePixPayment = () => {
    if (!acceptTerms) {
      toast.error("Você precisa aceitar os termos para continuar");
      return;
    }
    sendPixWebhook();
  };

  const handleCreditCardPayment = () => {
    if (!acceptTerms) {
      toast.error("Você precisa aceitar os termos para continuar");
      return;
    }
    toast.info("Redirecionando para pagamento com cartão...");
  };

  const handleClosePixDialog = () => {
    setShowPixDialog(false);
    setPixData({});
  };

  if (isSessionLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div className="h-8 w-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pagamento...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (!isLoggedIn || !user?.id) {
    return null;
  }

  const pixAmount = totalAmount * 0.95; // 5% discount

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header with back button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para resumo
            </Button>
            
            <PaymentProgressHeader currentStep={2} />
          </motion.div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment methods */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6 sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Como você deseja pagar?
                    </h2>
                    <p className="text-gray-600 mb-8">
                      Escolha a forma de pagamento que preferir
                    </p>

                    <div className="space-y-4 mb-8">
                      {/* PIX Payment Method */}
                      <PaymentMethodCard
                        id="pix"
                        title="PIX"
                        description="Pagamento instantâneo"
                        originalAmount={totalAmount}
                        finalAmount={pixAmount}
                        discount={5}
                        icon="pix"
                        selected={selectedMethod === 'pix'}
                        onSelect={setSelectedMethod}
                        highlight={true}
                      />

                      {/* Credit Card Payment Method */}
                      <PaymentMethodCard
                        id="credit_card"
                        title="Cartão de Crédito"
                        description="Visa, Mastercard, Elo, American Express"
                        originalAmount={totalAmount}
                        finalAmount={totalAmount}
                        icon="credit_card"
                        selected={selectedMethod === 'credit_card'}
                        onSelect={setSelectedMethod}
                      />
                    </div>

                    {/* Terms acceptance */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-start space-x-3 mb-8 p-4 bg-gray-50 rounded-lg"
                    >
                      <Checkbox 
                        id="terms" 
                        checked={acceptTerms} 
                        onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                        className="h-5 w-5 mt-0.5 border-gray-300 text-[#1E1B4B] focus:ring-[#1E1B4B]"
                      />
                      <Label 
                        htmlFor="terms" 
                        className="text-sm text-gray-600 cursor-pointer leading-relaxed"
                      >
                        Li e concordo com os{' '}
                        <a href="/termos" className="text-[#1E1B4B] hover:underline font-medium">
                          Termos de Uso
                        </a>{' '}
                        e a{' '}
                        <a href="/privacidade" className="text-[#1E1B4B] hover:underline font-medium">
                          Política de Privacidade
                        </a>
                        .
                      </Label>
                    </motion.div>

                    {/* Payment button */}
                    {selectedMethod && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        {selectedMethod === 'pix' ? (
                          <Button
                            onClick={handlePixPayment}
                            disabled={!acceptTerms || isProcessingPayment}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 text-lg font-semibold rounded-xl transition-colors"
                            size="lg"
                          >
                            {isProcessingPayment ? (
                              <>
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Processando...
                              </>
                            ) : (
                              `Pagar com PIX - R$ ${pixAmount.toFixed(2)}`
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={handleCreditCardPayment}
                            disabled={!acceptTerms}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 text-lg font-semibold rounded-xl transition-colors"
                            size="lg"
                          >
                            Pagar com Cartão - R$ {totalAmount.toFixed(2)}
                          </Button>
                        )}
                        
                        {!acceptTerms && selectedMethod && (
                          <p className="text-sm text-amber-600 text-center">
                            ⚠️ Aceite os termos para continuar
                          </p>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Summary sidebar - responsivo */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6 sticky top-8"
              >
                {/* Order summary */}
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Resumo do Pedido
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">R$ {totalAmount.toFixed(2)}</span>
                      </div>
                      
                      {selectedMethod === 'pix' && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto PIX (5%)</span>
                          <span>-R$ {(totalAmount * 0.05).toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-[#1E1B4B]">
                            R$ {selectedMethod === 'pix' ? pixAmount.toFixed(2) : totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security badges */}
                <Card className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Pagamento Seguro
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">SSL 256 bits</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Lock className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">Dados protegidos</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Award className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">Certificado PCI DSS</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* PIX Dialog Popup */}
      <PixQrCodeDialog
        isOpen={showPixDialog}
        onClose={handleClosePixDialog}
        qrCodeBase64={pixData.pix_base64}
        qrCodeText={pixData.pix_url}
        pix_url={pixData.pix_url}
        pix_base64={pixData.pix_base64}
      />
    </Layout>
  );
};

export default Checkout;
