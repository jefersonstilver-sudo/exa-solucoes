
import React, { memo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SindicoFormData } from './types';

interface InterestFormSectionProps {
  isVisible: boolean;
  formData: SindicoFormData;
  setFormData: React.Dispatch<React.SetStateAction<SindicoFormData>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

const InterestFormSection = memo<InterestFormSectionProps>(({ 
  isVisible, 
  formData, 
  setFormData, 
  handleSubmit, 
  isSubmitting 
}) => {
  return (
    <section 
      id="formulario" 
      className={`py-20 px-4 motion-safe:transition-all motion-safe:duration-500 will-change-transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Agende Sua Instalação Gratuita
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              Modernize seu prédio com tecnologia + WhatsApp, sem custo ou manutenção.
            </p>
            <p className="text-lg text-gray-400">
              Preencha o formulário e nossa equipe entrará em contato via WhatsApp para agendamento.
            </p>
          </div>
          
          {/* Right Column - Form */}
          <div>
            <form onSubmit={handleSubmit} className="bg-gray-700/40 backdrop-blur-sm p-8 rounded-3xl border border-purple-400/50 shadow-2xl">
          <div className="grid gap-6">
            <Input
              placeholder="Nome completo do síndico"
              value={formData.nomeCompleto}
              onChange={(e) => setFormData({...formData, nomeCompleto: e.target.value})}
              className="bg-white border-purple-400/50 text-black placeholder-gray-800 shadow-sm"
              required
            />
            
            <Input
              placeholder="Nome do prédio"
              value={formData.nomePredio}
              onChange={(e) => setFormData({...formData, nomePredio: e.target.value})}
              className="bg-white border-purple-400/50 text-black placeholder-gray-800 shadow-sm"
              required
            />
            
            <Textarea
              placeholder="Endereço completo"
              value={formData.endereco}
              onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              className="bg-white border-purple-400/50 text-black placeholder-gray-800 shadow-sm"
              required
            />
            
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Número de andares"
                type="number"
                value={formData.numeroAndares}
                onChange={(e) => setFormData({...formData, numeroAndares: e.target.value})}
                className="bg-white border-purple-400/50 text-black placeholder-gray-800 shadow-sm"
                required
              />
              
              <Input
                placeholder="Total de unidades"
                type="number"
                value={formData.numeroUnidades}
                onChange={(e) => setFormData({...formData, numeroUnidades: e.target.value})}
                className="bg-white border-purple-400/50 text-black placeholder-gray-800 shadow-sm"
                required
              />
            </div>
            
            <Input
              placeholder="E-mail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="bg-white border-purple-400/50 text-black placeholder-gray-800 shadow-sm"
              required
            />
            
            <Input
              placeholder="Celular com WhatsApp"
              type="tel"
              value={formData.celular}
              onChange={(e) => setFormData({...formData, celular: e.target.value})}
              className="bg-white border-purple-400/50 text-black placeholder-gray-800 shadow-sm"
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
        </div>
      </div>
    </section>
  );
});

InterestFormSection.displayName = 'InterestFormSection';

export default InterestFormSection;
