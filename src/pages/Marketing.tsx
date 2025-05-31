
import React, { useState, useEffect } from 'react';
import { useLeadsCampanhas } from '@/hooks/useLeadsCampanhas';
import { useCampanhasPortfolio } from '@/hooks/useCampanhasPortfolio';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Target, 
  TrendingUp, 
  Users, 
  Globe, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Trophy,
  Star,
  Gift,
  Coffee,
  Calendar,
  Sparkles,
  BookOpen,
  Crown,
  Megaphone
} from 'lucide-react';
import { toast } from 'sonner';

const Marketing = () => {
  const { createLead } = useLeadsCampanhas();
  const { campanhas } = useCampanhasPortfolio();
  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_empresa: '',
    cargo: '',
    whatsapp: '',
    objetivo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);

  const tacohItems = [
    {
      title: "Território",
      description: "Expandir presença geográfica e alcançar novos mercados",
      icon: <Globe className="h-8 w-8 text-indexa-mint" />,
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-700"
    },
    {
      title: "Audiência",
      description: "Conectar com o público ideal através de dados precisos",
      icon: <Users className="h-8 w-8 text-indexa-mint" />,
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-700"
    },
    {
      title: "Conversão",
      description: "Transformar visualizações em vendas reais",
      icon: <TrendingUp className="h-8 w-8 text-indexa-mint" />,
      bgColor: "bg-gradient-to-br from-green-500 to-green-700"
    },
    {
      title: "Objetivo",
      description: "Definir metas claras e mensuráveis para cada campanha",
      icon: <Target className="h-8 w-8 text-indexa-mint" />,
      bgColor: "bg-gradient-to-br from-red-500 to-red-700"
    },
    {
      title: "Hábito",
      description: "Criar conexões duradouras que geram fidelidade",
      icon: <Zap className="h-8 w-8 text-indexa-mint" />,
      bgColor: "bg-gradient-to-br from-yellow-500 to-orange-600"
    },
    {
      title: "Humanização",
      description: "Dar alma à sua marca através de storytelling autêntico",
      icon: <Crown className="h-8 w-8 text-indexa-mint" />,
      bgColor: "bg-gradient-to-br from-indigo-500 to-indigo-700"
    }
  ];

  const processSteps = [
    {
      number: "01",
      title: "Diagnóstico Estratégico",
      description: "Análise profunda do seu negócio, concorrência e oportunidades de mercado"
    },
    {
      number: "02", 
      title: "Framework TACOH",
      description: "Aplicação da nossa metodologia exclusiva para definir estratégias certeiras"
    },
    {
      number: "03",
      title: "Criação Cinematográfica", 
      description: "Produção de conteúdo com linguagem de cinema que emociona e converte"
    },
    {
      number: "04",
      title: "Veiculação Inteligente",
      description: "Distribuição estratégica em nossa rede de painéis em locais de alto impacto"
    },
    {
      number: "05",
      title: "Métricas & Otimização",
      description: "Acompanhamento detalhado de resultados com ajustes em tempo real"
    },
    {
      number: "06",
      title: "Expansão Contínua",
      description: "Escalabilidade planejada para crescimento sustentável da sua marca"
    }
  ];

  const deliverables = [
    { item: "Diagnóstico completo da marca", included: true },
    { item: "Estratégia TACOH personalizada", included: true },
    { item: "Produção de vídeo cinematográfico", included: true },
    { item: "Veiculação em painéis premium", included: true },
    { item: "Relatórios detalhados de performance", included: true },
    { item: "Manual de Marketing da Nova Era", included: true, highlight: true },
    { item: "Consultoria estratégica mensal", included: true },
    { item: "Suporte técnico dedicado", included: true }
  ];

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
      setShowMobileForm(false);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    const formSection = document.getElementById('form-section');
    formSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section Cinematográfica */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Vídeo de fundo */}
        <div className="absolute inset-0 z-0">
          <video
            className="w-full h-full object-cover opacity-40"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tYSB2Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MTkxOH0.jZXItKJQsy0DLstm8TT6Ky_Y8Y4nZrJY3150yC9MwLo" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="block mb-2">Sua marca no</span>
            <span className="block bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent mb-2">
              centro da decisão.
            </span>
            <span className="block text-2xl md:text-3xl lg:text-4xl text-white/90 font-light">
              Marketing que move mercados.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Transforme sua estratégia com o Framework TACOH e conquiste territórios inexplorados através de campanhas cinematográficas que emocionam e convertem.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={scrollToForm}
              size="lg"
              className="bg-indexa-mint text-indexa-purple-dark font-bold py-4 px-8 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1"
            >
              <Gift className="w-5 h-5 mr-2" />
              Agendar Tour + Manual Gratuito
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToForm}
              className="border-white/30 text-white hover:bg-white/10 py-4 px-8 rounded-full"
            >
              <Play className="w-5 h-5 mr-2" />
              Ver Nossa Metodologia
            </Button>
          </div>
        </div>
      </section>

      {/* Nossa Missão */}
      <section className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-indexa-mint">Movemos</span> mercados através da emoção
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Não criamos apenas campanhas. <strong className="text-white">Criamos movimentos.</strong> 
            Através da nossa metodologia exclusiva Framework TACOH e linguagem cinematográfica, 
            transformamos marcas em referências que ocupam o centro da decisão de compra dos consumidores.
          </p>
        </div>
      </section>

      {/* Framework TACOH */}
      <section className="py-20 bg-gradient-to-b from-black to-indexa-purple/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Framework <span className="text-indexa-mint">TACOH</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Nossa metodologia exclusiva que revoluciona estratégias de marketing através de 6 pilares fundamentais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tacohItems.map((item, index) => (
              <Card key={index} className={`${item.bgColor} border-none text-white hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden`}>
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    {item.icon}
                    <h3 className="text-2xl font-bold ml-3">{item.title}</h3>
                  </div>
                  <p className="text-white/90 leading-relaxed flex-1">{item.description}</p>
                  <div className="mt-4 flex items-center text-indexa-mint">
                    <ArrowRight className="h-4 w-4" />
                    <span className="ml-2 text-sm font-semibold">Saiba mais</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Como <span className="text-indexa-mint">Funcionamos</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Processo estruturado em 6 etapas para garantir resultados excepcionais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-indexa-purple to-indexa-mint w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-indexa-mint">{step.title}</h3>
                <p className="text-gray-300 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Entregáveis */}
      <section className="py-20 bg-gradient-to-b from-black to-indexa-purple/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              O que você <span className="text-indexa-mint">recebe</span>
            </h2>
            <p className="text-xl text-gray-300">
              Entregáveis completos para sua transformação no mercado
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="space-y-4">
              {deliverables.map((item, index) => (
                <div key={index} className={`flex items-center p-4 rounded-lg ${
                  item.highlight ? 'bg-indexa-mint/20 border border-indexa-mint/50' : 'bg-white/5'
                }`}>
                  <CheckCircle className="h-6 w-6 text-green-400 mr-4 flex-shrink-0" />
                  <span className={`text-lg ${item.highlight ? 'text-indexa-mint font-semibold' : 'text-white'}`}>
                    {item.item}
                  </span>
                  {item.highlight && (
                    <Badge className="ml-auto bg-indexa-mint text-indexa-purple-dark">
                      <Gift className="h-3 w-3 mr-1" />
                      Gratuito
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Portfólio */}
      {campanhas.length > 0 && (
        <section className="py-20 bg-black">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Campanhas que <span className="text-indexa-mint">Moveram</span> Mercados
              </h2>
              <p className="text-xl text-gray-300">
                Resultados reais de marcas que confiaram na nossa metodologia
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campanhas.slice(0, 6).map((campanha) => (
                <Card key={campanha.id} className="bg-white/5 border-white/10 text-white hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-lg mb-4 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{campanha.titulo}</h3>
                    <p className="text-indexa-mint font-semibold mb-2">{campanha.cliente}</p>
                    <Badge variant="outline" className="border-indexa-mint text-indexa-mint">
                      {campanha.categoria}
                    </Badge>
                    {campanha.descricao && (
                      <p className="text-gray-300 text-sm mt-3 line-clamp-2">{campanha.descricao}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Formulário de Qualificação */}
      <section id="form-section" className="py-20 bg-gradient-to-b from-black to-indexa-purple/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Conquiste seu <span className="text-indexa-mint">Território</span>
            </h2>
            <p className="text-xl text-gray-300 mb-4">
              Agende um tour pela nossa metodologia e receba gratuitamente o Manual de Marketing da Nova Era
            </p>
            <div className="flex items-center justify-center space-x-2 text-indexa-mint">
              <BookOpen className="h-5 w-5" />
              <span className="font-semibold">Material físico exclusivo entregue presencialmente</span>
            </div>
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
                    <Label htmlFor="cargo" className="text-white mb-2 block">Cargo com Poder de Decisão *</Label>
                    <Select value={formData.cargo} onValueChange={(value) => handleInputChange('cargo', value)}>
                      <SelectTrigger className="bg-white/10 border-white/30 text-white">
                        <SelectValue placeholder="Selecione seu cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CEO">CEO</SelectItem>
                        <SelectItem value="Diretor(a) de Marketing">Diretor(a) de Marketing</SelectItem>
                        <SelectItem value="Consultor(a) com poder de decisão">Consultor(a) com poder de decisão</SelectItem>
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
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="objetivo" className="text-white mb-2 block">Objetivo Principal (Opcional)</Label>
                  <Textarea
                    id="objetivo"
                    value={formData.objetivo}
                    onChange={(e) => handleInputChange('objetivo', e.target.value)}
                    className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                    placeholder="Conte-nos qual o principal desafio ou objetivo da sua empresa..."
                    rows={4}
                  />
                </div>

                <div className="bg-indexa-mint/20 border border-indexa-mint/50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Gift className="h-6 w-6 text-indexa-mint flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-indexa-mint font-semibold mb-2">O que você receberá:</h4>
                      <ul className="text-white text-sm space-y-1">
                        <li className="flex items-center"><Coffee className="h-4 w-4 mr-2 text-indexa-mint" />Tour presencial pela metodologia TACOH</li>
                        <li className="flex items-center"><BookOpen className="h-4 w-4 mr-2 text-indexa-mint" />Manual de Marketing da Nova Era (impresso)</li>
                        <li className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-indexa-mint" />Consultoria estratégica personalizada</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indexa-mint text-indexa-purple-dark font-bold py-4 px-8 rounded-full text-lg hover:bg-indexa-mint/90 transition-all duration-300 transform hover:scale-105"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indexa-purple-dark mr-2"></div>
                      Enviando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Gift className="w-5 h-5 mr-2" />
                      Agendar Tour + Manual Gratuito
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
          onClick={() => setShowMobileForm(!showMobileForm)}
          className="w-full bg-indexa-mint text-indexa-purple-dark font-bold py-4 rounded-full shadow-2xl"
        >
          <Gift className="w-5 h-5 mr-2" />
          Agendar Tour + Manual Gratuito
        </Button>
      </div>
    </div>
  );
};

export default Marketing;
