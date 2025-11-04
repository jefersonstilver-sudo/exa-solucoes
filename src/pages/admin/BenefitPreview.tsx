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
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/super_admin/beneficio-prestadores')}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Admin
            </Button>
            <div className="text-sm bg-primary-foreground/20 px-3 py-1 rounded">
              MODO PREVIEW
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black mb-2">EXA MÍDIA</h1>
            <p className="text-primary-foreground/80">Publicidade que vive nos elevadores</p>
          </div>
        </div>
      </div>

      {/* Controles de Preview */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Configurar Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preview_name">Nome do Prestador</Label>
              <Input
                id="preview_name"
                value={previewData.provider_name}
                onChange={(e) =>
                  setPreviewData({ ...previewData, provider_name: e.target.value })
                }
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview_point">Ponto de Ativação</Label>
              <Input
                id="preview_point"
                value={previewData.activation_point}
                onChange={(e) =>
                  setPreviewData({ ...previewData, activation_point: e.target.value })
                }
                placeholder="Ex: Edifício Copacabana"
              />
            </div>
          </div>
        </Card>

        {/* Preview da Página */}
        <Card className="p-8 shadow-2xl">
          {/* Saudação */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-3 rounded-full mb-4">
              <Gift className="inline-block mr-2 h-6 w-6" />
              <span className="font-bold text-lg">Parabéns, {previewData.provider_name}!</span>
            </div>
            <p className="text-lg text-muted-foreground">
              Você ajudou a ativar mais um ponto EXA!
            </p>
            {previewData.activation_point && (
              <p className="text-primary font-semibold mt-2">📍 {previewData.activation_point}</p>
            )}
          </div>

          {/* Valor do Presente */}
          <div className="bg-muted/50 rounded-lg p-6 text-center mb-8">
            <p className="text-muted-foreground mb-2">
              Escolha onde quer usar seu presente de
            </p>
            <p className="text-4xl font-black text-primary">R$ 50,00</p>
          </div>

          {/* Categorias */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {Object.keys(groupedBenefits).map((category) => (
              <Button
                key={category}
                variant={currentCategory === category ? 'default' : 'outline'}
                onClick={() => setCurrentCategory(category)}
                size="sm"
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
              <h3 className="text-xl font-bold mb-4 text-center">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        </Card>
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
