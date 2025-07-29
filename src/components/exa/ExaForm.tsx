import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLeadsExa } from '@/hooks/useLeadsExa';
import { Loader2, CheckCircle, Users, Building } from 'lucide-react';

const formSchema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  nome_empresa: z.string().min(2, 'Nome da empresa é obrigatório'),
  cargo: z.string().min(2, 'Cargo é obrigatório'),
  whatsapp: z.string().min(10, 'WhatsApp deve ter pelo menos 10 dígitos'),
  objetivo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const ExaForm: React.FC = () => {
  const { createLead, loading } = useLeadsExa();
  const [submitted, setSubmitted] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_completo: '',
      nome_empresa: '',
      cargo: '',
      whatsapp: '',
      objetivo: '',
    },
  });

  const onSubmit = async (values: FormData) => {
    try {
      console.log('📝 EXA Form: Enviando dados:', values);
      const leadData = {
        nome_completo: values.nome_completo,
        nome_empresa: values.nome_empresa,
        cargo: values.cargo,
        whatsapp: values.whatsapp,
        objetivo: values.objetivo || ''
      };
      await createLead(leadData);
      setSubmitted(true);
      form.reset();
    } catch (error) {
      console.error('❌ Erro ao enviar formulário EXA:', error);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">
            Formulário Enviado com Sucesso! 🎉
          </h3>
          <p className="text-gray-300 mb-6">
            Nossa equipe entrará em contato via WhatsApp em breve para agendar sua reunião gratuita.
          </p>
          <Button 
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Enviar Outro Formulário
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-3xl font-bold text-white mb-4">
          Agende sua Reunião Gratuita
        </h3>
        <p className="text-gray-300 text-lg">
          Preencha os dados abaixo e nossa equipe entrará em contato via WhatsApp
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nome_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Nome Completo *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Seu nome completo"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cargo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Cargo *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ex: CEO, Diretor, Síndico"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="nome_empresa"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Nome da Empresa/Condomínio *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Nome da sua empresa ou condomínio"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">WhatsApp *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="(11) 99999-9999"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="objetivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Objetivo com Painéis Digitais (Opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Conte-nos sobre seus objetivos com publicidade em painéis digitais..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              'Agendar Reunião Gratuita'
            )}
          </Button>
        </form>
      </Form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Reunião Personalizada</h4>
            <p className="text-gray-400 text-sm">Estratégia específica para seu negócio</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Análise de Localização</h4>
            <p className="text-gray-400 text-sm">Identificamos os melhores pontos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExaForm;