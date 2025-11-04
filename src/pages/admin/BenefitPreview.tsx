import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BenefitCard from '@/components/benefits/BenefitCard';
import ConfirmationModal from '@/components/benefits/ConfirmationModal';
import { benefitOptions, categoryLabels } from '@/data/benefitOptions';

const BenefitPreview = () => {
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState({
    provider_name: 'João Silva',
    activation_point: 'Edifício Esmeralda - Centro',
  });

  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('shopping');

  const handleBenefitSelect = (benefitId: string) => {
    setSelectedBenefit(benefitId);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    setIsModalOpen(false);
    // No preview, apenas fecha o modal
  };

  const groupedBenefits = benefitOptions.reduce((acc, benefit) => {
    if (!acc[benefit.category]) {
      acc[benefit.category] = [];
    }
    acc[benefit.category].push(benefit);
    return acc;
  }, {} as Record<string, typeof benefitOptions>);

  const selectedBenefitData = benefitOptions.find((b) => b.id === selectedBenefit);

  return (
    <div className="min-h-screen bg-[#1a0000]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] py-6 px-4 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/super_admin/beneficio-prestadores')}
              className="text-white hover:bg-white/10 font-bold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Admin
            </Button>
            <div className="text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-white border border-white/30">
              MODO PREVIEW
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black text-white mb-2">EXA</h1>
            <p className="text-white/80 font-medium">Publicidade que vive nos elevadores</p>
          </div>
        </div>
      </div>

      {/* Controles de Preview */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-black mb-6 text-gray-900">Configurar Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="preview_name" className="font-bold text-gray-700">Nome do Prestador</Label>
              <Input
                id="preview_name"
                value={previewData.provider_name}
                onChange={(e) =>
                  setPreviewData({ ...previewData, provider_name: e.target.value })
                }
                placeholder="Ex: João Silva"
                className="rounded-2xl border-2 border-gray-200 focus:border-[#DC2626] py-6 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview_point" className="font-bold text-gray-700">Ponto de Ativação</Label>
              <Input
                id="preview_point"
                value={previewData.activation_point}
                onChange={(e) =>
                  setPreviewData({ ...previewData, activation_point: e.target.value })
                }
                placeholder="Ex: Edifício Copacabana"
                className="rounded-2xl border-2 border-gray-200 focus:border-[#DC2626] py-6 text-base"
              />
            </div>
          </div>
        </div>

        {/* Preview da Página */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Card de Boas-vindas */}
          <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] p-8">
            <h2 className="text-4xl font-black text-white mb-2 flex items-center justify-center gap-3">
              <span className="text-5xl">🎁</span>
              Parabéns, {previewData.provider_name}!
            </h2>
            <p className="text-white/90 text-xl font-medium text-center">
              Você ajudou a ativar mais um ponto EXA!
            </p>
          </div>
          
          <div className="p-8 space-y-6">
            {previewData.activation_point && (
              <div className="flex items-center justify-center gap-2 text-gray-700 bg-gray-50 rounded-2xl py-4 px-6">
                <span className="text-2xl">📍</span>
                <span className="text-lg font-semibold">{previewData.activation_point}</span>
              </div>
            )}
            
            <div className="bg-gradient-to-br from-[#DC2626]/10 to-[#DC2626]/5 rounded-2xl p-8 border-2 border-[#DC2626]/20">
              <p className="text-xl text-gray-700 mb-2 font-medium text-center">
                Escolha onde quer usar seu presente de
              </p>
              <p className="text-5xl font-black bg-gradient-to-r from-[#DC2626] to-[#991b1b] bg-clip-text text-transparent text-center">
                R$ 50,00
              </p>
            </div>

            {/* Categorias */}
            <div className="flex justify-center gap-3 flex-wrap">
              {Object.keys(groupedBenefits).map((category) => (
                <Button
                  key={category}
                  variant={currentCategory === category ? 'default' : 'outline'}
                  onClick={() => setCurrentCategory(category)}
                  className={
                    currentCategory === category
                      ? 'rounded-2xl font-bold px-6 py-6 bg-gradient-to-r from-[#DC2626] to-[#991b1b] hover:from-[#991b1b] hover:to-[#7f1d1d]'
                      : 'rounded-2xl font-bold px-6 py-6 border-2 border-gray-300 hover:bg-gray-50'
                  }
                >
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </Button>
              ))}
            </div>

            {/* Opções de Benefícios */}
            {Object.entries(groupedBenefits).map(([category, benefits]) => (
              <div
                key={category}
                className={currentCategory === category ? 'block' : 'hidden'}
              >
                <h3 className="text-2xl font-black mb-6 text-center text-gray-900">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {benefits.map((benefit) => (
                    <BenefitCard
                      key={benefit.id}
                      option={benefit}
                      onSelect={handleBenefitSelect}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedBenefitData && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirm}
          benefitName={selectedBenefitData.name}
          benefitIcon={selectedBenefitData.icon}
        />
      )}
    </div>
  );
};

export default BenefitPreview;
