
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Gift } from 'lucide-react';

const DeliverablesSection: React.FC = () => {
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

  return (
    <section className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-20 left-20 w-60 h-60 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Tudo que sua empresa precisa para <span className="bg-gradient-to-r from-indexa-mint to-indexa-purple bg-clip-text text-transparent">uma campanha de verdade</span>
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-xl text-white/90">
              Entregáveis estratégicos completos
            </p>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm shadow-2xl border border-white/20">
          <CardContent className="p-8">
            <div className="space-y-4">
              {deliverables.map((item, index) => (
                <div key={index} className={`flex items-center p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${
                  item.highlight 
                    ? 'bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 border-indexa-mint/50 shadow-lg shadow-indexa-mint/20' 
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}>
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-1 rounded-full mr-4 flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-lg ${item.highlight ? 'text-indexa-mint font-semibold' : 'text-white'}`}>
                    {item.item}
                  </span>
                  {item.highlight && (
                    <Badge className="ml-auto bg-gradient-to-r from-indexa-mint to-indexa-purple text-white border-0">
                      <Gift className="h-3 w-3 mr-1" />
                      Gratuito
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DeliverablesSection;
