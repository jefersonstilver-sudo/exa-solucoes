import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import ExaSection from '@/components/exa/base/ExaSection';
import { Mail, Phone, MapPin, Building2, Home, Clock, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const sindicoSchema = z.object({
  nomeSindico: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  nomeCondominio: z.string().min(2, 'Nome do condomínio é obrigatório'),
  numeroElevadores: z.string().min(1, 'Informe o número de elevadores'),
  numeroUnidades: z.string().min(1, 'Informe o número de unidades'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
});

type SindicoFormData = z.infer<typeof sindicoSchema>;

const Contato = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<SindicoFormData>({
    resolver: zodResolver(sindicoSchema),
  });

  const onSubmit = async (data: SindicoFormData) => {
    setIsSubmitting(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('submit-sindico-lead', {
        body: {
          nomeCompleto: data.nomeSindico,
          nomePredio: data.nomeCondominio,
          endereco: '', numeroAndares: 0,
          numeroUnidades: parseInt(data.numeroUnidades),
          elevadoresSociais: parseInt(data.numeroElevadores),
          elevadoresServico: 0, email: '', celular: data.whatsapp
        }
      });
      if (error || !response?.success) {
        toast.error(response?.error || 'Erro ao enviar formulário. Tente novamente.');
      } else {
        toast.success(response.message || 'Formulário enviado com sucesso! Nossa equipe entrará em contato em breve.');
        reset();
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout className="bg-gradient-to-br from-gray-50 to-gray-100">
      <SEO title="Síndico: Modernize Seu Condomínio GRÁTIS | Painel Digital EXA" description="Síndico, receba GRÁTIS: Painel digital + WIFI + instalação. WhatsApp (45) 9 9141-5856. Atendimento: Seg-Sex 9h às 18h." keywords="painel digital gratuito condomínio, síndico foz iguaçu, modernizar prédio grátis, comunicação condomínio" />
      <ExaSection background="light" className="min-h-screen pt-32 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-block bg-[#9C1E1E]/10 px-4 py-2 rounded-full mb-4">
                <span className="text-[#9C1E1E] font-semibold text-sm">100% GRATUITO</span>
              </div>
              <h1 className="font-montserrat font-extrabold text-4xl lg:text-5xl text-[#9C1E1E]">Modernize Seu Condomínio</h1>
              <p className="font-poppins text-lg text-gray-600">Receba GRÁTIS: Painel Digital + WIFI + Instalação.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seu Nome *</label>
                <Input {...register('nomeSindico')} placeholder="Nome completo do síndico" className="bg-white" disabled={isSubmitting} />
                {errors.nomeSindico && <p className="text-red-500 text-sm mt-1">{errors.nomeSindico.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Condomínio *</label>
                <Input {...register('nomeCondominio')} placeholder="Ex: Edifício Solar das Águas" className="bg-white" disabled={isSubmitting} />
                {errors.nomeCondominio && <p className="text-red-500 text-sm mt-1">{errors.nomeCondominio.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Elevadores Sociais *</label>
                  <Input {...register('numeroElevadores')} type="number" placeholder="Ex: 2" className="bg-white" disabled={isSubmitting} />
                  {errors.numeroElevadores && <p className="text-red-500 text-sm mt-1">{errors.numeroElevadores.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total de Unidades *</label>
                  <Input {...register('numeroUnidades')} type="number" placeholder="Ex: 40" className="bg-white" disabled={isSubmitting} />
                  {errors.numeroUnidades && <p className="text-red-500 text-sm mt-1">{errors.numeroUnidades.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seu WhatsApp *</label>
                <Input {...register('whatsapp')} placeholder="(45) 9 9999-9999" className="bg-white" disabled={isSubmitting} />
                {errors.whatsapp && <p className="text-red-500 text-sm mt-1">{errors.whatsapp.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-[#9C1E1E] hover:bg-[#7A1717] text-white font-semibold py-6" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Quero Modernizar Meu Condomínio'}
              </Button>
              <p className="text-xs text-gray-500 text-center">Ao enviar, você concorda em receber contato da nossa equipe via WhatsApp.</p>
            </form>
          </div>
          <div className="space-y-8 lg:pl-12">
            <div>
              <h2 className="font-montserrat font-bold text-2xl text-gray-900 mb-6">O Que Você Recebe GRÁTIS</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm border-l-4 border-[#9C1E1E]">
                  <Building2 className="w-6 h-6 text-[#9C1E1E] flex-shrink-0 mt-1" />
                  <div><h3 className="font-semibold text-gray-900 mb-1">Painel Digital</h3><p className="text-gray-600 text-sm">TV profissional instalada no elevador</p></div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm border-l-4 border-[#9C1E1E]">
                  <Zap className="w-6 h-6 text-[#9C1E1E] flex-shrink-0 mt-1" />
                  <div><h3 className="font-semibold text-gray-900 mb-1">Instalação Completa</h3><p className="text-gray-600 text-sm">Nossa equipe instala tudo sem custo</p></div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm border-l-4 border-[#9C1E1E]">
                  <Home className="w-6 h-6 text-[#9C1E1E] flex-shrink-0 mt-1" />
                  <div><h3 className="font-semibold text-gray-900 mb-1">WIFI Incluso</h3><p className="text-gray-600 text-sm">Internet dedicada sem custo adicional</p></div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-4">Entre em Contato</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-[#9C1E1E]" />
                    <a href="mailto:contato@examidia.com.br" className="text-gray-600 hover:text-[#9C1E1E] transition-colors">contato@examidia.com.br</a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-[#9C1E1E]" />
                    <a href="tel:+5545991415856" className="text-gray-600 hover:text-[#9C1E1E] transition-colors">(45) 9 9141-5856</a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-[#9C1E1E]" />
                    <p className="text-gray-600">Foz do Iguaçu, Paraná</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-[#9C1E1E]" />
                    <p className="text-gray-600">Segunda a Sexta: 9h às 18h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ExaSection>
    </Layout>
  );
};

export default Contato;
