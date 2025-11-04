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
      <div className="min-h-screen bg-gradient-to-br from-exa-red via-exa-dark to-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-exa-red mb-4" />
            <p className="text-lg text-muted-foreground">Validando seu convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-exa-red to-exa-dark flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-exa-red/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-exa-red" />
            </div>
            <h1 className="text-2xl font-bold">Link Inválido</h1>
            <p className="text-muted-foreground">
              Este link não é válido ou expirou. Por favor, entre em contato com a EXA Mídia.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'already_used') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-exa-graphite to-exa-dark flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-exa-red/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-exa-red" />
            </div>
            <h1 className="text-2xl font-bold">Presente Já Escolhido</h1>
            <p className="text-muted-foreground">
              Você já escolheu seu presente! O código será enviado por email em breve.
            </p>
            {validationData?.benefit_choice && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Sua escolha:</p>
                <p className="text-lg font-bold text-exa-red">
                  {
                    benefitOptions.find((opt) => opt.id === validationData.benefit_choice)
                      ?.name
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-exa-red to-exa-highlight-red flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-exa-red/10 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-exa-red" />
            </div>
            <h1 className="text-3xl font-bold">🎉 Parabéns!</h1>
            <div className="space-y-2">
              <p className="text-lg">Sua escolha foi registrada com sucesso!</p>
              <div className="text-6xl my-4">{selectedBenefit?.icon}</div>
              <p className="text-2xl font-bold text-exa-red">{selectedBenefit?.name}</p>
            </div>
            <div className="bg-muted p-6 rounded-lg max-w-md">
              <p className="text-sm text-muted-foreground">
                Em breve você receberá um email com o código do seu vale-presente de <strong className="text-exa-red">R$ 50,00</strong>.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                <strong>Obrigado por fazer parte da EXA MÍDIA! 🚀</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Choosing state
  return (
    <div className="min-h-screen bg-gradient-to-br from-exa-red via-exa-dark to-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-white rounded-2xl px-8 py-6 shadow-2xl mb-6">
            <h1 className="text-4xl font-black text-exa-red mb-2">EXA MÍDIA</h1>
            <p className="text-sm text-muted-foreground">Publicidade que vive nos elevadores</p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-8">
              <h2 className="text-3xl font-bold mb-4">
                🎁 Parabéns, {validationData?.provider_name}!
              </h2>
              <p className="text-lg text-muted-foreground mb-2">
                Você ajudou a ativar mais um ponto EXA!
              </p>
              {validationData?.activation_point && (
                <p className="text-sm text-exa-red font-semibold">
                  📍 {validationData.activation_point}
                </p>
              )}
              <div className="mt-6 p-4 bg-exa-red/10 rounded-lg">
                <p className="text-lg">
                  Escolha onde quer usar seu presente de{' '}
                  <strong className="text-2xl text-exa-red">R$ 50,00</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-8">
          {Object.entries(groupedBenefits).map(([category, options]) => (
            <div key={category}>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                {categoryLabels[category]}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
