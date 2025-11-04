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

  // Group benefits by category
  const groupedBenefits = benefitOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, typeof benefitOptions>);

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
    <div className="min-h-screen bg-[#1a0000] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-3xl px-12 py-8 shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
            <h1 className="text-5xl font-black bg-gradient-to-r from-[#DC2626] to-[#991b1b] bg-clip-text text-transparent mb-2">
              EXA
            </h1>
            <p className="text-sm text-gray-600 font-medium tracking-wide">Publicidade que vive nos elevadores</p>
          </div>

          {/* Card de Boas-vindas */}
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] p-8">
              <h2 className="text-4xl font-black text-white mb-2 flex items-center justify-center gap-3">
                <span className="text-5xl">🎁</span>
                Parabéns, {validationData?.provider_name}!
              </h2>
              <p className="text-white/90 text-xl font-medium">
                Você ajudou a ativar mais um ponto EXA!
              </p>
            </div>
            
            <div className="p-8 space-y-6">
              {validationData?.activation_point && (
                <div className="flex items-center justify-center gap-2 text-gray-700 bg-gray-50 rounded-2xl py-4 px-6">
                  <span className="text-2xl">📍</span>
                  <span className="text-lg font-semibold">{validationData.activation_point}</span>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-[#DC2626]/10 to-[#DC2626]/5 rounded-2xl p-8 border-2 border-[#DC2626]/20">
                <p className="text-xl text-gray-700 mb-2 font-medium">
                  Escolha onde quer usar seu presente de
                </p>
                <p className="text-5xl font-black bg-gradient-to-r from-[#DC2626] to-[#991b1b] bg-clip-text text-transparent">
                  R$ 50,00
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Benefícios por Categoria */}
        <div className="space-y-12 mt-12">
          {Object.entries(groupedBenefits).map(([category, options]) => (
            <div key={category} className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                <div className="h-px bg-white/20 flex-1" />
                <h3 className="text-3xl font-black text-white px-6 py-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  {categoryLabels[category]}
                </h3>
                <div className="h-px bg-white/20 flex-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {options.map((option) => (
                  <BenefitCard
                    key={option.id}
                    option={option}
                    onSelect={handleSelectOption}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>
          ))}
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
        />
      )}
    </div>
  );
};

export default ProviderBenefitChoice;
