import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Calendar, Clock, ArrowRight, Loader2, AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { supabase } from '@/integrations/supabase/client';

const AssinaturaConfirmadaPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const proposalId = searchParams.get('proposalId');
  
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!proposalId) {
        setError('ID da proposta não encontrado');
        setIsLoading(false);
        return;
      }

      try {
        const { data: proposal, error: proposalError } = await supabase
          .from('proposals')
          .select('*, metadata')
          .eq('id', proposalId)
          .single();

        if (proposalError || !proposal) {
          setError('Proposta não encontrada');
          setIsLoading(false);
          return;
        }

        const metadata = proposal.metadata as any;
        const subscriptionInfo = metadata?.subscription;

        if (subscriptionInfo) {
          setSubscriptionData({
            ...subscriptionInfo,
            proposalNumber: proposal.number,
            clientName: proposal.client_name,
            durationMonths: proposal.duration_months
          });
        } else {
          // Fallback: calculate from proposal data
          setSubscriptionData({
            monthly_value: proposal.fidel_monthly_value,
            total_months: proposal.duration_months,
            proposalNumber: proposal.number,
            clientName: proposal.client_name,
            durationMonths: proposal.duration_months,
            status: 'pending'
          });
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar informações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [proposalId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getNextBillingDate = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Verificando sua assinatura...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Ops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-lg mx-auto flex justify-center">
          <UnifiedLogo variant="dark" size="md" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto p-4 pt-8">
        {/* Success Card */}
        <Card className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Assinatura Ativada! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6">
            Seu cartão foi cadastrado com sucesso. As cobranças serão realizadas automaticamente todo mês.
          </p>

          {/* Subscription Details */}
          <div className="bg-gray-50 rounded-xl p-6 text-left space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <span className="text-gray-600">Cobrança mensal</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(subscriptionData?.monthly_value || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-gray-600">Próxima cobrança</span>
              </div>
              <span className="font-semibold text-gray-900">
                {getNextBillingDate()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-gray-600">Duração</span>
              </div>
              <span className="font-semibold text-gray-900">
                {subscriptionData?.total_months || subscriptionData?.durationMonths || 1} {(subscriptionData?.total_months || subscriptionData?.durationMonths || 1) === 1 ? 'mês' : 'meses'}
              </span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6">
            <p className="text-amber-800 text-sm">
              <strong>💡 Próximo passo:</strong> Acesse sua área do anunciante para enviar seu vídeo publicitário (até 10 segundos, horizontal 4:3).
            </p>
          </div>

          {/* Action Button */}
          <Button 
            onClick={() => navigate('/anunciante')}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            <Home className="h-5 w-5 mr-2" />
            Acessar Minha Área
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Card>

        {/* Footer Info */}
        <p className="text-center text-gray-500 text-sm">
          Você pode gerenciar sua assinatura a qualquer momento na área do anunciante.
        </p>
      </main>
    </div>
  );
};

export default AssinaturaConfirmadaPage;
