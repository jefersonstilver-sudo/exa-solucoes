
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SindicoFormData } from '@/components/sou-sindico/types';

export const useSindicoForm = () => {
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

  return {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit
  };
};
