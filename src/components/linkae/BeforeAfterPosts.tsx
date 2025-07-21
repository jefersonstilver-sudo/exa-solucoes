
import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ArrowRight, TrendingUp, Heart, MessageCircle, Share2 } from 'lucide-react';

const BeforeAfterPosts: React.FC = () => {
  const comparisons = [
    {
      id: 1,
      category: "Academia",
      before: {
        image: "/api/placeholder/300/300",
        description: "Post genérico sem estratégia",
        metrics: { likes: 12, comments: 2, shares: 0 }
      },
      after: {
        image: "/api/placeholder/300/300", 
        description: "Post com técnica TACCOH aplicada",
        metrics: { likes: 234, comments: 45, shares: 12 }
      },
      improvement: "+95% engajamento"
    },
    {
      id: 2,
      category: "Clínica",
      before: {
        image: "/api/placeholder/300/300",
        description: "Conteúdo sem planejamento",
        metrics: { likes: 8, comments: 1, shares: 0 }
      },
      after: {
        image: "/api/placeholder/300/300",
        description: "Estratégia de autoridade implementada",
        metrics: { likes: 187, comments: 23, shares: 8 }
      },
      improvement: "+280% engajamento"
    },
    {
      id: 3,
      category: "Loja",
      before: {
        image: "/api/placeholder/300/300",
        description: "Post promocional básico",
        metrics: { likes: 15, comments: 3, shares: 1 }
      },
      after: {
        image: "/api/placeholder/300/300",
        description: "Conteúdo com storytelling e CTA",
        metrics: { likes: 298, comments: 56, shares: 18 }
      },
      improvement: "+340% engajamento"
    }
  ];

  const MetricBadge = ({ icon: Icon, value }: { icon: React.ElementType, value: number }) => (
    <div className="flex items-center gap-1 text-xs text-gray-600">
      <Icon className="w-3 h-3" />
      <span>{value}</span>
    </div>
  );

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Antes e Depois: <span className="text-linkae-pink">Resultados Reais</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Veja como o método T.A.C.C.O.H. transforma posts comuns em conteúdo que engaja e converte
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
              {comparisons.map((comparison, index) => (
                <CarouselItem key={comparison.id} className="md:basis-1/1 lg:basis-1/1">
                  <div className="bg-white rounded-2xl shadow-xl p-8 mx-2">
                    <div className="text-center mb-8">
                      <span className="inline-block bg-linkae-orange text-white px-4 py-2 rounded-full font-semibold text-sm mb-4">
                        {comparison.category}
                      </span>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Transformação com T.A.C.C.O.H.
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      {/* ANTES */}
                      <div className="space-y-4">
                        <div className="bg-gray-100 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm">
                              A
                            </span>
                            ANTES
                          </h4>
                          <div className="bg-gray-200 rounded-lg aspect-square mb-3 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">Post sem estratégia</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{comparison.before.description}</p>
                          <div className="flex gap-4">
                            <MetricBadge icon={Heart} value={comparison.before.metrics.likes} />
                            <MetricBadge icon={MessageCircle} value={comparison.before.metrics.comments} />
                            <MetricBadge icon={Share2} value={comparison.before.metrics.shares} />
                          </div>
                        </div>
                      </div>

                      {/* SETA */}
                      <div className="flex justify-center">
                        <div className="bg-gradient-to-r from-linkae-pink to-linkae-orange p-4 rounded-full">
                          <ArrowRight className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* DEPOIS */}
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-linkae-pink/10 to-linkae-orange/10 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-gradient-to-r from-linkae-pink to-linkae-orange rounded-full flex items-center justify-center text-white text-sm">
                              D
                            </span>
                            DEPOIS
                          </h4>
                          <div className="bg-gradient-to-br from-linkae-pink/20 to-linkae-orange/20 rounded-lg aspect-square mb-3 flex items-center justify-center">
                            <span className="text-gray-700 text-sm font-medium">Post estratégico</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{comparison.after.description}</p>
                          <div className="flex gap-4 mb-3">
                            <MetricBadge icon={Heart} value={comparison.after.metrics.likes} />
                            <MetricBadge icon={MessageCircle} value={comparison.after.metrics.comments} />
                            <MetricBadge icon={Share2} value={comparison.after.metrics.shares} />
                          </div>
                          <div className="bg-gradient-to-r from-linkae-pink to-linkae-orange text-white px-3 py-1 rounded-full text-sm font-semibold inline-block">
                            {comparison.improvement}
                          </div>
                        </div>
                      </div>
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

export default BeforeAfterPosts;
