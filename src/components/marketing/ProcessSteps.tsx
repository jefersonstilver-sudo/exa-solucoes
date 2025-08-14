
import React from 'react';
import { 
  Brain, 
  Search, 
  Target, 
  Palette, 
  Camera, 
  Gauge 
} from 'lucide-react';

const ProcessSteps: React.FC = () => {
  const processSteps = [
    {
      number: "01",
      title: "Reunião estratégica com nossa equipe",
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

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-56 h-56 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Jornada de Campanha <span className="bg-gradient-to-r from-indexa-mint to-indexa-purple bg-clip-text text-transparent">Indexa</span>
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-3xl mx-auto">
            <p className="text-xl text-white/90">
              Processo estratégico em 6 etapas para campanhas que geram resultados reais
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {processSteps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="bg-gradient-to-br from-indexa-purple to-indexa-mint w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-indexa-mint/50 transition-all duration-300 shadow-lg">
                <span className="text-white font-bold text-xl">{step.number}</span>
              </div>
              <div className="mb-4 flex justify-center">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full border border-white/20">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-indexa-mint">{step.title}</h3>
              <p className="text-white/80 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;
