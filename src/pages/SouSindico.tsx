import React, { useState, useEffect, useRef } from 'react';
import { Building2, Shield, Zap, Clock, Users, CheckCircle, Star, ArrowRight, Phone, Mail, MapPin, Calendar, MessageSquare, TrendingUp, Award, Sparkles, Bot, Smartphone, Volume, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';

const SouSindico = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [formData, setFormData] = useState({
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

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const benefits = [
    { icon: MessageSquare, title: 'Comunicação via WhatsApp', desc: 'Gerencie tudo direto pelo WhatsApp, sem complicação' },
    { icon: Bot, title: 'IA Especializada', desc: 'Assistente inteligente para facilitar suas tarefas' },
    { icon: Zap, title: 'Avisos em 20 minutos', desc: 'Publique comunicados instantaneamente' },
    { icon: TrendingUp, title: 'Zero papel e burocracia', desc: 'Gestão 100% digital e sustentável' },
    { icon: Award, title: 'Modernização do prédio', desc: 'Valorize seu condomínio com tecnologia' },
    { icon: Users, title: 'Suporte 24h', desc: 'Assistência técnica sempre disponível' },
    { icon: CheckCircle, title: 'Sem custos de instalação', desc: 'Implementação gratuita e manutenção incluída' }
  ];

  const howItWorksSteps = [
    { step: '1', title: 'Instalação gratuita', desc: 'Nossa equipe instala o painel sem custo', icon: Building2 },
    { step: '2', title: 'WhatsApp conectado', desc: 'Receba acesso ao nosso bot especializado', icon: MessageSquare },
    { step: '3', title: 'Publique com facilidade', desc: 'Envie textos ou imagens pelo WhatsApp', icon: Zap },
    { step: '4', title: 'Avisos no ar em 20min', desc: 'Moradores veem as informações no elevador', icon: Users }
  ];

  const testimonials = [
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

        {/* 1. HERO SECTION */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 py-20 mt-20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20" />
          
          <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Gerencie seu condomínio
                </span>
                <span className="block text-white">
                  direto pelo WhatsApp.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                Painéis digitais + IA no WhatsApp = Comunicação simples e eficiente.
              </p>
              
              <Button 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg px-8 py-6 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-105"
                onClick={() => document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Quero modernizar meu prédio
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              <div className="relative max-w-xs mx-auto">
                <div className="relative bg-gray-800 rounded-[3rem] p-4 shadow-2xl">
                  <div className="bg-black rounded-[2.5rem] overflow-hidden">
                    <div className="h-6 bg-black relative">
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-full" />
                    </div>
                    
                    <video
                      ref={videoRef}
                      className="w-full h-80 object-cover object-top"
                      autoPlay
                      muted={isMuted}
                      loop
                      playsInline
                    >
                      <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/Videos%20sindico%20site/2dac60f0-421e-4729-ac22-0d32dc360292.MP4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9WaWRlb3Mgc2luZGljbyBzaXRlLzJkYWM2MGYwLTQyMWUtNDcyOS1hYzIyLTBkMzJkYzM2MDI5Mi5NUDQiLCJpYXQiOjE3NDg2OTY5NTksImV4cCI6MTc4MDIzMjk1OX0.sJEjs0bci_thXgU-BTrLFmuF9M8H4XFRcPpigrjQCjw" type="video/mp4" />
                    </video>
                  </div>
                </div>
                
                {/* Botão para assistir com som */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    size="sm"
                    className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 border-gray-300 shadow-lg"
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-4 h-4 mr-2" />
                        Assistir com som
                      </>
                    ) : (
                      <>
                        <Volume className="w-4 h-4 mr-2" />
                        Silenciar
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-[3rem] blur-xl" />
              </div>
            </div>
          </div>
        </section>

        {/* 2. SOBRE O PROJETO */}
        <section 
          ref={(el) => { sectionsRef.current['about'] = el; }}
          data-section="about"
          className={`py-20 px-4 relative transition-all duration-1000 ${visibleSections['about'] ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Painéis + WhatsApp + IA
              </span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20">
                <Building2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4">Painel Digital no Elevador</h3>
                <p className="text-gray-300">Substitui murais físicos por tela moderna e profissional.</p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-blue-500/20">
                <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4">Gestão via WhatsApp</h3>
                <p className="text-gray-300">Publique avisos, imagens e programe comunicados pelo WhatsApp.</p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20">
                <Bot className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4">IA Especializada</h3>
                <p className="text-gray-300">Assistente inteligente que facilita toda gestão de comunicação.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENEFÍCIOS PARA O SÍNDICO */}
        <section 
          ref={(el) => { sectionsRef.current['benefits'] = el; }}
          data-section="benefits"
          className={`py-20 px-4 bg-gray-800/30 transition-all duration-1000 ${visibleSections['benefits'] ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Benefícios para o Síndico
              </span>
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div 
                    key={index}
                    className="group bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:transform hover:scale-105"
                  >
                    <IconComponent className="w-8 h-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                    <p className="text-gray-300 text-sm">{benefit.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. COMO FUNCIONA */}
        <section 
          ref={(el) => { sectionsRef.current['how-it-works'] = el; }}
          data-section="how-it-works"
          className={`py-20 px-4 transition-all duration-1000 ${visibleSections['how-it-works'] ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Como Funciona
              </span>
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorksSteps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={index} className="text-center relative">
                    {index < howItWorksSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-400 to-transparent" />
                    )}
                    
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
                        <IconComponent className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-sm font-bold text-gray-900">
                        {step.step}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-300">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. WHATSAPP EM DESTAQUE */}
        <section 
          ref={(el) => { sectionsRef.current['whatsapp'] = el; }}
          data-section="whatsapp"
          className={`py-20 px-4 bg-gray-800/30 transition-all duration-1000 ${visibleSections['whatsapp'] ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Tudo pelo WhatsApp
              </span>
            </h2>
            
            <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 p-12 rounded-3xl border border-green-500/30">
              <MessageSquare className="w-24 h-24 text-green-400 mx-auto mb-8" />
              
              <h3 className="text-2xl font-bold mb-6">Simples como uma conversa</h3>
              
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div>
                  <h4 className="font-bold text-green-400 mb-4">📝 Publicar Avisos:</h4>
                  <p className="text-gray-300 mb-4">"Publique: Reunião de condomínio dia 15/02 às 19h no salão de festas"</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-green-400 mb-4">📸 Enviar Imagens:</h4>
                  <p className="text-gray-300 mb-4">Envie fotos de avisos, comunicados ou informações importantes</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-green-400 mb-4">⏰ Programar:</h4>
                  <p className="text-gray-300 mb-4">"Programe: Amanhã 8h - Limpeza da caixa d'água, água será interrompida"</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-green-400 mb-4">🤖 IA Ajuda:</h4>
                  <p className="text-gray-300 mb-4">Assistente inteligente formata e otimiza seus comunicados automaticamente</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. DEPOIMENTOS */}
        <section 
          ref={(el) => { sectionsRef.current['testimonials'] = el; }}
          data-section="testimonials"
          className={`py-20 px-4 transition-all duration-1000 ${visibleSections['testimonials'] ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-16">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Depoimentos Reais
              </span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 relative">
                  <div className="absolute -top-4 left-8">
                    <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center">
                      <span className="text-gray-900 text-xl font-bold">"</span>
                    </div>
                  </div>
                  
                  <p className="text-lg italic mb-6 mt-4">"{testimonial.text}"</p>
                  <div>
                    <p className="font-bold text-purple-400">{testimonial.author}</p>
                    <p className="text-gray-400 text-sm">{testimonial.building}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. VANTAGENS EXCLUSIVAS */}
        <section 
          ref={(el) => { sectionsRef.current['exclusive'] = el; }}
          data-section="exclusive"
          className={`py-20 px-4 bg-gray-800/30 transition-all duration-1000 ${visibleSections['exclusive'] ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-16">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Vantagens Exclusivas
              </span>
            </h2>
            
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-12 rounded-3xl border border-purple-500/30">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-yellow-400">Prédio Exclusivo</h3>
                  <p className="text-gray-300">Apenas 1 painel por prédio na região</p>
                </div>
                
                <div className="text-center">
                  <Star className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Síndicos Selecionados</h3>
                  <p className="text-gray-300">Análise criteriosa para participação</p>
                </div>
                
                <div className="text-center">
                  <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Pré-lançamento</h3>
                  <p className="text-gray-300">Benefícios garantidos para pioneiros</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FORMULÁRIO DE INTERESSE */}
        <section 
          id="formulario" 
          ref={(el) => { sectionsRef.current['form'] = el; }}
          data-section="form"
          className={`py-20 px-4 transition-all duration-1000 ${visibleSections['form'] ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Formulário de Interesse
                </span>
              </h2>
              <p className="text-xl text-yellow-400 font-semibold mb-4">🔥 LIMITADO!</p>
              <p className="text-lg text-gray-300">Solicite a avaliação gratuita para o seu condomínio.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-3xl border border-purple-500/20">
              <div className="grid gap-6">
                <Input
                  placeholder="Nome completo do síndico"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value})}
                  className="bg-gray-800 border-purple-500/30 text-white placeholder-gray-400"
                  required
                />
                
                <Input
                  placeholder="Nome do prédio"
                  value={formData.nomePredio}
                  onChange={(e) => setFormData({...formData, nomePredio: e.target.value})}
                  className="bg-gray-800 border-purple-500/30 text-white placeholder-gray-400"
                  required
                />
                
                <Textarea
                  placeholder="Endereço completo"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  className="bg-gray-800 border-purple-500/30 text-white placeholder-gray-400"
                  required
                />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Número de andares"
                    type="number"
                    value={formData.numeroAndares}
                    onChange={(e) => setFormData({...formData, numeroAndares: e.target.value})}
                    className="bg-gray-800 border-purple-500/30 text-white placeholder-gray-400"
                    required
                  />
                  
                  <Input
                    placeholder="Total de unidades"
                    type="number"
                    value={formData.numeroUnidades}
                    onChange={(e) => setFormData({...formData, numeroUnidades: e.target.value})}
                    className="bg-gray-800 border-purple-500/30 text-white placeholder-gray-400"
                    required
                  />
                </div>
                
                <Input
                  placeholder="E-mail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-gray-800 border-purple-500/30 text-white placeholder-gray-400"
                  required
                />
                
                <Input
                  placeholder="Celular com WhatsApp"
                  type="tel"
                  value={formData.celular}
                  onChange={(e) => setFormData({...formData, celular: e.target.value})}
                  className="bg-gray-800 border-purple-500/30 text-white placeholder-gray-400"
                  required
                />
                
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                  {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
              </div>
              
              <p className="text-center text-sm text-gray-400 mt-6">
                *A Indexa avalia e entra em contato apenas com os prédios selecionados via WhatsApp
              </p>
            </form>
          </div>
        </section>

        {/* 9. CTA FINAL */}
        <section 
          ref={(el) => { sectionsRef.current['final-cta'] = el; }}
          data-section="final-cta"
          className={`py-20 px-4 transition-all duration-1000 ${visibleSections['final-cta'] ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Modernize seu prédio com tecnologia + WhatsApp.
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Preencha o formulário e nossa equipe entrará em contato via WhatsApp.
            </p>
            
            <div className="mt-16 pt-8 border-t border-gray-700">
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  INDEXA MÍDIA
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-4">© 2025 Indexa Mídia. Todos os direitos reservados.</p>
            </div>
          </div>
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
