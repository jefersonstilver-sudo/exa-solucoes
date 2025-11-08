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
const PAGE_VERSION = '5.0.0';
const BUILD_TIME = new Date().toISOString();

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

type PageState = 'loading' | 'valid' | 'invalid' | 'already_used' | 'choosing' | 'success';

// Função helper para converter ícone de texto para emoji
const getIconEmoji = (icon: string): string => {
  // Se já for emoji, retorna
  if (/\p{Emoji}/u.test(icon)) {
    return icon;
  }
  
  // Mapeamento de textos do banco para emojis
  const iconMap: Record<string, string> = {
    'Beef': '🍔',
    'Beer': '🍺',
    'Tv': '🎬',
    'Pizza': '🍕',
    'Jeronimo': '🍔',
    'UtensilsCrossed': '🍔',
    'IceCream': '🍦',
    'Popcorn': '🍿',
  };
  
  return iconMap[icon] || icon;
};

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
    // Garantir que temos o benefício escolhido - usar selectedOption ou fallback para validationData
    const chosenBenefitId = selectedOption || validationData?.benefit_choice;
    const chosenBenefit = benefitOptions.find((opt) => opt.id === chosenBenefitId);
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-8">
          
          {/* Ícone de Sucesso Minimalista */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-11 w-11 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Título e Subtítulo */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Parabéns!
            </h1>
            <p className="text-lg text-gray-600">
              Sua escolha foi registrada com sucesso
            </p>
          </div>

          {/* Card do Benefício Escolhido */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Ícone do Benefício */}
              <div className="text-5xl">
                {getIconEmoji(chosenBenefit?.icon || '')}
              </div>
              
              {/* Nome do Benefício */}
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {chosenBenefit?.name || 'Benefício escolhido'}
                </p>
                {chosenBenefit?.subtitle && (
                  <p className="text-sm text-gray-500">
                    {chosenBenefit.subtitle}
                  </p>
                )}
              </div>

              {/* Valor */}
              <div className="pt-2 pb-4">
                <p className="text-3xl font-bold text-emerald-600">
                  R$ 50,00
                </p>
              </div>

              {/* Badge de Prazo */}
              {chosenBenefit && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  chosenBenefit.delivery_days === 1 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {chosenBenefit.delivery_days === 1 ? '⚡' : '📦'}
                  <span>
                    Código em até {chosenBenefit.delivery_days === 1 ? '24 horas' : '3 dias úteis'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Próximos Passos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-base font-medium text-gray-900">
                  Você receberá o código por email
                </p>
                <p className="text-sm text-gray-500">
                  Verifique sua caixa de entrada e pasta de spam
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Obrigado por fazer parte da <span className="font-semibold text-gray-700">EXA MÍDIA</span>
            </p>
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
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Profissional - Estilo iFood */}
        <header className="bg-[#DC2626] shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              <img 
                src={EXA_LOGO_URL} 
                alt="EXA Mídia" 
                className="h-10 w-auto object-contain filter brightness-0 invert"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.classList.remove('hidden');
                }}
              />
              <div className="hidden">
                <h1 className="text-xl font-black text-white">EXA MÍDIA</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="space-y-4">

            {/* Card de Boas-vindas */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-[#DC2626] px-6 py-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎁</div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Parabéns, {validationData?.provider_name}!
                  </h2>
                  <p className="text-white/90 text-sm">
                    Você ativou um novo ponto EXA
                  </p>
                </div>
              </div>
              
              <div className="px-6 py-5 space-y-3">
                {validationData?.activation_point && (
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg py-2 px-3">
                    <span className="text-lg">📍</span>
                    <span className="text-xs font-medium text-gray-700">{validationData.activation_point}</span>
                  </div>
                )}
                
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <p className="text-xs text-gray-600 mb-1 text-center">
                    Escolha seu vale-presente de
                  </p>
                  <p className="text-3xl font-black text-center text-emerald-600">
                    R$ 50,00
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Seções de Benefícios */}
          <div className="space-y-5 mt-5">
            {/* Entrega Expressa - 24h */}
            {fastDeliveryBenefits.length > 0 && (
              <div className="space-y-3">
                <div className="bg-emerald-500 rounded-xl px-4 py-3 shadow-md">
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="h-5 w-5 text-white" />
                    <h3 className="text-base font-bold text-white">
                      ⚡ Entrega em até 24 horas
                    </h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
              <div className="space-y-3">
                <div className="bg-blue-500 rounded-xl px-4 py-3 shadow-md">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-white" />
                    <h3 className="text-base font-bold text-white">
                      📦 Entrega em até 3 dias úteis
                    </h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
        <footer className="mt-8 pb-6 text-center">
          <p className="text-xs text-gray-500">
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
