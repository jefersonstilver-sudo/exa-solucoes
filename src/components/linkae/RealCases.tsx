
import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Quote, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

const RealCases: React.FC = () => {
  const cases = [
    {
      id: 1,
      segment: "Academia",
      problem: "Poucos alunos novos e baixo engajamento",
      solution: "Técnica (T) + Autoridade (A) do método T.A.C.C.O.H.",
      result: "+250% agendamentos",
      metrics: { followers: "5.2k", engagement: "8.5%", leads: "120" },
      testimonial: "Em 2 meses conseguimos triplicar os agendamentos. O método funciona!",
      client: "João Silva, Dono da CrossFit Elite"
    },
    {
      id: 2,
      segment: "Clínica Odontológica",
      problem: "Dificuldade em transmitir confiança online",
      solution: "Autoridade (A) + Crescimento (C) + Conexão (C) aplicados",
      result: "+400% conversões",
      metrics: { followers: "3.8k", engagement: "12.3%", leads: "85" },
      testimonial: "Pacientes chegam já confiando no nosso trabalho. A autoridade digital fez toda diferença.",
      client: "Dra. Maria Santos, Cirurgiã-Dentista"
    },
    {
      id: 3,
      segment: "Loja de Roupas",
      problem: "Vendas online estagnadas há meses",
      solution: "Conexão (C) + Otimização (O) + Humanização (H) implementadas",
      result: "+180% vendas online",
      metrics: { followers: "12.1k", engagement: "6.8%", leads: "340" },
      testimonial: "Saímos de R$ 8mil para R$ 22mil em vendas mensais. Incrível!",
      client: "Ana Costa, Proprietária da Loja Moda & Estilo"
    },
    {
      id: 4,
      segment: "Consultoria Empresarial",
      problem: "Dificuldade em demonstrar expertise",
      solution: "Método T.A.C.C.O.H. completo aplicado",
      result: "+320% leads qualificados",
      metrics: { followers: "7.9k", engagement: "9.2%", leads: "95" },
      testimonial: "Agora sou visto como referência no meu segmento. Clientes me procuram diariamente.",
      client: "Roberto Lima, Consultor Empresarial"
    }
  ];

  const MetricCard = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-linkae-orange" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Casos <span className="text-linkae-pink">Reais</span> de Sucesso
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Clientes que transformaram seus negócios com o método T.A.C.C.O.H.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {cases.map((case_study, index) => (
                <CarouselItem key={case_study.id} className="md:basis-1/2 lg:basis-1/2">
                  <div className="bg-white rounded-2xl shadow-xl p-8 mx-2 h-full">
                    {/* Header */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-gradient-to-r from-linkae-pink to-linkae-orange text-white px-4 py-2 rounded-full font-semibold text-sm">
                          {case_study.segment}
                        </span>
                        <div className="bg-gradient-to-r from-linkae-pink to-linkae-orange text-white px-4 py-2 rounded-lg font-bold text-lg">
                          {case_study.result}
                        </div>
                      </div>
                    </div>

                    {/* Problem & Solution */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">🚫 Problema:</h4>
                        <p className="text-gray-600">{case_study.problem}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">✅ Solução T.A.C.C.O.H.:</h4>
                        <p className="text-gray-600">{case_study.solution}</p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                      <MetricCard icon={Users} label="Seguidores" value={case_study.metrics.followers} />
                      <MetricCard icon={TrendingUp} label="Engajamento" value={case_study.metrics.engagement} />
                      <MetricCard icon={DollarSign} label="Leads/mês" value={case_study.metrics.leads} />
                    </div>

                    {/* Testimonial */}
                    <div className="bg-gradient-to-br from-linkae-pink/10 to-linkae-orange/10 rounded-lg p-4">
                      <Quote className="w-6 h-6 text-linkae-pink mb-2" />
                      <p className="text-gray-700 italic mb-3">"{case_study.testimonial}"</p>
                      <p className="text-sm font-semibold text-gray-900">- {case_study.client}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default RealCases;
