import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useUserSession } from '@/hooks/useUserSession';
import { useCheckout } from '@/hooks/useCheckout';
import { supabase } from '@/integrations/supabase/client';
import CheckoutLayout from '@/components/checkout/CheckoutLayout';
import FidelitySuccessModal from '@/components/checkout/FidelitySuccessModal';
import { formatCurrency } from '@/utils/priceUtils';
import { cn } from '@/lib/utils';

interface UserProfile {
  empresa_nome?: string;
  empresa_documento?: string;
  empresa_segmento?: string;
}

const CheckoutFidelidade = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: authLoading } = useUserSession();
  const { cartItems, selectedPlan, calculateTotalPrice, couponId, couponValid, isCartLoading } = useCheckout();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [diaVencimento, setDiaVencimento] = useState<'5' | '10' | '15'>('10');
  const [termoAceito, setTermoAceito] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estado para modal de sucesso
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    pedidoId: string;
    totalParcelas: number;
    valorMensal: number;
    proximoVencimento: string;
    boletoUrl?: string | null;
    boletoBarcode?: string | null;
  }>({
    isOpen: false,
    pedidoId: '',
    totalParcelas: 0,
    valorMensal: 0,
    proximoVencimento: ''
  });
  
  // Recuperar método de pagamento do localStorage
  const paymentMethod = localStorage.getItem('checkout_payment_method') as 'pix_fidelidade' | 'boleto_fidelidade' || 'pix_fidelidade';
  const isPix = paymentMethod === 'pix_fidelidade';
  
  // Calcular valores
  const totalAmount = calculateTotalPrice();
  const monthlyAmount = totalAmount / (selectedPlan || 1);
  
  // Carregar perfil do usuário
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('empresa_nome, empresa_documento, empresa_segmento')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setUserProfile(data);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    if (user?.id) {
      loadProfile();
    } else {
      setLoadingProfile(false);
    }
  }, [user?.id]);
  
  // Redirecionar se não logado
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      toast.error('Você precisa estar logado');
      navigate('/login?redirect=/checkout/fidelidade');
    }
  }, [authLoading, isLoggedIn, navigate]);
  
  // Validar dados do checkout - Aguardar carrinho carregar
  useEffect(() => {
    if (!authLoading && !isCartLoading && (!cartItems || cartItems.length === 0)) {
      toast.error('Carrinho vazio');
      navigate('/paineis-digitais/loja');
    }
  }, [cartItems, navigate, authLoading, isCartLoading]);
  
  // Gerar parcelas previstas
  const gerarParcelas = () => {
    const parcelas = [];
    const hoje = new Date();
    
    for (let i = 0; i < (selectedPlan || 1); i++) {
      const dataVencimento = new Date(hoje);
      dataVencimento.setMonth(dataVencimento.getMonth() + i);
      dataVencimento.setDate(parseInt(diaVencimento));
      
      parcelas.push({
        numero: i + 1,
        data: dataVencimento,
        valor: monthlyAmount,
        isPrimeira: i === 0
      });
    }
    
    return parcelas;
  };
  
  const parcelas = gerarParcelas();
  
  // Handler para processar fidelidade
  const handleProcessarFidelidade = async () => {
    if (!termoAceito) {
      toast.error('Aceite o termo de fidelidade para continuar');
      return;
    }
    
    if (!userProfile?.empresa_nome || !userProfile?.empresa_documento) {
      toast.error('Complete os dados da empresa nas configurações');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (selectedPlan || 1));
      
      const { data, error } = await supabase.functions.invoke('process-fidelity-checkout', {
        body: {
          cartItems,
          selectedPlan: selectedPlan || 1,
          paymentMethod,
          diaVencimento: parseInt(diaVencimento),
          totalAmount,
          monthlyAmount,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          couponId: couponValid ? couponId : null,
          userData: {
            nomeEmpresa: userProfile.empresa_nome,
            cnpj: userProfile.empresa_documento
          }
        }
      });
      
      if (error) throw error;
      
      console.log('✅ Checkout fidelidade processado:', data);
      
      // Limpar carrinho
      localStorage.removeItem('checkout_cart');
      localStorage.removeItem('checkout_plan');
      localStorage.removeItem('checkout_coupon');
      localStorage.removeItem('checkout_payment_method');
      
      // Mostrar modal de sucesso
      setSuccessModal({
        isOpen: true,
        pedidoId: data.pedidoId,
        totalParcelas: data.totalParcelas,
        valorMensal: data.valorMensal,
        proximoVencimento: data.proximoVencimento,
        boletoUrl: data.boletoUrl,
        boletoBarcode: data.boletoBarcode
      });
      
    } catch (error: any) {
      console.error('❌ Erro no checkout fidelidade:', error);
      toast.error(error.message || 'Erro ao processar fidelidade');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (authLoading || loadingProfile || isCartLoading) {
    return (
      <CheckoutLayout currentStep={2} maxWidth="4xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </CheckoutLayout>
    );
  }
  
  const hasCompanyData = userProfile?.empresa_nome && userProfile?.empresa_documento;
  
  return (
    <CheckoutLayout currentStep={2} maxWidth="4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 mt-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dados do Contrato
          </h1>
          <p className="text-gray-500 mt-2">
            Configure seu plano {isPix ? 'PIX' : 'Boleto'} Fidelidade de {selectedPlan} meses
          </p>
        </div>
        
        {/* Dados da Empresa */}
        <Card className="p-6 rounded-2xl border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-100 rounded-xl">
              <Building2 className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Dados da Empresa</h2>
              <p className="text-sm text-gray-500">Informações do contrato</p>
            </div>
          </div>
          
          {hasCompanyData ? (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Razão Social</span>
                <span className="font-medium text-gray-900">{userProfile?.empresa_nome}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">CNPJ</span>
                <span className="font-medium text-gray-900">{userProfile?.empresa_documento}</span>
              </div>
              {userProfile?.empresa_segmento && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Segmento</span>
                  <span className="font-medium text-gray-900">{userProfile.empresa_segmento}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Complete os dados da empresa
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Para contratos de fidelidade, precisamos dos dados da sua empresa.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate('/anunciante/configuracoes')}
                  >
                    Editar dados
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
        
        {/* Dia de Vencimento */}
        <Card className="p-6 rounded-2xl border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Dia do Vencimento</h2>
              <p className="text-sm text-gray-500">Escolha o melhor dia para você</p>
            </div>
          </div>
          
          <RadioGroup
            value={diaVencimento}
            onValueChange={(v) => setDiaVencimento(v as '5' | '10' | '15')}
            className="flex gap-3"
          >
            {['5', '10', '15'].map((dia) => (
              <Label
                key={dia}
                htmlFor={`dia-${dia}`}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  diaVencimento === dia
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <RadioGroupItem value={dia} id={`dia-${dia}`} className="sr-only" />
                <span className={cn(
                  "text-2xl font-bold",
                  diaVencimento === dia ? "text-blue-600" : "text-gray-600"
                )}>
                  {dia}
                </span>
              </Label>
            ))}
          </RadioGroup>
        </Card>
        
        {/* Termo de Fidelidade */}
        <Card className="p-6 rounded-2xl border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-violet-100 rounded-xl">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Termo de Fidelidade</h2>
              <p className="text-sm text-gray-500">Leia e aceite os termos</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 max-h-48 overflow-y-auto mb-4">
            <p className="mb-3">
              Este é um plano de <strong>{selectedPlan} meses</strong> com parcelas fixas de{' '}
              <strong>{formatCurrency(monthlyAmount)}</strong>.
            </p>
            <p className="mb-3">
              O pagamento deve ser realizado até o <strong>dia {diaVencimento}</strong> de cada mês
              via {isPix ? 'PIX' : 'Boleto Bancário'}.
            </p>
            <p className="mb-2 font-semibold">Em caso de atraso:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Multa de 2% sobre o valor da parcela</li>
              <li>Juros de 1% ao mês</li>
              <li>Suspensão do plano após 10 dias de atraso</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              Ao pagar a parcela em atraso, o plano será reativado automaticamente.
            </p>
          </div>
          
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={termoAceito}
              onCheckedChange={(checked) => setTermoAceito(checked as boolean)}
              className="mt-0.5"
            />
            <span className="text-sm text-gray-700">
              Li e aceito o <strong>Termo de Fidelidade</strong> e concordo com as condições de pagamento.
            </span>
          </label>
        </Card>
        
        {/* Resumo das Parcelas */}
        <Card className="p-6 rounded-2xl border-0 shadow-lg">
          <h2 className="font-semibold text-gray-900 mb-4">Resumo das Parcelas</h2>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {parcelas.map((parcela) => (
              <div
                key={parcela.numero}
                className={cn(
                  "flex justify-between items-center p-3 rounded-lg",
                  parcela.isPrimeira ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    parcela.isPrimeira ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    {parcela.numero}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Parcela {parcela.numero}
                      {parcela.isPrimeira && (
                        <span className="ml-2 text-xs text-emerald-600">(Pagar agora)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Vencimento: {parcela.data.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-gray-900">
                  {formatCurrency(parcela.valor)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total ({selectedPlan}x)</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </Card>
        
        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleProcessarFidelidade}
            disabled={!termoAceito || !hasCompanyData || isProcessing}
            className="w-full h-14 text-lg font-semibold bg-[#9C1E1E] hover:bg-[#7A1818] disabled:opacity-50"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                Gerar Primeira Parcela - {isPix ? 'PIX' : 'Boleto'}
              </>
            )}
          </Button>
          
          <button
            onClick={() => navigate('/checkout/resumo')}
            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 py-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
        </div>
      </motion.div>
      
      {/* Modal de Sucesso */}
      <FidelitySuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
        pedidoId={successModal.pedidoId}
        totalParcelas={successModal.totalParcelas}
        valorMensal={successModal.valorMensal}
        proximoVencimento={successModal.proximoVencimento}
        boletoUrl={successModal.boletoUrl}
        boletoBarcode={successModal.boletoBarcode}
        onNavigateToInvoices={() => navigate(`/anunciante/faturas?pedido=${successModal.pedidoId}`)}
      />
    </CheckoutLayout>
  );
};

export default CheckoutFidelidade;
