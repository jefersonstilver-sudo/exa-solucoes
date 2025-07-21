
import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import PostCard from './PostCard';
import { ChevronLeft, ChevronRight, Store, Stethoscope, Calendar, ChefHat, Dumbbell, ShoppingBag } from 'lucide-react';

const postsData = [
  {
    id: 1,
    title: "Restaurante Italiano",
    beforeText: "Foto básica do prato com descrição simples: 'Nosso delicioso risotto'",
    afterText: "História completa: 'O segredo da Nonna Maria em cada grão de arroz. Uma receita de família que aquece o coração há 3 gerações.'",
    category: "Gastronomia",
    icon: <ChefHat className="w-5 h-5 text-linkae-orange" />,
    metrics: {
      roi: "+240%",
      engagement: "89%",
      timeframe: "30 dias"
    }
  },
  {
    id: 2,
    title: "Loja de Roupas",
    beforeText: "Produto isolado: 'Vestido disponível em várias cores, R$ 120'",
    afterText: "Conexão emocional: 'Para aquela reunião importante onde você quer se sentir confiante e poderosa. Seu momento de brilhar chegou.'",
    category: "Moda",
    icon: <Store className="w-5 h-5 text-linkae-pink" />,
    metrics: {
      roi: "+180%",
      engagement: "76%",
      timeframe: "45 dias"
    }
  },
  {
    id: 3,
    title: "Clínica Odontológica",
    beforeText: "Informação técnica: 'Fazemos implantes dentários com tecnologia avançada'",
    afterText: "Transformação pessoal: 'Sorrir sem medo, falar com confiança, comer o que ama. Sua autoestima merece esse cuidado especial.'",
    category: "Saúde",
    icon: <Stethoscope className="w-5 h-5 text-linkae-cyan-light" />,
    metrics: {
      roi: "+320%",
      engagement: "94%",
      timeframe: "60 dias"
    }
  },
  {
    id: 4,
    title: "Personal Trainer",
    beforeText: "Convite simples: 'Aulas de musculação todas as terças'",
    afterText: "Jornada inspiradora: 'Da insegurança à força interior. Cada movimento é um passo em direção à sua melhor versão.'",
    category: "Fitness",
    icon: <Dumbbell className="w-5 h-5 text-linkae-bright-blue" />,
    metrics: {
      roi: "+200%",
      engagement: "82%",
      timeframe: "21 dias"
    }
  },
  {
    id: 5,
    title: "Evento Corporativo",
    beforeText: "Informação básica: 'Workshop sobre vendas dia 15/01'",
    afterText: "Buzz viral: 'O dia que sua carreira vai mudar para sempre. 200 vagas, 2000 inscritos. Você vai estar lá?'",
    category: "Eventos",
    icon: <Calendar className="w-5 h-5 text-linkae-royal-blue" />,
    metrics: {
      roi: "+450%",
      engagement: "97%",
      timeframe: "14 dias"
    }
  }
];

const PostCarousel: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'center',
      containScroll: 'trimSnaps',
      slidesToScroll: 1
    },
    [Autoplay({ delay: 6000, stopOnInteraction: true })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative max-w-7xl mx-auto">
      {/* Header com counter e controles */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 font-medium">
            Caso {selectedIndex + 1} de {postsData.length}
          </div>
          <div className="h-1 w-24 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-linkae-royal-blue to-linkae-bright-blue rounded-full transition-all duration-300"
              style={{ width: `${((selectedIndex + 1) / postsData.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Controles de navegação */}
        <div className="flex items-center gap-2">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              canScrollPrev 
                ? 'border-linkae-royal-blue text-linkae-royal-blue hover:bg-linkae-royal-blue hover:text-white' 
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              canScrollNext 
                ? 'border-linkae-royal-blue text-linkae-royal-blue hover:bg-linkae-royal-blue hover:text-white' 
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carrossel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-8">
          {postsData.map((post, index) => (
            <div 
              key={post.id} 
              className="flex-none w-full md:w-1/2 lg:w-1/2 xl:w-1/3"
            >
              <PostCard
                title={post.title}
                beforeText={post.beforeText}
                afterText={post.afterText}
                category={post.category}
                isActive={selectedIndex === index}
                metrics={post.metrics}
                icon={post.icon}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnails de navegação */}
      <div className="flex justify-center mt-8 space-x-3">
        {postsData.map((post, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`group relative p-3 rounded-lg border-2 transition-all duration-300 ${
              selectedIndex === index
                ? 'border-linkae-royal-blue bg-linkae-royal-blue/5'
                : 'border-gray-200 hover:border-linkae-royal-blue/50 hover:bg-gray-50'
            }`}
            aria-label={`Ir para ${post.title}`}
          >
            <div className="flex items-center gap-2">
              {post.icon}
              <div className="text-left">
                <div className={`text-xs font-medium ${
                  selectedIndex === index ? 'text-linkae-royal-blue' : 'text-gray-600'
                }`}>
                  {post.category}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-24">
                  {post.title}
                </div>
              </div>
            </div>
            
            {/* Indicador ativo */}
            {selectedIndex === index && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-linkae-royal-blue rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Estatísticas gerais */}
      <div className="mt-12 bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-linkae-dark-blue">+275%</div>
            <div className="text-sm text-gray-600">ROI Médio</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-linkae-dark-blue">87%</div>
            <div className="text-sm text-gray-600">Engajamento</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-linkae-dark-blue">34 dias</div>
            <div className="text-sm text-gray-600">Prazo Médio</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-linkae-dark-blue">5 setores</div>
            <div className="text-sm text-gray-600">Especializações</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCarousel;
