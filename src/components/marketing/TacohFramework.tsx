
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Heart, 
  Shield, 
  Zap 
} from 'lucide-react';

const TacohFramework: React.FC = () => {
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

  return (
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
  );
};

export default TacohFramework;
