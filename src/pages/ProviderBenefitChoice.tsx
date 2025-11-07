import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useBenefitManagement } from '@/hooks/useBenefitManagement';
import BenefitCard from '@/components/benefits/BenefitCard';
import ConfirmationModal from '@/components/benefits/ConfirmationModal';
import { benefitOptions, categoryLabels } from '@/data/benefitOptions';
import type { TokenValidationResponse } from '@/types/providerBenefits';

type PageState = 'loading' | 'valid' | 'invalid' | 'already_used' | 'choosing' | 'success';

const ProviderBenefitChoice = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { validateToken, registerChoice } = useBenefitManagement();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [validationData, setValidationData] = useState<TokenValidationResponse | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      return;
    }

    validateTokenAsync();
  }, [token]);

  const validateTokenAsync = async () => {
    if (!token) return;

    try {
      const response = await validateToken(token);

      if (response.valid) {
        setValidationData(response);
        setPageState('choosing');
      } else if (response.error === 'TOKEN_ALREADY_USED') {
        setValidationData(response);
        setPageState('already_used');
      } else if (response.error === 'TOKEN_CANCELLED') {
        setPageState('invalid');
      } else {
        setPageState('invalid');
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setPageState('invalid');
    }
  };

  const handleSelectOption = (optionId: string) => {
    setSelectedOption(optionId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmChoice = async () => {
    if (!selectedOption || !token) return;

    setIsSubmitting(true);
    try {
      const response = await registerChoice(token, selectedOption);

      if (response.success) {
        setPageState('success');
      } else {
        alert('Erro ao registrar escolha. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao confirmar escolha:', error);
      alert('Erro ao processar sua escolha. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
    }
  };

  const selectedBenefit = benefitOptions.find((opt) => opt.id === selectedOption);

  // Group benefits by delivery time
  const fastDeliveryBenefits = benefitOptions.filter(opt => opt.delivery_days === 1);
  const normalDeliveryBenefits = benefitOptions.filter(opt => opt.delivery_days === 3);

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#1a0000] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-12 shadow-2xl">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-[#DC2626]" />
              <div className="absolute inset-0 h-16 w-16 bg-[#DC2626]/20 rounded-full blur-xl animate-pulse" />
            </div>
            <p className="text-xl text-white/80 font-medium">Validando seu convite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-[#1a0000] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#DC2626]/10 flex items-center justify-center ring-4 ring-[#DC2626]/20">
              <AlertCircle className="h-10 w-10 text-[#DC2626]" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Link Inválido</h1>
            <p className="text-gray-600 text-lg">
              Este link não é válido ou expirou. Por favor, entre em contato com a EXA Mídia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'already_used') {
    return (
      <div className="min-h-screen bg-[#1a0000] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center ring-4 ring-green-200">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Presente Já Escolhido</h1>
            <p className="text-gray-600 text-lg">
              Você já escolheu seu presente! O código será enviado por email em breve.
            </p>
            {validationData?.benefit_choice && (
              <div className="mt-6 p-6 bg-gradient-to-br from-[#DC2626]/5 to-[#DC2626]/10 rounded-2xl border border-[#DC2626]/20">
                <p className="text-sm font-semibold text-gray-700 mb-2">Sua escolha:</p>
                <p className="text-2xl font-black text-[#DC2626]">
                  {
                    benefitOptions.find((opt) => opt.id === validationData.benefit_choice)
                      ?.name
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-[#1a0000] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center ring-8 ring-green-100 shadow-lg">
                <CheckCircle className="h-14 w-14 text-white" strokeWidth={3} />
              </div>
              <div className="absolute -top-2 -right-2 text-4xl animate-bounce">🎉</div>
            </div>
            <h1 className="text-4xl font-black text-gray-900">Parabéns!</h1>
            <div className="space-y-4 w-full">
              <p className="text-xl text-gray-700 font-medium">Sua escolha foi registrada com sucesso!</p>
              <div className="bg-gradient-to-br from-[#DC2626]/10 to-[#DC2626]/5 rounded-2xl p-8 border-2 border-[#DC2626]/20">
                <div className="text-7xl mb-4 animate-pulse">{selectedBenefit?.icon}</div>
                <p className="text-3xl font-black text-[#DC2626]">{selectedBenefit?.name}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl max-w-md w-full space-y-4">
              <p className="text-base text-gray-700">
                Em breve você receberá um email com o código do seu vale-presente de <strong className="text-2xl text-[#DC2626] font-black">R$ 50,00</strong>.
              </p>
              {selectedBenefit && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-1">⚡ Prazo de Entrega</p>
                  <p className="text-base text-amber-800">
                    {selectedBenefit.delivery_days === 1 ? (
                      <span className="font-bold">Até 24 horas</span>
                    ) : (
                      <span className="font-bold">Até {selectedBenefit.delivery_days} dias úteis</span>
                    )}
                  </p>
                </div>
              )}
              <div className="h-px bg-gray-200" />
              <p className="text-base text-gray-700 font-bold">
                Obrigado por fazer parte da EXA MÍDIA! 🚀
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Choosing state
  return (
    <div className="min-h-screen bg-[#1a0000] py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header com Logo */}
        <div className="text-center mb-6">
          <div className="inline-block bg-white rounded-2xl px-8 py-4 shadow-xl mb-4">
            <h1 className="text-3xl font-black bg-gradient-to-r from-[#DC2626] to-[#991b1b] bg-clip-text text-transparent">
              EXA
            </h1>
            <p className="text-xs text-gray-600 font-medium">Publicidade nos elevadores</p>
          </div>

          {/* Card de Boas-vindas - Compacto */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] p-6">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-1 flex items-center justify-center gap-2">
                <span className="text-3xl">🎁</span>
                Parabéns, {validationData?.provider_name}!
              </h2>
              <p className="text-white/90 text-base font-medium">
                Você ajudou a ativar mais um ponto EXA!
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {validationData?.activation_point && (
                <div className="flex items-center justify-center gap-2 text-gray-700 bg-gray-50 rounded-xl py-3 px-4">
                  <span className="text-xl">📍</span>
                  <span className="text-sm font-semibold">{validationData.activation_point}</span>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-[#DC2626]/10 to-[#DC2626]/5 rounded-xl p-6 border-2 border-[#DC2626]/20">
                <p className="text-base text-gray-700 mb-1 font-medium">
                  Escolha onde quer usar seu presente de
                </p>
                <p className="text-4xl font-black bg-gradient-to-r from-[#DC2626] to-[#991b1b] bg-clip-text text-transparent">
                  R$ 50,00
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefícios por Tempo de Entrega */}
        <div className="space-y-8 mt-8">
          {/* Entrega Rápida - 1 dia */}
          {fastDeliveryBenefits.length > 0 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">⚡</span>
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-white">
                      ENTREGA EM ATÉ 24 HORAS
                    </h3>
                    <p className="text-white/90 text-sm font-medium">
                      Escolha agora e receba rápido!
                    </p>
                  </div>
                  <span className="text-3xl">⚡</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fastDeliveryBenefits.map((option) => (
                  <BenefitCard
                    key={option.id}
                    option={option}
                    onSelect={handleSelectOption}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Entrega Normal - 3 dias */}
          {normalDeliveryBenefits.length > 0 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">📦</span>
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-white">
                      ENTREGA EM ATÉ 3 DIAS ÚTEIS
                    </h3>
                    <p className="text-white/90 text-sm font-medium">
                      Grandes lojas e marcas!
                    </p>
                  </div>
                  <span className="text-3xl">📦</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {normalDeliveryBenefits.map((option) => (
                  <BenefitCard
                    key={option.id}
                    option={option}
                    onSelect={handleSelectOption}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedBenefit && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setSelectedOption(null);
          }}
          onConfirm={handleConfirmChoice}
          benefitName={selectedBenefit.name}
          benefitIcon={selectedBenefit.icon}
          deliveryDays={selectedBenefit.delivery_days}
        />
      )}
    </div>
  );
};

export default ProviderBenefitChoice;
