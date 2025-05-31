
import React, { useState, useRef } from 'react';
import { useLeadsCampanhas } from '@/hooks/useLeadsCampanhas';
import { useCampanhasPortfolio } from '@/hooks/useCampanhasPortfolio';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Coffee, 
  Target, 
  TrendingUp, 
  Users, 
  Award,
  CheckCircle, 
  ArrowRight,
  Trophy,
  Star,
  Gift,
  Calendar,
  Sparkles,
  BookOpen,
  Crown,
  Megaphone,
  BarChart3,
  Heart,
  Shield,
  Zap,
  Search,
  Brain,
  Camera,
  Lightbulb,
  ChartLine,
  Eye,
  Palette,
  Gauge,
  ChevronDown,
  Briefcase,
  Wrench,
  AlertTriangle,
  DollarSign,
  UserCheck,
  Compass,
  Lock,
  TrendingDown,
  Building,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

const Marketing = () => {
  console.log('Marketing component rendering...');

  // Basic state for form
  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_empresa: '',
    cargo: '',
    whatsapp: '',
    objetivo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  // Try to use hooks with error handling
  let createLead: any;
  let campanhas: any[] = [];

  try {
    const { createLead: createLeadHook } = useLeadsCampanhas();
    createLead = createLeadHook;
    console.log('useLeadsCampanhas hook loaded successfully');
  } catch (error) {
    console.error('Error loading useLeadsCampanhas:', error);
  }

  try {
    const { campanhas: campanhasData } = useCampanhasPortfolio();
    campanhas = campanhasData || [];
    console.log('useCampanhasPortfolio hook loaded successfully, campanhas:', campanhas.length);
  } catch (error) {
    console.error('Error loading useCampanhasPortfolio:', error);
  }

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
      if (createLead) {
        await createLead(formData);
        setFormData({
          nome_completo: '',
          nome_empresa: '',
          cargo: '',
          whatsapp: '',
          objetivo: ''
        });
        toast.success('Obrigado! Nossa equipe entrará em contato para marcar a conversa estratégica e entregar o manual.');
      } else {
        toast.error('Erro ao conectar com o sistema. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  console.log('Marketing component rendered successfully');

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section Simplificado */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />

        <div className="relative z-10 text-center max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="block mb-2">Estratégia, Criatividade e Resultados</span>
            <span className="block mb-2">em Campanhas de Marketing que</span>
            <span className="block bg-gradient-to-r from-[#00FFAB] to-white bg-clip-text text-transparent">
              Movimentam Empresas
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
            Nós planejamos, executamos e geramos impacto real.<br/>
            Sua empresa precisa de muito mais do que posts: ela precisa de posicionamento, presença e performance.
          </p>

          <Button
            onClick={scrollToForm}
            size="lg"
            className="bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white font-bold py-4 px-8 rounded-full shadow-2xl hover:shadow-[#00FFAB]/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1 text-lg"
          >
            <Coffee className="w-5 h-5 mr-2" />
            Agendar Conversa com Especialistas
          </Button>
        </div>
      </section>

      {/* Formulário Simplificado */}
      <section ref={formRef} id="form-section" className="py-20 bg-gradient-to-b from-black to-[#3C1361]/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Agende uma conversa com <span className="text-[#00FFAB]">nossos especialistas</span>
            </h2>
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
                      Agendar Conversa + Receber Manual Estratégico
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Botão fixo mobile */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
        <Button
          onClick={scrollToForm}
          className="w-full bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white font-bold py-4 rounded-full shadow-2xl"
        >
          <Coffee className="w-5 h-5 mr-2" />
          Agendar Conversa Estratégica
        </Button>
      </div>
    </div>
  );
};

export default Marketing;
