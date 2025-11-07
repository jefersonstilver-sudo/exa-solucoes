import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, ArrowLeft, Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BenefitCard from '@/components/benefits/BenefitCard';
import ConfirmationModal from '@/components/benefits/ConfirmationModal';
import { useBenefitOptions } from '@/hooks/useBenefitOptions';

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

const BenefitPreview = () => {
  const navigate = useNavigate();
  const { benefits: benefitOptions, isLoading } = useBenefitOptions();
  
  const [previewData, setPreviewData] = useState({
    provider_name: 'João Silva',
    activation_point: 'Edifício Esmeralda - Centro',
  });

  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBenefitSelect = (benefitId: string) => {
    setSelectedBenefit(benefitId);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    setIsModalOpen(false);
    // No preview, apenas fecha o modal
  };

  const fastDeliveryBenefits = benefitOptions.filter(opt => opt.delivery_days === 1);
  const normalDeliveryBenefits = benefitOptions.filter(opt => opt.delivery_days === 3);

  const selectedBenefitData = benefitOptions.find((b) => b.id === selectedBenefit);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC2626] mx-auto" />
          <p className="text-gray-600 font-medium">Carregando benefícios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Admin */}
      <div className="bg-gradient-to-r from-[#DC2626] to-[#991b1b] py-6 px-4 shadow-lg border-b-4 border-[#991b1b]">
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
              🔍 MODO PREVIEW
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Preview */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-black mb-4 text-gray-900">⚙️ Configurar Preview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preview_name" className="font-bold text-gray-700 text-sm">Nome do Prestador</Label>
              <Input
                id="preview_name"
                value={previewData.provider_name}
                onChange={(e) =>
                  setPreviewData({ ...previewData, provider_name: e.target.value })
                }
                placeholder="Ex: João Silva"
                className="rounded-xl border-2 border-gray-200 focus:border-[#DC2626]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview_point" className="font-bold text-gray-700 text-sm">Ponto de Ativação</Label>
              <Input
                id="preview_point"
                value={previewData.activation_point}
                onChange={(e) =>
                  setPreviewData({ ...previewData, activation_point: e.target.value })
                }
                placeholder="Ex: Edifício Copacabana"
                className="rounded-xl border-2 border-gray-200 focus:border-[#DC2626]"
              />
            </div>
          </div>
        </div>

        {/* Preview da Página - Estilo Final */}
        <div className="bg-gray-50 rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header com Logo */}
          <header className="bg-[#DC2626] sticky top-0 z-50">
            <div className="px-4 py-4 flex items-center justify-center">
              <img 
                src={EXA_LOGO_URL} 
                alt="EXA Mídia" 
                className="h-10 w-auto object-contain filter brightness-0 invert"
              />
            </div>
          </header>

          <div className="p-4 space-y-4">
            {/* Card de Boas-vindas */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-[#DC2626] px-6 py-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎁</div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Parabéns, {previewData.provider_name}!
                  </h2>
                  <p className="text-white/90 text-sm">
                    Você ativou um novo ponto EXA
                  </p>
                </div>
              </div>
              
              <div className="px-6 py-5 space-y-3">
                {previewData.activation_point && (
                  <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg py-2 px-3">
                    <span className="text-lg">📍</span>
                    <span className="text-xs font-medium text-gray-700">{previewData.activation_point}</span>
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

            {/* Seções de Benefícios */}
            <div className="space-y-5">
              {/* Entrega Expressa */}
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
                    {fastDeliveryBenefits.map((benefit) => (
                      <BenefitCard
                        key={benefit.id}
                        option={benefit}
                        onSelect={handleBenefitSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Entrega Padrão */}
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
                    {normalDeliveryBenefits.map((benefit) => (
                      <BenefitCard
                        key={benefit.id}
                        option={benefit}
                        onSelect={handleBenefitSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
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
          deliveryDays={selectedBenefitData.delivery_days}
        />
      )}
    </div>
  );
};

export default BenefitPreview;
