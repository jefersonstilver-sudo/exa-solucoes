
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
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Tudo que sua empresa precisa para <span className="text-[#00B377]">uma campanha de verdade</span>
          </h2>
          <p className="text-xl text-gray-600">
            Entregáveis estratégicos completos
          </p>
        </div>

        <Card className="bg-white shadow-lg border border-gray-200">
          <CardContent className="p-8">
            <div className="space-y-4">
              {deliverables.map((item, index) => (
                <div key={index} className={`flex items-center p-4 rounded-lg ${
                  item.highlight ? 'bg-[#00FFAB]/10 border border-[#00FFAB]/30' : 'bg-gray-50'
                }`}>
                  <CheckCircle className="h-6 w-6 text-green-400 mr-4 flex-shrink-0" />
                  <span className={`text-lg ${item.highlight ? 'text-[#00B377] font-semibold' : 'text-gray-900'}`}>
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
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DeliverablesSection;
