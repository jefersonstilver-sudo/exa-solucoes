import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Users, TrendingUp, Clock, Star, Zap, Target, Shield } from 'lucide-react';

const ExaFinalCTASection: React.FC = () => {
  const navigate = useNavigate();

  const handleScheduleMeeting = () => {
    navigate('/linkae');
  };

  const handleViewLocations = () => {
    navigate('/paineis-digitais/loja');
  };

  const benefits = [
    { icon: TrendingUp, title: 'ROI Comprovado', desc: '300% de aumento médio em vendas' },
    { icon: Users, title: 'Alcance Ampliado', desc: 'Atinja milhares de pessoas diariamente' },
    { icon: Target, title: 'Segmentação Precisa', desc: 'Publicidade direcionada por localização' },
    { icon: Zap, title: 'Implementação Rápida', desc: 'Sistema funcionando em 48h' }
  ];

  const testimonials = [
    { quote: "Triplicamos nossas vendas em 3 meses", author: "João Silva", company: "Padaria Central" },
    { quote: "Melhor investimento em marketing que já fiz", author: "Ana Costa", company: "Clínica Vida" }
  ];

  const includedFeatures = [
    'Análise completa do mercado local',
    'Configuração personalizada da campanha',
    'Dashboard de métricas em tempo real',
    'Suporte técnico 24/7',
    'Treinamento da equipe incluso'
  ];

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center py-16 sm:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Urgency Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full font-bold text-sm sm:text-base animate-pulse">
            <Clock className="w-4 h-4" />
            Apenas 5 vagas restantes este mês!
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-12 lg:p-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text mb-6 leading-tight tracking-wide">
              Multiplique Suas Vendas em 90 Dias
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl font-exo-2 font-light text-slate-700 mb-8 max-w-4xl mx-auto leading-relaxed">
              Reunião estratégica gratuita para empresários que querem resultados reais com publicidade inteligente
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 hover:scale-105 transition-transform duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-600">{benefit.desc}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 mb-12">
            <h3 className="text-center text-2xl font-bold text-slate-800 mb-8">O que nossos clientes dizem:</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 italic mb-4">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-bold text-slate-800">{testimonial.author}</p>
                    <p className="text-sm text-slate-600">{testimonial.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center max-w-3xl mx-auto mb-12">
            <button 
              onClick={handleScheduleMeeting}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-exo-2 font-bold px-12 sm:px-14 py-6 sm:py-7 rounded-xl text-base sm:text-lg md:text-xl transition-all duration-300 hover:shadow-xl hover:scale-105 w-full sm:w-auto min-h-[72px] touch-manipulation tracking-wide shadow-2xl hover:shadow-purple-500/30 relative overflow-hidden group"
            >
              <span className="relative z-10">Agendar Reunião Gratuita</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button 
              onClick={handleViewLocations}
              className="border-2 border-purple-400 text-purple-600 font-exo-2 font-semibold px-12 sm:px-14 py-6 sm:py-7 rounded-xl text-base sm:text-lg md:text-xl transition-all duration-300 hover:bg-purple-50 hover:shadow-xl hover:scale-105 w-full sm:w-auto min-h-[72px] touch-manipulation tracking-wide"
            >
              Ver Localizações Disponíveis
            </button>
          </div>

          {/* What's Included */}
          <div className="bg-slate-50 rounded-2xl p-8 mb-8">
            <h3 className="text-center text-xl font-bold text-slate-800 mb-6 flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-green-500" />
              O que está incluído na reunião gratuita:
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {includedFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final guarantees */}
          <div className="text-center">
            <p className="font-exo-2 font-light text-gray-600 text-sm sm:text-base md:text-lg tracking-wide mb-4">
              Sem taxas ocultas • Analytics inclusos • Suporte dedicado • Garantia de 30 dias
            </p>
            <p className="text-sm text-slate-500">
              ⚡ Resposta em até 2 horas úteis • 🎯 Consultoria personalizada • 📊 Relatórios semanais
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaFinalCTASection;