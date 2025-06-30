
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
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Jornada de Campanha <span className="text-[#00B377]">Indexa</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
              <h3 className="text-xl font-bold mb-3 text-[#00B377]">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;
