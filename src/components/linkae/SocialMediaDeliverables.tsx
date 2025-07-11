import React from 'react';
import { Check } from 'lucide-react';

const SocialMediaDeliverables: React.FC = () => {
  const deliverables = [
    { item: "Estratégia completa para redes sociais", included: true, highlight: false },
    { item: "Calendário editorial mensal", included: true, highlight: true },
    { item: "20 posts profissionais por mês", included: true, highlight: false },
    { item: "Stories diários", included: true, highlight: true },
    { item: "Copywriting otimizado", included: true, highlight: false },
    { item: "Gestão de comunidade", included: true, highlight: true },
    { item: "Relatório mensal de resultados", included: true, highlight: false },
    { item: "Hashtags estratégicas", included: true, highlight: false },
    { item: "Shooting mensal de fotos", included: true, highlight: true },
    { item: "Vídeos para Reels/TikTok", included: true, highlight: false },
    { item: "Monitoramento de concorrência", included: true, highlight: false },
    { item: "Suporte via WhatsApp", included: true, highlight: true }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            O que você recebe com a <span className="text-[#00B377]">LINKAÊ</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Pacote completo de social media para transformar suas redes sociais
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
          <div className="grid gap-4">
            {deliverables.map((deliverable, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  deliverable.highlight ? 'bg-gradient-to-r from-[#00FFAB]/20 to-[#00B377]/20' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-[#00B377] flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{deliverable.item}</span>
                </div>
                {deliverable.highlight && (
                  <span className="bg-[#00FFAB] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Premium
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialMediaDeliverables;