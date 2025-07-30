import React, { useState, RefObject } from 'react';
import { useLeadsLinkae } from '@/hooks/useLeadsLinkae';
import { toast } from 'sonner';

interface LinkaeFormProps {
  formRef: RefObject<HTMLElement>;
}

const LinkaeForm: React.FC<LinkaeFormProps> = ({ formRef }) => {
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    nomeEmpresa: '',
    cargo: '',
    whatsapp: '',
    objetivo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createLead } = useLeadsLinkae();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nomeCompleto || !formData.nomeEmpresa || !formData.cargo || !formData.whatsapp) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createLead({
        nome_completo: formData.nomeCompleto,
        nome_empresa: formData.nomeEmpresa,
        cargo: formData.cargo,
        whatsapp: formData.whatsapp,
        objetivo: formData.objetivo || 'Estratégia de Social Media'
      });
      
      toast.success('Formulário enviado com sucesso! Entraremos em contato em breve.');
      
      setFormData({
        nomeCompleto: '',
        nomeEmpresa: '',
        cargo: '',
        whatsapp: '',
        objetivo: ''
      });
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section ref={formRef} className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Informações da reunião */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Agende sua <span className="text-[#00B377]">Estratégia Social</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              Uma conversa de 30 minutos pode transformar completamente sua presença digital
            </p>
            
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#00FFAB] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Análise da sua presença atual</h3>
                  <p className="text-gray-600">Avaliamos suas redes sociais e identificamos oportunidades</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#00FFAB] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Estratégia personalizada</h3>
                  <p className="text-gray-600">Criamos um plano específico para seu nicho e objetivos</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#00FFAB] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Manual exclusivo de social media</h3>
                  <p className="text-gray-600">Receba nosso guia com 50+ ideias de posts que convertem</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={formData.nomeCompleto}
                  onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B377] focus:border-transparent"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da empresa *
                </label>
                <input
                  type="text"
                  value={formData.nomeEmpresa}
                  onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B377] focus:border-transparent"
                  placeholder="Nome da sua empresa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo *
                </label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => handleInputChange('cargo', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B377] focus:border-transparent"
                  placeholder="Seu cargo na empresa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp *
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B377] focus:border-transparent"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objetivo principal para redes sociais
                </label>
                <textarea
                  value={formData.objetivo}
                  onChange={(e) => handleInputChange('objetivo', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B377] focus:border-transparent h-24 resize-none"
                  placeholder="Ex: Aumentar vendas, fortalecer marca, gerar leads..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#00FFAB] to-[#00B377] text-white font-semibold py-4 px-6 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Agendar Estratégia Gratuita'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeForm;