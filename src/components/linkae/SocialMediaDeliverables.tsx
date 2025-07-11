import React from 'react';
import { Check } from 'lucide-react';

const SocialMediaDeliverables: React.FC = () => {
  const deliverables = [
    { item: "Estratégia completa personalizada", included: true, highlight: false },
    { item: "Planejamento editorial estratégico", included: true, highlight: true },
    { item: "Produção de conteúdo profissional", included: true, highlight: false },
    { item: "Stories e conteúdo interativo", included: true, highlight: true },
    { item: "Copywriting que converte", included: true, highlight: false },
    { item: "Gestão ativa da comunidade", included: true, highlight: true },
    { item: "Relatórios detalhados de performance", included: true, highlight: false },
    { item: "Pesquisa e implementação de hashtags", included: true, highlight: false },
    { item: "Produção de conteúdo visual", included: true, highlight: true },
    { item: "Vídeos otimizados para cada plataforma", included: true, highlight: false },
    { item: "Análise competitiva contínua", included: true, highlight: false },
    { item: "Suporte prioritário direto", included: true, highlight: true }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Serviços <span className="text-linkae-green">LINKAÊ</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Estratégia completa para dominar suas redes sociais e converter seguidores em clientes
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