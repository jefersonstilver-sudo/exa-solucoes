
import React, { useState, useEffect, useRef } from 'react';
import { Building2, Shield, Zap, Clock, Users, CheckCircle, Star, ArrowRight, Phone, Mail, MapPin, Calendar, Layers, Wifi, Monitor, Lock, Smartphone, MessageSquare, TrendingUp, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const SouSindico = () => {
  const [isVisible, setIsVisible] = useState(false);
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Formulário enviado! Entraremos em contato em breve.');
  };

  const benefits = [
    { icon: MessageSquare, title: 'Comunicação em tempo real', desc: 'Avisos instantâneos para todos os moradores' },
    { icon: TrendingUp, title: 'Redução de papel e burocracia', desc: 'Gestão 100% digital e sustentável' },
    { icon: Award, title: 'Modernização da imagem', desc: 'Prédio tecnológico e valorizado' },
    { icon: Zap, title: 'Canal direto de gestão', desc: 'Agilidade total na comunicação' },
    { icon: Users, title: 'Suporte técnico especializado', desc: '24h de monitoramento e assistência' },
    { icon: Shield, title: 'Sistema 100% seguro', desc: 'Auditável e criptografado' },
    { icon: CheckCircle, title: 'Zero custos', desc: 'Sem instalação ou manutenção' }
  ];

  const howItWorksSteps = [
    { step: '1', title: 'Instalação sem custos', desc: 'Nossa equipe instala gratuitamente', icon: Building2 },
    { step: '2', title: 'Acesso ao painel', desc: 'App ou navegador para gestão', icon: Smartphone },
    { step: '3', title: 'Publicação com 1 clique', desc: 'Avisos publicados instantaneamente', icon: Zap },
    { step: '4', title: 'Moradores veem em tempo real', desc: 'Informação chega a todos no elevador', icon: Users }
  ];

  const testimonials = [
    { text: 'A comunicação ficou instantânea e os moradores adoraram.', author: 'Carlos Silva', building: 'Edifício Gardens' },
    { text: 'É como ter uma central de informações dentro do elevador.', author: 'Maria Santos', building: 'Residencial Plaza' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Partículas de fundo */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-40 delay-1000" />
        <div className="absolute bottom-60 left-1/4 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse opacity-50 delay-2000" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-300 rounded-full animate-pulse opacity-30 delay-3000" />
      </div>

      {/* 1. HERO SECTION */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20" />
        
        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Conteúdo Textual */}
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Transforme a comunicação
              </span>
              <span className="block text-white">
                do seu condomínio.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Chegou a nova geração de painéis digitais em elevadores.
            </p>
            
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg px-8 py-6 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-105"
              onClick={() => document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Quero conhecer o projeto
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Vídeo Mockup Smartphone */}
          <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div className="relative max-w-xs mx-auto">
              {/* Moldura do smartphone */}
              <div className="relative bg-gray-800 rounded-[3rem] p-4 shadow-2xl">
                <div className="bg-black rounded-[2.5rem] overflow-hidden">
                  {/* Notch */}
                  <div className="h-6 bg-black relative">
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-full" />
                  </div>
                  
                  {/* Vídeo */}
                  <video
                    className="w-full h-96 object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/Videos%20sindico%20site/F5D2914A-D793-496A-93DE-E5DB8F60E800.MOV?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9WaWRlb3Mgc2luZGljbyBzaXRlL0Y1RDI5MTRBLUQ3OTMtNDk2QS05M0RFLUU1REI4RjYwRTgwMC5NT1YiLCJpYXQiOjE3NDg2OTUzMTksImV4cCI6MTc4MDIzMTMxOX0.PVO9e39KGsNuKsAQKsfqrtlkbUttnWljloBbg5fZVgE" type="video/mp4" />
                  </video>
                </div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-[3rem] blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. SOBRE O PROJETO */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Sobre o Projeto Indexa Painéis
            </span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20">
              <Monitor className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">Substituição Inteligente</h3>
              <p className="text-gray-300">Murais físicos substituídos por painéis digitais modernos e interativos.</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-blue-500/20">
              <Layers className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">Conteúdo Dinâmico</h3>
              <p className="text-gray-300">Avisos, clima, câmbio, notícias, curiosidades e informações da ponte.</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20">
              <Wifi className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">Sistema Remoto</h3>
              <p className="text-gray-300">100% conectado à internet com atualizações automáticas OTA.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BENEFÍCIOS PARA O SÍNDICO */}
      <section className="py-20 px-4 bg-gray-800/30">
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
      <section className="py-20 px-4">
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

      {/* 5. DEPOIMENTOS */}
      <section className="py-20 px-4 bg-gray-800/30">
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

      {/* 6. GALERIA VISUAL */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Galeria Visual
            </span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-2xl">
              <img 
                src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80" 
                alt="Painel digital no elevador"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white font-semibold">Painel Digital Premium</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl">
              <img 
                src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&q=80" 
                alt="Prédio moderno"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white font-semibold">Prédios Selecionados</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl">
              <img 
                src="https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=800&q=80" 
                alt="Tecnologia avançada"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white font-semibold">Tecnologia de Ponta</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PROTOCOLO DE SEGURANÇA */}
      <section className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Protocolo de Segurança 573040
            </span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-red-500/20">
              <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-4">Reboot Automático</h3>
              <p className="text-gray-300">Sistema reinicia automaticamente após queda de energia.</p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-yellow-500/20">
              <Shield className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-4">Sistema Offline</h3>
              <p className="text-gray-300">Contingência automática mantém funcionamento local.</p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-green-500/20">
              <Sparkles className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-4">Chave Criptográfica</h3>
              <p className="text-gray-300">Desbloqueio externo com criptografia avançada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. ANTES VS DEPOIS */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Antes vs Depois
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* ANTES */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-red-400">❌ ANTES</h3>
              <div className="bg-red-900/20 p-8 rounded-2xl border border-red-500/20">
                <ul className="space-y-4 text-left">
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                    Papel rasgado e desatualizado
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                    Dificuldade de comunicação
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                    Desperdício e poluição
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                    Gestão manual e lenta
                  </li>
                </ul>
              </div>
            </div>
            
            {/* DEPOIS */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-green-400">✅ DEPOIS</h3>
              <div className="bg-green-900/20 p-8 rounded-2xl border border-green-500/20">
                <ul className="space-y-4 text-left">
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Organização total e digital
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Impacto visual profissional
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Sustentabilidade 100%
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Gestão digital instantânea
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. TECNOLOGIA DE PONTA */}
      <section className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Tecnologia de Ponta
            </span>
          </h2>
          
          <div className="bg-gray-900/50 backdrop-blur-sm p-12 rounded-3xl border border-purple-500/20">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Monitor className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Tela Robusta</h3>
                <p className="text-gray-300">Hardware industrial de alta durabilidade</p>
              </div>
              
              <div className="text-center">
                <Smartphone className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Software Proprietário</h3>
                <p className="text-gray-300">Desenvolvido exclusivamente pela Indexa</p>
              </div>
              
              <div className="text-center">
                <Wifi className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Nuvem Integrada</h3>
                <p className="text-gray-300">Atualizações automáticas em tempo real</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. VANTAGENS EXCLUSIVAS */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Vantagens Exclusivas
            </span>
          </h2>
          
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-12 rounded-3xl border border-purple-500/30">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Award className="w-16 h-16 text-gold-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-yellow-400">Predial Exclusivo</h3>
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

      {/* 11. FORMULÁRIO DE INTERESSE */}
      <section id="formulario" className="py-20 px-4 bg-gray-800/50">
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
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105"
              >
                Enviar Solicitação
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            
            <p className="text-center text-sm text-gray-400 mt-6">
              *Observação: A Indexa avalia e entra em contato apenas com os prédios selecionados
            </p>
          </form>
        </div>
      </section>

      {/* 12. CTA FINAL */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Transforme a comunicação do seu prédio.
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Preencha o formulário acima e entraremos em contato.
          </p>
          
          {/* Footer com logo */}
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
  );
};

export default SouSindico;
