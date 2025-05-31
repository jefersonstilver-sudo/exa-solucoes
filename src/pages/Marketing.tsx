
import React, { useState, useRef, useEffect } from 'react';
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
  Play, 
  Target, 
  TrendingUp, 
  Users, 
  Award,
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
  Megaphone,
  BarChart3,
  Heart,
  Shield,
  Zap
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
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const formRef = useRef<HTMLElement>(null);

  // Framework TACOH com os pilares corretos
  const tacohFramework = [
    {
      title: "Técnico",
      description: "Use dados e provas sociais para conquistar a confiança. Estudos de caso, métricas e resultados reais.",
      icon: <BarChart3 className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-700"
    },
    {
      title: "Autoridade",
      description: "Destaque prêmios, conquistas e validações. Reconhecimento do mercado gera respeito.",
      icon: <Trophy className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-700"
    },
    {
      title: "Crescimento",
      description: "Mostre como o cliente pode crescer com sua empresa. Histórias de sucesso e gráficos reais.",
      icon: <TrendingUp className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-green-500 to-green-700"
    },
    {
      title: "Conexão",
      description: "Conte histórias que gerem empatia e envolvimento. Humanize sua marca com storytelling.",
      icon: <Heart className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-red-500 to-red-700"
    },
    {
      title: "Objeção",
      description: "Antecipe e elimine as dúvidas do seu público. Reforce garantias, provas e ROI.",
      icon: <Shield className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-orange-500 to-orange-700"
    },
    {
      title: "Hype",
      description: "Use tendências, gatilhos e tecnologias do momento. Posicione-se como marca do agora.",
      icon: <Zap className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-indigo-500 to-indigo-700"
    }
  ];

  // Processo em 6 etapas
  const processSteps = [
    {
      number: "01",
      title: "Reunião estratégica com especialistas",
      description: "Análise profunda do negócio e definição de objetivos estratégicos"
    },
    {
      number: "02", 
      title: "Planejamento e definição de linguagem",
      description: "Criação da estratégia de comunicação e tom de voz da marca"
    },
    {
      number: "03",
      title: "Criação de identidade visual, slogan e storytelling", 
      description: "Desenvolvimento da identidade completa e narrativa da marca"
    },
    {
      number: "04",
      title: "Roteirização e cronograma de entregas",
      description: "Planejamento detalhado de conteúdo e timeline de execução"
    },
    {
      number: "05",
      title: "Produção audiovisual com estúdios e IAs",
      description: "Criação de conteúdo com tecnologia de ponta e qualidade cinematográfica"
    },
    {
      number: "06",
      title: "Lançamento com tráfego pago, performance e relatórios",
      description: "Execução da campanha com acompanhamento de resultados em tempo real"
    }
  ];

  // Entregáveis específicos
  const deliverables = [
    { item: "Planejamento completo de campanha", included: true },
    { item: "Branding, identidade e slogan", included: true },
    { item: "Produção de vídeos TACOH", included: true },
    { item: "Sessões de gravação sensoriais", included: true },
    { item: "Roteiros, artes, tráfego pago", included: true },
    { item: "Relatórios e otimizações mensais", included: true },
    { item: "Equipe completa em produção", included: true },
    { item: "Manual tático de marketing", included: true, highlight: true }
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
      toast.success('Obrigado! Nossa equipe entrará em contato para marcar seu café. Você vai adorar o nosso estúdio.');
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filtrar campanhas por categoria
  const filteredCampanhas = selectedCategory === 'Todos' 
    ? campanhas 
    : campanhas.filter(campanha => campanha.categoria === selectedCategory);

  const categories = ['Todos', ...Array.from(new Set(campanhas.map(c => c.categoria)))];

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
            <span className="block mb-2">Campanhas Cinematográficas</span>
            <span className="block mb-2">para Empresas que Querem</span>
            <span className="block bg-gradient-to-r from-[#00FFAB] to-white bg-clip-text text-transparent">
              Dominar o Jogo.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Muito além de posts. Criamos movimentos. E transformamos marcas em potências.
          </p>

          <Button
            onClick={scrollToForm}
            size="lg"
            className="bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white font-bold py-4 px-8 rounded-full shadow-2xl hover:shadow-[#00FFAB]/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1 text-lg"
          >
            <Gift className="w-5 h-5 mr-2" />
            Marcar um Tour + Ganhar o Manual Exclusivo
          </Button>
        </div>
      </section>

      {/* Nossa Missão */}
      <section className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-[#00FFAB]">Criar campanhas</span> que marcam, tocam e convertem.
          </h2>
          <div className="max-w-4xl mx-auto text-lg md:text-xl text-gray-300 leading-relaxed space-y-6">
            <p>
              Na Indexa, não vendemos apenas vídeos: <strong className="text-white">entregamos identidade, presença e autoridade.</strong>
            </p>
            <p>
              Nosso processo mergulha na essência da empresa, traduz seus valores em uma linguagem visual atual e sensorial, e constrói uma narrativa capaz de movimentar audiências e gerar resultados reais.
            </p>
          </div>
        </div>
      </section>

      {/* Framework TACOH */}
      <section className="py-20 bg-gradient-to-b from-black to-[#3C1361]/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Framework <span className="text-[#00FFAB]">TACOH</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              O que toda campanha precisa conter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tacohFramework.map((item, index) => (
              <Card key={index} className={`${item.bgColor} border-none text-white hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden group`}>
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    {item.icon}
                    <h3 className="text-2xl font-bold ml-3">{item.title}</h3>
                  </div>
                  <p className="text-white/90 leading-relaxed flex-1 group-hover:text-white transition-colors duration-300">{item.description}</p>
                  <div className="mt-4 flex items-center text-[#00FFAB] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
              Como <span className="text-[#00FFAB]">Funciona</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Jornada em 6 etapas para campanhas que geram resultados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-[#3C1361] to-[#00FFAB] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#00FFAB]">{step.title}</h3>
                <p className="text-gray-300 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Entregáveis */}
      <section className="py-20 bg-gradient-to-b from-black to-[#3C1361]/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Incluso nas <span className="text-[#00FFAB]">Campanhas Indexa</span>
            </h2>
            <p className="text-xl text-gray-300">
              Entregáveis completos para dominar o seu mercado
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="space-y-4">
              {deliverables.map((item, index) => (
                <div key={index} className={`flex items-center p-4 rounded-lg ${
                  item.highlight ? 'bg-[#00FFAB]/20 border border-[#00FFAB]/50' : 'bg-white/5'
                }`}>
                  <CheckCircle className="h-6 w-6 text-green-400 mr-4 flex-shrink-0" />
                  <span className={`text-lg ${item.highlight ? 'text-[#00FFAB] font-semibold' : 'text-white'}`}>
                    {item.item}
                  </span>
                  {item.highlight && (
                    <Badge className="ml-auto bg-[#00FFAB] text-[#3C1361]">
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
                Portfólio de <span className="text-[#00FFAB]">Campanhas</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Empresas que já dominam o jogo com nossa metodologia
              </p>

              {/* Filtros por categoria */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className={`${
                      selectedCategory === category 
                        ? 'bg-[#00FFAB] text-[#3C1361]' 
                        : 'border-[#00FFAB] text-[#00FFAB] hover:bg-[#00FFAB]/10'
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampanhas.slice(0, 9).map((campanha) => (
                <Card key={campanha.id} className="bg-white/5 border-white/10 text-white hover:scale-105 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gradient-to-br from-[#3C1361] to-[#00FFAB] rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                      {campanha.url_video ? (
                        <video
                          className="w-full h-full object-cover"
                          src={campanha.url_video}
                          muted
                          loop
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => e.currentTarget.pause()}
                        />
                      ) : (
                        <Play className="h-12 w-12 text-white" />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{campanha.titulo}</h3>
                    <p className="text-[#00FFAB] font-semibold mb-2">{campanha.cliente}</p>
                    <Badge variant="outline" className="border-[#00FFAB] text-[#00FFAB] mb-3">
                      {campanha.categoria}
                    </Badge>
                    {campanha.descricao && (
                      <p className="text-gray-300 text-sm line-clamp-2">{campanha.descricao}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Frase de Encerramento */}
      <section className="py-16 bg-gradient-to-r from-[#3C1361] to-[#2A0D47]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            📍 Conheça nosso estúdio, tome um café com a gente
          </h2>
          <p className="text-xl text-[#00FFAB] font-semibold">
            e leve gratuitamente o Manual de Marketing para empresas de Foz.
          </p>
        </div>
      </section>

      {/* Formulário de Qualificação */}
      <section ref={formRef} id="form-section" className="py-20 bg-gradient-to-b from-black to-[#3C1361]/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Agende seu café com <span className="text-[#00FFAB]">especialistas</span>
            </h2>
            <p className="text-xl text-gray-300 mb-4">
              Ganhe gratuitamente o nosso Manual de Marketing para empresas locais com dicas práticas, IA, apps e estratégias.
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
                    <Label htmlFor="cargo" className="text-white mb-2 block">Cargo com Poder de Decisão *</Label>
                    <Select value={formData.cargo} onValueChange={(value) => handleInputChange('cargo', value)}>
                      <SelectTrigger className="bg-white/10 border-white/30 text-white">
                        <SelectValue placeholder="Selecione seu cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CEO">CEO</SelectItem>
                        <SelectItem value="Diretor(a) de Marketing">Diretor(a) de Marketing</SelectItem>
                        <SelectItem value="Consultor(a) ou agência com poder de decisão">Consultor(a) ou agência com poder de decisão</SelectItem>
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
                  <Label htmlFor="objetivo" className="text-white mb-2 block">Objetivo com a campanha</Label>
                  <Textarea
                    id="objetivo"
                    value={formData.objetivo}
                    onChange={(e) => handleInputChange('objetivo', e.target.value)}
                    className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                    placeholder="Conte-nos qual o principal objetivo da sua empresa com uma campanha..."
                    rows={4}
                  />
                </div>

                <div className="bg-[#00FFAB]/20 border border-[#00FFAB]/50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Gift className="h-6 w-6 text-[#00FFAB] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-[#00FFAB] font-semibold mb-2">O que você receberá:</h4>
                      <ul className="text-white text-sm space-y-1">
                        <li className="flex items-center"><Coffee className="h-4 w-4 mr-2 text-[#00FFAB]" />Tour presencial pelo estúdio</li>
                        <li className="flex items-center"><BookOpen className="h-4 w-4 mr-2 text-[#00FFAB]" />Manual de Marketing (impresso)</li>
                        <li className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-[#00FFAB]" />Consultoria estratégica personalizada</li>
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
                      <Gift className="w-5 h-5 mr-2" />
                      Marcar um Tour + Ganhar o Manual Exclusivo
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
          <Gift className="w-5 h-5 mr-2" />
          Marcar Tour + Manual Gratuito
        </Button>
      </div>
    </div>
  );
};

export default Marketing;
