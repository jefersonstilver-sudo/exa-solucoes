
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
  Zap,
  Search,
  Brain,
  Camera,
  Lightbulb,
  ChartLine,
  Eye,
  Palette,
  Gauge
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

  // Framework TACOH com descrições estratégicas
  const tacohFramework = [
    {
      title: "Técnico",
      description: "Provas, dados, métricas, estudos de caso que demonstram resultados reais e impacto mensurável.",
      application: "Dados que geram confiança",
      icon: <BarChart3 className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-700"
    },
    {
      title: "Autoridade",
      description: "Reconhecimentos, prêmios, selos, depoimentos que posicionam sua marca como referência no mercado.",
      application: "Credibilidade que convence",
      icon: <Trophy className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-700"
    },
    {
      title: "Crescimento",
      description: "Cases reais de crescimento impulsionado pela campanha, histórias de evolução e resultados.",
      application: "Evolução que inspira",
      icon: <TrendingUp className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-green-500 to-green-700"
    },
    {
      title: "Conexão",
      description: "Narrativas com emoção e empatia que criam vínculos verdadeiros entre marca e público.",
      application: "Emoção que conecta",
      icon: <Heart className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-red-500 to-red-700"
    },
    {
      title: "Objeção",
      description: "Antecipação e anulação de dúvidas, reforço de ROI e eliminação de barreiras de decisão.",
      application: "Clareza que converte",
      icon: <Shield className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-orange-500 to-orange-700"
    },
    {
      title: "Hype",
      description: "Elementos modernos, tendências e virais estratégicos que mantêm sua marca sempre relevante.",
      application: "Relevância que engaja",
      icon: <Zap className="h-8 w-8 text-[#00FFAB]" />,
      bgColor: "bg-gradient-to-br from-indigo-500 to-indigo-700"
    }
  ];

  // Processo estratégico em 6 etapas
  const processSteps = [
    {
      number: "01",
      title: "Reunião estratégica com nossos especialistas",
      description: "Mergulho na cultura, propósito e metas da empresa",
      icon: <Brain className="h-6 w-6 text-[#00FFAB]" />
    },
    {
      number: "02", 
      title: "Diagnóstico de posicionamento atual",
      description: "Benchmark, SWOT, análise de canais e presença digital",
      icon: <Search className="h-6 w-6 text-[#00FFAB]" />
    },
    {
      number: "03",
      title: "Criação da estratégia de campanha", 
      description: "Público-alvo, diferenciação, voz da marca e cronograma",
      icon: <Target className="h-6 w-6 text-[#00FFAB]" />
    },
    {
      number: "04",
      title: "Identidade visual, slogan e arquitetura da comunicação",
      description: "Construção de marca ou revitalização completa",
      icon: <Palette className="h-6 w-6 text-[#00FFAB]" />
    },
    {
      number: "05",
      title: "Produção de criativos integrados à campanha",
      description: "Roteiros, vídeos, trilhas sensoriais, artes e conteúdo escrito",
      icon: <Camera className="h-6 w-6 text-[#00FFAB]" />
    },
    {
      number: "06",
      title: "Gestão completa de campanha com performance",
      description: "Tráfego pago, testes A/B, relatórios e otimizações",
      icon: <Gauge className="h-6 w-6 text-[#00FFAB]" />
    }
  ];

  // Entregáveis estratégicos
  const deliverables = [
    { item: "Planejamento estratégico completo", included: true },
    { item: "Arquitetura de branding, slogan e voz da marca", included: true },
    { item: "Roteiros e narrativas alinhadas com posicionamento", included: true },
    { item: "Produção de criativos modernos (vídeo, reels, artes, textos)", included: true },
    { item: "Gerenciamento de tráfego pago e performance", included: true },
    { item: "Otimizações e relatórios mensais", included: true },
    { item: "Equipe especializada em estratégia e criatividade", included: true },
    { item: "Manual de Marketing Personalizado da Indexa", included: true, highlight: true }
  ];

  // Equipamentos do estúdio
  const studioEquipment = [
    { name: "Chroma Key 360º", description: "Cenários infinitos" },
    { name: "Teleprompter", description: "Gravações fluidas" },
    { name: "Painéis Touch", description: "Controle de iluminação" },
    { name: "Blackmagic 6K", description: "Qualidade cinematográfica" },
    { name: "Drone FPV", description: "Tomadas aéreas únicas" }
  ];

  // Usos da IA
  const aiApplications = [
    "Análise de linguagem e tom de voz ideal",
    "Brainstorm criativo com IA generativa",
    "Produção acelerada de rascunhos, scripts e headlines",
    "Otimização de anúncios com machine learning"
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
      toast.success('Obrigado! Nossa equipe entrará em contato para marcar a conversa estratégica e entregar o manual.');
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
      {/* Hero Section Estratégico */}
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

      {/* Missão Estratégica */}
      <section className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-[#00FFAB]">Transformamos ideias</span> em campanhas memoráveis.
          </h2>
          <div className="max-w-4xl mx-auto text-lg md:text-xl text-gray-300 leading-relaxed space-y-6">
            <p>
              Na Indexa, criar uma campanha não é apenas rodar um anúncio. É mergulhar na essência da marca, extrair sua verdade mais profunda e transformá-la em movimento, linguagem e conexão real com seu público.
            </p>
            <p className="text-2xl text-white font-semibold">
              Antes de ligar as câmeras, ligamos o cérebro e o coração.
            </p>
            <p>
              Ajudamos marcas a se comunicarem de forma poderosa com seus públicos. Começamos entendendo a essência da empresa em reuniões profundas com nossos especialistas. Depois, traduzimos tudo isso em uma campanha estruturada: <strong className="text-[#00FFAB]">estratégia + branding + linguagem + conteúdo + tráfego + performance.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Planejamento */}
      <section className="py-20 bg-gradient-to-b from-black to-[#3C1361]/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <Search className="h-12 w-12 text-[#00FFAB] mr-4" />
              <h2 className="text-4xl md:text-5xl font-bold">
                Tudo começa com <span className="text-[#00FFAB]">planejamento</span>
              </h2>
            </div>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Reunimos nossos especialistas em posicionamento, linguagem e estratégia para entender a fundo sua empresa, seus valores, seus diferenciais e seus objetivos. Nessa imersão criativa e analítica, desenhamos um plano robusto e sob medida que direciona toda a campanha.
            </p>
            <p className="text-2xl text-[#00FFAB] font-bold mt-6">
              Essa é a base de toda campanha de verdade.
            </p>
          </div>
        </div>
      </section>

      {/* Framework TACOH Estratégico */}
      <section className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              O FRAMEWORK EXCLUSIVO INDEXA: <span className="text-[#00FFAB]">TACOH™</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Cada campanha é construída com base no nosso método proprietário TACOH, que garante que sua empresa comunique com clareza, emoção e resultado.
            </p>
          </div>

          {/* Tabela TACOH */}
          <div className="overflow-x-auto mb-12">
            <div className="min-w-full bg-white/5 rounded-2xl border border-white/10">
              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-3 gap-4 p-6 border-b border-white/10 bg-[#3C1361]/20">
                <div className="text-[#00FFAB] font-bold text-lg">Elemento</div>
                <div className="text-[#00FFAB] font-bold text-lg">O que fazemos</div>
                <div className="text-[#00FFAB] font-bold text-lg">Por que importa</div>
              </div>
              
              {/* Linhas da tabela */}
              {tacohFramework.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 p-6 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3 font-bold text-white">{item.title}</span>
                  </div>
                  <div className="text-gray-300">{item.description}</div>
                  <div className="text-[#00FFAB] font-semibold">{item.application}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cards do Framework para mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:hidden">
            {tacohFramework.map((item, index) => (
              <Card key={index} className={`${item.bgColor} border-none text-white hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden group`}>
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    {item.icon}
                    <h3 className="text-2xl font-bold ml-3">{item.title}</h3>
                  </div>
                  <p className="text-white/90 leading-relaxed flex-1 mb-4">{item.description}</p>
                  <div className="text-[#00FFAB] font-semibold text-sm">
                    {item.application}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Processo Estratégico */}
      <section className="py-20 bg-gradient-to-b from-black to-[#3C1361]/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Jornada de Campanha <span className="text-[#00FFAB]">Indexa</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Processo estratégico em 6 etapas para campanhas que geram resultados reais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-[#3C1361] to-[#00FFAB] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
                <div className="mb-3">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#00FFAB]">{step.title}</h3>
                <p className="text-gray-300 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conteúdos Sensoriais */}
      <section className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              🎬 Conteúdos Sensoriais, <span className="text-[#00FFAB]">Gravados em Estúdio Cinematográfico</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8">
              Utilizamos técnicas de resposta sensorial para criar vídeos que emocionam, prendem atenção e permanecem na memória.
            </p>
            <div className="text-lg text-white space-y-2">
              <p>🎯 <strong>Um de cada tipo.</strong></p>
              <p>📌 <strong>Para cada pilar.</strong></p>
              <p>🚀 <strong>Para que nenhuma empresa dependa de sorte na comunicação.</strong></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {studioEquipment.map((equipment, index) => (
              <Card key={index} className="bg-white/5 border-white/10 text-white hover:scale-105 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Camera className="h-8 w-8 text-[#00FFAB] mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">{equipment.name}</h3>
                  <p className="text-gray-300 text-sm">{equipment.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-lg text-gray-300">
            Da essência ao resultado, você está em boas mãos.
          </p>
        </div>
      </section>

      {/* IA + Marketing */}
      <section className="py-20 bg-gradient-to-r from-[#3C1361]/30 to-[#00FFAB]/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              🤖 IA + MARKETING: <span className="text-[#00FFAB]">A NOVA ERA É AGORA</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8">
              Utilizamos inteligência artificial para potencializar todas as fases da campanha:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {aiApplications.map((application, index) => (
              <div key={index} className="flex items-center bg-white/5 rounded-lg p-4 border border-white/10">
                <Lightbulb className="h-6 w-6 text-[#00FFAB] mr-4 flex-shrink-0" />
                <span className="text-white">{application}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#00FFAB]/20 border border-[#00FFAB]/50 rounded-2xl p-8 text-center">
            <Gift className="h-12 w-12 text-[#00FFAB] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#00FFAB] mb-4">Manual Gratuito Exclusivo</h3>
            <p className="text-lg text-white mb-2">
              <strong>"Como usar IA e Apps para vender mais, com menos esforço"</strong>
            </p>
            <p className="text-gray-300">
              Entregue ao agendar seu café conosco - especialmente para empresários de Foz do Iguaçu.
            </p>
          </div>
        </div>
      </section>

      {/* Entregáveis Estratégicos */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tudo que sua empresa precisa para <span className="text-[#00FFAB]">uma campanha de verdade</span>
            </h2>
            <p className="text-xl text-gray-300">
              Entregáveis estratégicos completos
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
        <section className="py-20 bg-gradient-to-b from-black to-[#3C1361]/10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Portfólio de <span className="text-[#00FFAB]">Campanhas Estratégicas</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Empresas que já dominam o mercado com nossa metodologia
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

      {/* CTA Café com Estratégia */}
      <section className="py-16 bg-gradient-to-r from-[#3C1361] to-[#2A0D47]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ☕ Agende um café com a estratégia
          </h2>
          <p className="text-xl text-[#00FFAB] font-semibold mb-2">
            Campanhas incríveis nascem de boas conversas.
          </p>
          <p className="text-lg text-white">
            Você está a um café de transformar sua empresa.
          </p>
        </div>
      </section>

      {/* Formulário Estratégico */}
      <section ref={formRef} id="form-section" className="py-20 bg-gradient-to-b from-black to-[#3C1361]/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Agende uma conversa com <span className="text-[#00FFAB]">nossos especialistas</span>
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
                      <h4 className="text-[#00FFAB] font-semibold mb-3 text-lg">🎁 Benefícios ao agendar:</h4>
                      <ul className="text-white space-y-2">
                        <li className="flex items-center"><Eye className="h-4 w-4 mr-3 text-[#00FFAB]" />Diagnóstico inicial gratuito com especialista</li>
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
