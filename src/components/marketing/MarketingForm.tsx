
import React, { useState, RefObject } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coffee, Gift, Eye, BookOpen } from 'lucide-react';
import { useLeadsLinkae } from '@/hooks/useLeadsLinkae';
import { toast } from 'sonner';

interface MarketingFormProps {
  formRef: RefObject<HTMLElement>;
}

const MarketingForm: React.FC<MarketingFormProps> = ({ formRef }) => {
  const { createLead } = useLeadsLinkae();
  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_empresa: '',
    cargo: '',
    whatsapp: '',
    objetivo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_completo || !formData.nome_empresa || !formData.cargo || !formData.whatsapp) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createLead(formData);
      setFormData({
        nome_completo: '',
        nome_empresa: '',
        cargo: '',
        whatsapp: '',
        objetivo: ''
      });
      toast.success('Obrigado! Nossa equipe entrará em contato para marcar a reunião estratégica e entregar o manual.');
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section ref={formRef} id="form-section" className="py-20 bg-gradient-to-b from-black to-[#3C1361]/20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Agende uma reunião estratégica com <span className="text-[#00FFAB]">nossa equipe</span>
          </h2>
          <p className="text-xl text-gray-300 mb-4">
            Ideal para empresas em fase de crescimento ou reposicionamento, e líderes que buscam inovação real com resultado concreto.
          </p>
          <p className="text-lg text-white">
            Preencha o briefing rápido e nossa equipe vai entrar em contato para marcar a reunião estratégica presencial, apresentar o manual e mostrar como a Indexa pode construir a campanha mais completa da sua história.
          </p>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="nome_completo" className="text-white mb-2 block">Nome Completo *</Label>
                  <Input
                    id="nome_completo"
                    value={formData.nome_completo}
                    onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                    className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nome_empresa" className="text-white mb-2 block">Nome da Empresa *</Label>
                  <Input
                    id="nome_empresa"
                    value={formData.nome_empresa}
                    onChange={(e) => handleInputChange('nome_empresa', e.target.value)}
                    className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                    placeholder="Nome da sua empresa"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="cargo" className="text-white mb-2 block">Cargo *</Label>
                  <Select value={formData.cargo} onValueChange={(value) => handleInputChange('cargo', value)}>
                    <SelectTrigger className="bg-white/10 border-white/30 text-white">
                      <SelectValue placeholder="Selecione seu cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CEO">CEO</SelectItem>
                      <SelectItem value="Diretor">Diretor</SelectItem>
                      <SelectItem value="Fundador">Fundador</SelectItem>
                      <SelectItem value="Gerente de Marketing">Gerente de Marketing</SelectItem>
                      <SelectItem value="Tomador de decisão externo">Tomador de decisão externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="whatsapp" className="text-white mb-2 block">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                    placeholder="(45) 99999-9999"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="objetivo" className="text-white mb-2 block">Objetivo principal da campanha</Label>
                <Textarea
                  id="objetivo"
                  value={formData.objetivo}
                  onChange={(e) => handleInputChange('objetivo', e.target.value)}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                  placeholder="Conte-nos qual o principal objetivo da sua empresa com uma campanha estratégica..."
                  rows={4}
                />
              </div>

              <div className="bg-[#00FFAB]/20 border border-[#00FFAB]/50 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <Gift className="h-8 w-8 text-[#00FFAB] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[#00FFAB] font-semibold mb-3 text-lg">Benefícios ao agendar:</h4>
                    <ul className="text-white space-y-2">
                      <li className="flex items-center"><Eye className="h-4 w-4 mr-3 text-[#00FFAB]" />Diagnóstico inicial gratuito</li>
                      <li className="flex items-center"><BookOpen className="h-4 w-4 mr-3 text-[#00FFAB]" />Manual de Marketing impresso com frameworks, exemplos e planejamento</li>
                      <li className="flex items-center"><Coffee className="h-4 w-4 mr-3 text-[#00FFAB]" />Tour pela sede da Indexa e degustação de ideias criativas</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white font-bold py-4 px-8 rounded-full text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Coffee className="w-5 h-5 mr-2" />
                    Agendar Reunião Estratégica + Receber Manual
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default MarketingForm;
