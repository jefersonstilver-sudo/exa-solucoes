import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MessageSquare, Send, CheckCircle, Coffee, Phone, Mail, MapPin } from 'lucide-react';

const ContactFormSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    projectType: '',
    budget: '',
    message: '',
    scheduleCoffee: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  const projectTypes = [
    'Vídeo Institucional/Corporativo',
    'Cobertura de Evento',
    'Produção com Drones',
    'Apresentação com Teleprompter',
    'Locação de Estúdio',
    'Projeto Personalizado'
  ];

  const budgetRanges = [
    'Até R$ 5.000',
    'R$ 5.000 - R$ 15.000',
    'R$ 15.000 - R$ 30.000',
    'R$ 30.000 - R$ 50.000',
    'Acima de R$ 50.000',
    'Prefiro não informar'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSubmitted(true);
    setIsSubmitting(false);

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        projectType: '',
        budget: '',
        message: '',
        scheduleCoffee: false
      });
    }, 3000);
  };

  if (submitted) {
    return (
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-12 shadow-enhanced border border-gray-100">
            <div className="bg-indexa-mint/20 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-indexa-purple" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Mensagem Enviada com Sucesso!
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Recebemos sua solicitação e entraremos em contato em até 4 horas úteis.
            </p>
            {formData.scheduleCoffee && (
              <div className="bg-indexa-purple/10 rounded-xl p-4 mb-6">
                <p className="text-indexa-purple font-medium">
                  ☕ Sua solicitação de café estratégico foi registrada! Nossa equipe entrará em contato para agendar.
                </p>
              </div>
            )}
            <p className="text-gray-500">
              Enquanto isso, que tal conhecer nosso portfólio? 👆
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="contact-section"
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-indexa-purple/10 text-indexa-purple px-6 py-3 rounded-full text-sm font-bold mb-6">
            <MessageSquare className="w-5 h-5" />
            Vamos Conversar
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Transforme Sua Visão
            <span className="block text-indexa-purple">Em Realidade</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conte-nos sobre seu projeto e receba uma proposta personalizada. Ou agende um café estratégico para discutirmos como podemos elevar sua comunicação audiovisual.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="space-y-8">
              {/* Coffee Invitation */}
              <div className="bg-gradient-to-r from-indexa-mint to-indexa-mint-light rounded-2xl p-6 text-indexa-purple">
                <div className="flex items-center gap-3 mb-4">
                  <Coffee className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Café Estratégico</h3>
                </div>
                <p className="text-sm mb-4">
                  Que tal um café para discutirmos seu projeto? Oferecemos consultorias gratuitas para entender suas necessidades.
                </p>
                <div className="font-bold">📍 Presencial ou Online</div>
              </div>

              {/* Contact Details */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg mb-6">Fale Conosco</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-indexa-purple" />
                    <div>
                      <div className="font-medium text-gray-900">(11) 99999-9999</div>
                      <div className="text-sm text-gray-600">WhatsApp disponível</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-indexa-purple" />
                    <div>
                      <div className="font-medium text-gray-900">produtora@indexa.com.br</div>
                      <div className="text-sm text-gray-600">Resposta em até 4h</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-indexa-purple" />
                    <div>
                      <div className="font-medium text-gray-900">São Paulo - SP</div>
                      <div className="text-sm text-gray-600">Atendemos todo Brasil</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Por Que Escolher a INDEXA?</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Resposta inicial</span>
                    <span className="font-bold text-indexa-purple">Até 4 horas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Proposta personalizada</span>
                    <span className="font-bold text-indexa-purple">24-48h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Taxa de aprovação</span>
                    <span className="font-bold text-indexa-purple">95%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className={`lg:col-span-2 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="bg-white rounded-2xl p-8 shadow-enhanced border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-transparent transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-transparent transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-transparent transition-all"
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-transparent transition-all"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Projeto *
                    </label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-transparent transition-all"
                    >
                      <option value="">Selecione o tipo</option>
                      {projectTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orçamento Estimado
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-transparent transition-all"
                    >
                      <option value="">Selecione a faixa</option>
                      {budgetRanges.map((range) => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conte-nos sobre seu projeto *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-transparent transition-all resize-none"
                    placeholder="Descreva seu projeto, objetivos, prazos e qualquer informação relevante..."
                  />
                </div>

                {/* Coffee Option */}
                <div className="bg-indexa-mint/10 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="scheduleCoffee"
                      checked={formData.scheduleCoffee}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-indexa-purple border-2 border-gray-300 rounded focus:ring-2 focus:ring-indexa-purple"
                    />
                    <div className="flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-indexa-purple" />
                      <span className="font-medium text-indexa-purple">
                        Gostaria de agendar um café estratégico (gratuito)
                      </span>
                    </div>
                  </label>
                  <p className="text-sm text-gray-600 mt-2 ml-8">
                    Reunião de 30-45 minutos para entender suas necessidades e apresentar soluções personalizadas.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-indexa-purple to-indexa-purple-dark text-white px-8 py-4 rounded-xl font-bold hover:shadow-enhanced-hover transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Solicitar Proposta
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="bg-indexa-mint text-indexa-purple px-8 py-4 rounded-xl font-bold hover:bg-indexa-mint-light transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    <Calendar className="w-5 h-5" />
                    Agendar Café
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  * Campos obrigatórios. Seus dados estão protegidos pela nossa política de privacidade.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactFormSection;