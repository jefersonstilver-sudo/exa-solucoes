
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Zap, Clock, Users, CheckCircle, Star, TrendingUp, Award, Bot, Phone, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import HeroSection from '@/components/sou-sindico/HeroSection';
import AboutSection from '@/components/sou-sindico/AboutSection';
import BenefitsSection from '@/components/sou-sindico/BenefitsSection';
import HowItWorksSection from '@/components/sou-sindico/HowItWorksSection';
import WhatsAppSection from '@/components/sou-sindico/WhatsAppSection';
import TestimonialsSection from '@/components/sou-sindico/TestimonialsSection';
import ExclusiveBenefitsSection from '@/components/sou-sindico/ExclusiveBenefitsSection';
import InterestFormSection from '@/components/sou-sindico/InterestFormSection';
import FinalCTASection from '@/components/sou-sindico/FinalCTASection';
import { SindicoFormData, Benefit, HowItWorksStep, Testimonial } from '@/components/sou-sindico/types';

const SouSindico = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SindicoFormData>({
    nomeCompleto: '',
    nomePredio: '',
    endereco: '',
    numeroAndares: '',
    numeroUnidades: '',
    email: '',
    celular: ''
  });

  const heroRef = useRef<HTMLElement>(null);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section');
            if (sectionId) {
              setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
            }
            if (entry.target === heroRef.current) {
              setIsVisible(true);
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    Object.values(sectionsRef.current).forEach(section => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('sindicos_interessados')
        .insert({
          nome_completo: formData.nomeCompleto,
          nome_predio: formData.nomePredio,
          endereco: formData.endereco,
          numero_andares: parseInt(formData.numeroAndares),
          numero_unidades: parseInt(formData.numeroUnidades),
          email: formData.email,
          celular: formData.celular
        });

      if (error) {
        console.error('Erro ao enviar formulário:', error);
        toast.error('Erro ao enviar formulário. Tente novamente.');
      } else {
        toast.success('Formulário enviado com sucesso! Nossa equipe entrará em contato em breve.');
        setFormData({
          nomeCompleto: '',
          nomePredio: '',
          endereco: '',
          numeroAndares: '',
          numeroUnidades: '',
          email: '',
          celular: ''
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits: Benefit[] = [
    { icon: MessageSquare, title: 'Comunicação via WhatsApp', desc: 'Gerencie tudo direto pelo WhatsApp, sem complicação' },
    { icon: Bot, title: 'IA Especializada', desc: 'Assistente inteligente para facilitar suas tarefas' },
    { icon: Zap, title: 'Avisos em 20 minutos', desc: 'Publique comunicados instantaneamente' },
    { icon: TrendingUp, title: 'Zero papel e burocracia', desc: 'Gestão 100% digital e sustentável' },
    { icon: Award, title: 'Modernização do prédio', desc: 'Valorize seu condomínio com tecnologia' },
    { icon: Users, title: 'Suporte 24h', desc: 'Assistência técnica sempre disponível' },
    { icon: CheckCircle, title: 'Sem custos de instalação', desc: 'Implementação gratuita e manutenção incluída' }
  ];

  const howItWorksSteps: HowItWorksStep[] = [
    { step: '1', title: 'Instalação gratuita', desc: 'Nossa equipe instala o painel sem custo', icon: Building2 },
    { step: '2', title: 'WhatsApp conectado', desc: 'Receba acesso ao nosso bot especializado', icon: MessageSquare },
    { step: '3', title: 'Publique com facilidade', desc: 'Envie textos ou imagens pelo WhatsApp', icon: Zap },
    { step: '4', title: 'Avisos no ar em 20min', desc: 'Moradores veem as informações no elevador', icon: Users }
  ];

  const testimonials: Testimonial[] = [
    { text: 'Nunca foi tão fácil comunicar com os moradores. Pelo WhatsApp é muito simples!', author: 'Carlos Silva', building: 'Edifício Gardens' },
    { text: 'Em 20 minutos o aviso já está no elevador. A praticidade é incrível.', author: 'Maria Santos', building: 'Residencial Plaza' }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
        {/* Partículas de fundo */}
        <div className="fixed inset-0 z-0">
          <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60" />
          <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-40 delay-1000" />
          <div className="absolute bottom-60 left-1/4 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse opacity-50 delay-2000" />
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-300 rounded-full animate-pulse opacity-30 delay-3000" />
        </div>

        {/* Sections */}
        <section ref={heroRef}>
          <HeroSection isVisible={isVisible} />
        </section>

        <section 
          ref={(el) => { sectionsRef.current['about'] = el; }}
          data-section="about"
        >
          <AboutSection isVisible={visibleSections['about']} />
        </section>

        <section 
          ref={(el) => { sectionsRef.current['benefits'] = el; }}
          data-section="benefits"
        >
          <BenefitsSection isVisible={visibleSections['benefits']} benefits={benefits} />
        </section>

        <section 
          ref={(el) => { sectionsRef.current['how-it-works'] = el; }}
          data-section="how-it-works"
        >
          <HowItWorksSection isVisible={visibleSections['how-it-works']} steps={howItWorksSteps} />
        </section>

        <section 
          ref={(el) => { sectionsRef.current['whatsapp'] = el; }}
          data-section="whatsapp"
        >
          <WhatsAppSection isVisible={visibleSections['whatsapp']} />
        </section>

        <section 
          ref={(el) => { sectionsRef.current['testimonials'] = el; }}
          data-section="testimonials"
        >
          <TestimonialsSection isVisible={visibleSections['testimonials']} testimonials={testimonials} />
        </section>

        <section 
          ref={(el) => { sectionsRef.current['exclusive'] = el; }}
          data-section="exclusive"
        >
          <ExclusiveBenefitsSection isVisible={visibleSections['exclusive']} />
        </section>

        <section 
          ref={(el) => { sectionsRef.current['form'] = el; }}
          data-section="form"
        >
          <InterestFormSection 
            isVisible={visibleSections['form']} 
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </section>

        <section 
          ref={(el) => { sectionsRef.current['final-cta'] = el; }}
          data-section="final-cta"
        >
          <FinalCTASection isVisible={visibleSections['final-cta']} />
        </section>

        {/* WhatsApp Fixo */}
        <a
          href="https://wa.me/5545999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110"
        >
          <Phone className="w-8 h-8 text-white" />
        </a>
      </div>
    </Layout>
  );
};

export default SouSindico;
