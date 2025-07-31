
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Send, CheckCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const BriefingFormSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    whatsapp: '',
    email: '',
    tipo_video: '',
    objetivo: '',
    agendar_cafe: false
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('leads_produtora')
        .insert([formData]);

      if (error) {
        console.error('Erro ao salvar lead:', error);
        toast.error('Erro ao enviar formulário. Tente novamente.');
      } else {
        setSubmitted(true);
        toast.success('Briefing enviado com sucesso!');
        
        // Reset form
        setFormData({
          nome: '',
          empresa: '',
          whatsapp: '',
          email: '',
          tipo_video: '',
          objetivo: '',
          agendar_cafe: false
        });
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappLink = "https://wa.me/554591071566?text=Ol%C3%A1%20quero%20informa%C3%A7%C3%B5es%20sobre%20um%20projeto%20de%20v%C3%ADdeo";

  if (submitted) {
    return (
      <section 
        id="briefing-section"
        className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-green-50 to-indexa-mint/10"
      >
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-indexa-purple mb-4">
              Briefing Enviado com Sucesso!
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              A equipe da Indexa entrará em contato para agendar seu café e entender melhor seu projeto.
            </p>
            
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-green-500 text-white font-bold py-3 px-6 rounded-full hover:bg-green-600 transition-colors duration-300"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Ou fale conosco direto no WhatsApp
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="briefing-section"
      ref={sectionRef}
      className="py-20 sm:py-24 md:py-28 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="max-w-2xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <div className="text-center mb-10 sm:mb-14 lg:mb-16">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-indexa-purple mb-4 sm:mb-6 px-4">
              Formulário de Briefing
              <span className="block text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl text-indexa-mint font-light mt-2">
                Conte-nos sobre seu projeto
              </span>
            </h2>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Nome completo */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indexa-mint focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Empresa */}
              <div>
                <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
                <input
                  type="text"
                  id="empresa"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indexa-mint focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="Nome da sua empresa"
                />
              </div>

              {/* WhatsApp e Email em grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indexa-mint focus:border-transparent transition-colors text-sm sm:text-base"
                    placeholder="(45) 99999-9999"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indexa-mint focus:border-transparent transition-colors text-sm sm:text-base"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Tipo de vídeo */}
              <div>
                <label htmlFor="tipo_video" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Vídeo Desejado
                </label>
                <select
                  id="tipo_video"
                  name="tipo_video"
                  value={formData.tipo_video}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indexa-mint focus:border-transparent transition-colors text-sm sm:text-base"
                >
                  <option value="">Selecione o tipo de vídeo</option>
                  <option value="institucional">Institucional</option>
                  <option value="publicitario">Publicitário</option>
                  <option value="reels">Reels/Stories</option>
                  <option value="entrevista">Entrevista</option>
                  <option value="comercial">Comercial</option>
                  <option value="youtube">YouTube</option>
                  <option value="documental">Documental</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Objetivo */}
              <div>
                <label htmlFor="objetivo" className="block text-sm font-medium text-gray-700 mb-2">
                  Breve Objetivo do Projeto
                </label>
                <textarea
                  id="objetivo"
                  name="objetivo"
                  value={formData.objetivo}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indexa-mint focus:border-transparent transition-colors resize-none text-sm sm:text-base"
                  placeholder="Conte-nos sobre seus objetivos, público-alvo e qualquer informação que considere importante..."
                />
              </div>

              {/* Checkbox café presencial */}
              <div className="flex items-start sm:items-center">
                <input
                  type="checkbox"
                  id="agendar_cafe"
                  name="agendar_cafe"
                  checked={formData.agendar_cafe}
                  onChange={handleInputChange}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-indexa-mint border-gray-300 rounded focus:ring-indexa-mint mt-0.5 sm:mt-0"
                />
                <label htmlFor="agendar_cafe" className="ml-2 sm:ml-3 text-sm text-gray-700 leading-relaxed">
                  Desejo agendar um café presencial no estúdio
                </label>
              </div>

              {/* Botão de envio */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indexa-mint text-indexa-purple-dark font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:bg-indexa-mint/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-indexa-purple-dark mr-2"></div>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Enviar Briefing
                  </span>
                )}
              </button>
            </form>

            {/* Link WhatsApp no final */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">Ou fale conosco direto:</p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors text-sm sm:text-base"
              >
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                WhatsApp: (45) 9107-1566
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BriefingFormSection;
