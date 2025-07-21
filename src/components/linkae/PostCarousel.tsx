
import React, { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import PostCard from './PostCard';

const postsData = [
  {
    id: 1,
    title: "Restaurante Italiano",
    beforeText: "Foto básica do prato com descrição simples: 'Nosso delicioso risotto'",
    afterText: "História completa: 'O segredo da Nonna Maria em cada grão de arroz. Uma receita de família que aquece o coração há 3 gerações.'",
    category: "Gastronomia"
  },
  {
    id: 2,
    title: "Loja de Roupas",
    beforeText: "Produto isolado: 'Vestido disponível em várias cores, R$ 120'",
    afterText: "Conexão emocional: 'Para aquela reunião importante onde você quer se sentir confiante e poderosa. Seu momento de brilhar chegou.'",
    category: "Moda"
  },
  {
    id: 3,
    title: "Clínica Odontológica",
    beforeText: "Informação técnica: 'Fazemos implantes dentários com tecnologia avançada'",
    afterText: "Transformação pessoal: 'Sorrir sem medo, falar com confiança, comer o que ama. Sua autoestima merece esse cuidado especial.'",
    category: "Saúde"
  },
  {
    id: 4,
    title: "Personal Trainer",
    beforeText: "Convite simples: 'Aulas de musculação todas as terças'",
    afterText: "Jornada inspiradora: 'Da insegurança à força interior. Cada movimento é um passo em direção à sua melhor versão.'",
    category: "Fitness"
  },
  {
    id: 5,
    title: "Evento Corporativo",
    beforeText: "Informação básica: 'Workshop sobre vendas dia 15/01'",
    afterText: "Buzz viral: 'O dia que sua carreira vai mudar para sempre. 200 vagas, 2000 inscritos. Você vai estar lá?'",
    category: "Eventos"
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
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
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

  return (
    <div className="relative">
      {/* Carrossel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {postsData.map((post, index) => (
            <div 
              key={post.id} 
              className="flex-none w-full md:w-1/2 lg:w-1/3"
            >
              <PostCard
                title={post.title}
                beforeText={post.beforeText}
                afterText={post.afterText}
                category={post.category}
                isActive={selectedIndex === index}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots Navigation */}
      <div className="flex justify-center mt-8 space-x-2">
        {postsData.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              selectedIndex === index
                ? 'bg-gradient-to-r from-linkae-pink to-linkae-orange scale-125'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PostCarousel;
