import React, { useState, useRef, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, TrendingUp, Users, Award } from 'lucide-react';

const TestimonialsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const testimonials = [
    {
      id: 1,
      name: "Carlos Eduardo Martins",
      position: "CEO",
      company: "TechCorp Solutions",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "A INDEXA transformou completamente nossa comunicação corporativa. O vídeo institucional que produziram gerou 40% mais leads qualificados em apenas 3 meses. A qualidade é cinematográfica e o método T.A.C.C.O.H. realmente funciona.",
      rating: 5,
      results: "40% mais leads qualificados",
      category: "Vídeo Corporativo"
    },
    {
      id: 2,
      name: "Ana Paula Silva",
      position: "Diretora de Marketing",
      company: "Innovation Labs",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b13c?w=100&h=100&fit=crop&crop=face",
      content: "A cobertura do nosso evento de lançamento foi impecável. A equipe da INDEXA capturou cada momento importante e ainda fez a transmissão ao vivo sem nenhum problema técnico. Superaram todas as expectativas.",
      rating: 5,
      results: "R$ 1.8M arrecadados no evento",
      category: "Evento Corporativo"
    },
    {
      id: 3,
      name: "Ricardo Santos",
      position: "Diretor Geral",
      company: "EcoGroup Brasil",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "O vídeo de sustentabilidade com drones ficou espetacular. Conseguimos mostrar nossos projetos de uma forma que nunca imaginamos. O vídeo foi fundamental para ganharmos o prêmio de sustentabilidade do setor.",
      rating: 5,
      results: "Prêmio de Sustentabilidade conquistado",
      category: "Produção com Drones"
    },
    {
      id: 4,
      name: "Marina Costa",
      position: "Head de RH",
      company: "GlobalCorp",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content: "A série de vídeos para nossa cultura organizacional foi um sucesso total. O engajamento dos colaboradores aumentou 85% e conseguimos reduzir significativamente o turnover. Investimento que se pagou rapidamente.",
      rating: 5,
      results: "85% aumento no engajamento",
      category: "Cultura Organizacional"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-indexa-mint/10 text-indexa-purple px-6 py-3 rounded-full text-sm font-bold mb-6">
            <Award className="w-5 h-5" />
            Clientes Satisfeitos
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            O Que Nossos Clientes
            <span className="block text-indexa-purple">Dizem Sobre Nós</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Resultados reais de empresas que confiaram na INDEXA para transformar sua comunicação audiovisual.
          </p>
        </div>

        {/* Main Testimonial */}
        <div className={`max-w-4xl mx-auto mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-enhanced border border-gray-100 relative">
            {/* Quote Icon */}
            <div className="absolute -top-6 left-8 bg-indexa-purple rounded-full p-4">
              <Quote className="w-8 h-8 text-white" />
            </div>

            {/* Category Badge */}
            <div className="absolute -top-3 right-8 bg-indexa-mint text-indexa-purple px-4 py-2 rounded-full text-sm font-bold">
              {testimonials[currentTestimonial].category}
            </div>

            {/* Content */}
            <div className="pt-8">
              {/* Rating */}
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Testimonial Text */}
              <blockquote className="text-xl md:text-2xl text-gray-700 text-center leading-relaxed mb-8 italic">
                "{testimonials[currentTestimonial].content}"
              </blockquote>

              {/* Result Highlight */}
              <div className="bg-gradient-to-r from-indexa-purple/10 to-indexa-mint/10 rounded-xl p-4 mb-8 text-center">
                <div className="text-sm text-indexa-purple font-medium mb-1">Resultado Obtido:</div>
                <div className="text-lg font-bold text-indexa-purple">
                  {testimonials[currentTestimonial].results}
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center justify-center gap-4">
                <img 
                  src={testimonials[currentTestimonial].avatar}
                  alt={testimonials[currentTestimonial].name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indexa-mint"
                />
                <div className="text-left">
                  <div className="font-bold text-gray-900 text-lg">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-indexa-purple font-medium">
                    {testimonials[currentTestimonial].position}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {testimonials[currentTestimonial].company}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
              <button 
                onClick={prevTestimonial}
                className="bg-white/90 hover:bg-white text-indexa-purple rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 pointer-events-auto"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextTestimonial}
                className="bg-white/90 hover:bg-white text-indexa-purple rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 pointer-events-auto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Testimonial Indicators */}
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentTestimonial === index 
                    ? 'bg-indexa-purple w-8' 
                    : 'bg-gray-300 hover:bg-indexa-purple/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="bg-indexa-purple/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-indexa-purple" />
            </div>
            <div className="text-2xl font-bold text-indexa-purple mb-2">+300%</div>
            <div className="text-gray-600">Aumento médio no engajamento</div>
          </div>
          
          <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="bg-indexa-mint/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-indexa-purple" />
            </div>
            <div className="text-2xl font-bold text-indexa-purple mb-2">98%</div>
            <div className="text-gray-600">Taxa de satisfação dos clientes</div>
          </div>
          
          <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="bg-indexa-purple/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Award className="w-8 h-8 text-indexa-purple" />
            </div>
            <div className="text-2xl font-bold text-indexa-purple mb-2">100%</div>
            <div className="text-gray-600">Taxa de renovação de contratos</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;