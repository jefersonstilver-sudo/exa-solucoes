import React from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import ExaSection from '@/components/exa/base/ExaSection';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const contactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  company: z.string().optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres'),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contato = () => {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = (data: ContactFormData) => {
    console.log('Form submitted:', data);
    toast({
      title: 'Mensagem enviada!',
      description: 'Responderemos em breve.',
    });
    reset();
  };

  return (
    <Layout className="bg-gradient-to-br from-gray-50 to-gray-100">
      <SEO
        title="Contato EXA | Anuncie em Painéis Digitais de Elevadores - Foz do Iguaçu"
        description="Fale com a EXA Publicidade. WhatsApp (45) 9141-5856. Resposta em até 2 horas. Teste GRÁTIS por 30 dias. Atendimento: Seg-Sex 8h às 17h."
        keywords="contato exa foz iguaçu, telefone publicidade elevador, whatsapp anúncio prédio, email exa publicidade"
      />
      <ExaSection background="light" className="min-h-screen py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left side - Form */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="font-montserrat font-extrabold text-4xl lg:text-5xl text-exa-purple">
                Entre em Contato
              </h1>
              <p className="font-poppins text-lg text-gray-600">
                Preencha o formulário e nossa equipe entrará em contato em breve.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input 
                  {...register('name')} 
                  placeholder="Nome *" 
                  className="bg-white"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Input 
                  {...register('company')} 
                  placeholder="Empresa" 
                  className="bg-white"
                />
              </div>

              <div>
                <Input 
                  {...register('email')} 
                  type="email"
                  placeholder="E-mail *" 
                  className="bg-white"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Input 
                  {...register('phone')} 
                  placeholder="WhatsApp *" 
                  className="bg-white"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Input 
                  {...register('subject')} 
                  placeholder="Assunto *" 
                  className="bg-white"
                />
                {errors.subject && (
                  <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <Textarea 
                  {...register('message')} 
                  placeholder="Mensagem *" 
                  rows={6}
                  className="bg-white"
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-exa-purple to-exa-purple/90 hover:scale-105 transition-transform text-lg py-6"
              >
                Enviar Mensagem
              </Button>
            </form>
          </div>

          {/* Right side - Contact Info */}
          <div className="space-y-8 lg:pl-12">
            <div className="bg-white rounded-3xl p-8 shadow-lg space-y-6">
              <h2 className="font-montserrat font-bold text-2xl text-exa-purple mb-6">
                Informações de Contato
              </h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-exa-purple flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-montserrat font-semibold text-exa-black">Email</p>
                    <a 
                      href="mailto:contato@exa.com.br" 
                      className="font-poppins text-gray-600 hover:text-exa-purple transition-colors"
                    >
                      contato@exa.com.br
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-exa-purple flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-montserrat font-semibold text-exa-black">Telefone</p>
                    <a 
                      href="tel:+5545991415856" 
                      className="font-poppins text-gray-600 hover:text-exa-purple transition-colors"
                    >
                      +55 45 9141-5856
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-exa-purple flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-montserrat font-semibold text-exa-black">Localização</p>
                    <p className="font-poppins text-gray-600">
                      Foz do Iguaçu, Paraná
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-exa-purple to-exa-purple/80 rounded-3xl p-8 text-white">
              <h3 className="font-montserrat font-bold text-xl mb-4">
                Horário de Atendimento
              </h3>
              <p className="font-poppins">
                Segunda a Sexta: 8h às 17h
              </p>
            </div>
          </div>
        </div>
      </ExaSection>
    </Layout>
  );
};

export default Contato;
