import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { useBenefitManagement } from '@/hooks/useBenefitManagement';
import { useBenefitOptions } from '@/hooks/useBenefitOptions';
import BenefitCard from '@/components/benefits/BenefitCard';
import ConfirmationModal from '@/components/benefits/ConfirmationModal';
import type { TokenValidationResponse } from '@/types/providerBenefits';

// Versão da página para cache busting
const PAGE_VERSION = '3.0.0';
const BUILD_TIME = new Date().toISOString();

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

type PageState = 'loading' | 'valid' | 'invalid' | 'already_used' | 'choosing' | 'success';

const ProviderBenefitChoice = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { validateToken, registerChoice } = useBenefitManagement();
  const { benefits: benefitOptions, isLoading: isBenefitsLoading } = useBenefitOptions();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [validationData, setValidationData] = useState<TokenValidationResponse | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log(`🎁 ProviderBenefitChoice v${PAGE_VERSION} carregada em ${BUILD_TIME}`);
    
    if (!token) {
      setPageState('invalid');
      return;
    }

    // Espera os benefícios carregarem antes de validar o token
    if (!isBenefitsLoading && benefitOptions.length > 0) {
      validateTokenAsync();
    }
  }, [token, isBenefitsLoading, benefitOptions]);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-200">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center ring-8 ring-emerald-100 shadow-xl">
                <CheckCircle className="h-14 w-14 text-white" strokeWidth={3} />
              </div>
              <div className="absolute -top-2 -right-2 text-4xl animate-bounce">🎉</div>
            </div>
            
            <h1 className="text-4xl font-black text-gray-900">Parabéns!</h1>
            
            <p className="text-lg text-gray-700 font-medium">
              Sua escolha foi registrada com sucesso!
            </p>
            
            <div className="w-full bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border-2 border-emerald-200">
              <div className="text-7xl mb-4">{selectedBenefit?.icon}</div>
              <p className="text-3xl font-black text-gray-900 mb-2">{selectedBenefit?.name}</p>
              {selectedBenefit?.subtitle && (
                <p className="text-base text-gray-600 font-medium">{selectedBenefit.subtitle}</p>
              )}
            </div>
            
            <div className="w-full bg-white p-6 rounded-2xl border-2 border-gray-200 space-y-4">
              <p className="text-base text-gray-700 leading-relaxed">
                Em breve você receberá um email com o código do seu vale-presente de <strong className="text-2xl text-emerald-600 font-black">R$ 50,00</strong>
              </p>
              
              {selectedBenefit && (
                <div className={`${selectedBenefit.delivery_days === 1 ? 'bg-emerald-100 border-emerald-300' : 'bg-blue-100 border-blue-300'} border-2 rounded-xl p-4`}>
                  <p className={`text-base font-black ${selectedBenefit.delivery_days === 1 ? 'text-emerald-800' : 'text-blue-800'}`}>
                    {selectedBenefit.delivery_days === 1 ? '⚡' : '📦'} Código enviado em até {selectedBenefit.delivery_days === 1 ? '24 horas' : '3 dias úteis'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="pt-4">
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
    <>
      <Helmet>
        <title>Escolha seu Presente - EXA Mídia</title>
        <meta name="description" content="Escolha seu vale-presente de R$ 50,00" />
        <meta httpEquiv="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="pragma" content="no-cache" />
        <meta httpEquiv="expires" content="0" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Header Profissional com Logo - Estilo iFood */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center">
              <img 
                src={EXA_LOGO_URL} 
                alt="EXA Mídia" 
                className="h-12 sm:h-14 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.classList.remove('hidden');
                }}
              />
              <div className="hidden">
                <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#DC2626] to-[#991b1b] bg-clip-text text-transparent">
                  EXA MÍDIA
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-6">{/* Conteúdo */}

            {/* Card de Boas-vindas */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] px-6 py-8">
                <div className="text-center space-y-2">
                  <div className="text-5xl mb-2">🎁</div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Parabéns, {validationData?.provider_name}!
                  </h2>
                  <p className="text-white/90 text-base font-medium">
                    Você ativou um novo ponto EXA
                  </p>
                </div>
              </div>
              
              <div className="px-6 py-6 space-y-4">
                {validationData?.activation_point && (
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-3 px-4 border border-gray-200">
                    <span className="text-xl">📍</span>
                    <span className="text-sm font-semibold text-gray-700">{validationData.activation_point}</span>
                  </div>
                )}
                
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
                  <p className="text-sm text-gray-700 font-medium mb-2 text-center">
                    Escolha seu vale-presente de
                  </p>
                  <p className="text-4xl sm:text-5xl font-black text-center bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    R$ 50,00
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Seções de Benefícios */}
          <div className="space-y-6">
            {/* Entrega Expressa - 24h */}
            {fastDeliveryBenefits.length > 0 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-center gap-3">
                    <Zap className="h-7 w-7 text-white fill-white" />
                    <div className="text-center">
                      <h3 className="text-xl font-black text-white">
                        ENTREGA EM ATÉ 24 HORAS
                      </h3>
                      <p className="text-white/95 text-sm font-semibold">
                        Código por email rapidamente
                      </p>
                    </div>
                    <Zap className="h-7 w-7 text-white fill-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

            {/* Entrega Padrão - 3 dias */}
            {normalDeliveryBenefits.length > 0 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="h-7 w-7 text-white" />
                    <div className="text-center">
                      <h3 className="text-xl font-black text-white">
                        ENTREGA EM ATÉ 3 DIAS ÚTEIS
                      </h3>
                      <p className="text-white/95 text-sm font-semibold">
                        Grandes marcas para você
                      </p>
                    </div>
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        
        {/* Footer */}
        <footer className="mt-12 pb-8 text-center">
          <p className="text-sm text-gray-500 font-medium">
            EXA Mídia © 2025 - Publicidade Inteligente
          </p>
        </footer>
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
      
      {/* Cache busting marker */}
      <div style={{ display: 'none' }} data-version={PAGE_VERSION} data-build={BUILD_TIME} />
    </>
  );
};

export default ProviderBenefitChoice;
