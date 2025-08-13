
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
      const { data, error } = await supabase.functions.invoke('submit-sindico-lead', {
        body: {
          nomeCompleto: formData.nomeCompleto,
          nomePredio: formData.nomePredio,
          endereco: formData.endereco,
          numeroAndares: parseInt(formData.numeroAndares),
          numeroUnidades: parseInt(formData.numeroUnidades),
          email: formData.email,
          celular: formData.celular
        }
      });

      if (error || !data?.success) {
        console.error('Erro ao enviar formulário:', error);
        toast.error(data?.error || 'Erro ao enviar formulário. Tente novamente.');
      } else {
        toast.success(data.message || 'Formulário enviado com sucesso! Nossa equipe entrará em contato em breve.');
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
