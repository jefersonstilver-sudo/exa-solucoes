import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { 
  ArrowLeft, 
  CheckCircle, 
  Gift, 
  Mail, 
  MousePointerClick, 
  Key, 
  ShoppingCart, 
  CreditCard, 
  Code,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const BenefitPurchaseInstructions = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();

  const steps = [
    {
      number: 1,
      title: 'Receba a Confirmação',
      description: 'Aguarde a confirmação do responsável pela instalação do ponto EXA. Você receberá o email do prestador e da empresa.',
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      number: 2,
      title: 'Crie o Benefício',
      description: 'Acesse a página de Benefício Prestadores, clique em "Novo Benefício" e preencha os dados. O sistema enviará um email automaticamente para o prestador.',
      icon: Gift,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      number: 3,
      title: 'Aguarde a Escolha',
      description: 'O prestador receberá o email e escolherá o benefício desejado. Você será notificado quando a escolha for realizada.',
      icon: MousePointerClick,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      number: 4,
      title: 'Acesse as Credenciais',
      description: 'Antes de comprar, você precisa das credenciais de acesso à Loja Smash. Clique no botão abaixo para acessar as informações de login e senha.',
      icon: Key,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      actionButton: {
        text: '🔑 Acessar Credenciais no Notion',
        href: 'https://www.notion.so/stilver/Senhas-e-Servi-os-29bf9e038d818015a077d0991840b5e3?p=2a2f9e038d81806aa2d9d8bb171de20b&pm=s',
      },
    },
    {
      number: 5,
      title: 'Acesse a Loja Smash',
      description: 'Após obter as credenciais, acesse a Loja Smash, faça login e selecione o produto que o beneficiário escolheu.',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      actionButton: {
        text: '🎁 Acessar Loja Smash',
        href: 'https://loja.smash.gifts/',
      },
    },
    {
      number: 6,
      title: 'Compre e Pague',
      description: 'Adicione o produto ao carrinho, escolha o método de pagamento da Smash, finalize a compra e aguarde receber o código de presente ou link.',
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      number: 7,
      title: 'Insira o Código no Sistema',
      description: 'Quando receber o código ou link do vale presente, volte para a página de Benefícios, localize o benefício do prestador, clique em "Inserir Código" e cole o código recebido. O sistema enviará automaticamente para o prestador.',
      icon: Code,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
  ];

  const warnings = [
    '⚠️ Sempre use as credenciais corretas disponíveis no Notion',
    '⏱️ Compre o vale logo após a escolha do prestador para evitar atrasos',
    '📧 Aguarde a confirmação de entrega antes de inserir o código no sistema',
    '🔒 Nunca compartilhe as credenciais de acesso com terceiros',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] text-white">
        <div className="container mx-auto px-4 py-8">
          <Button
            onClick={() => navigate(buildPath('beneficio-prestadores'))}
            variant="ghost"
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Benefícios
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Como Comprar os Vales Presente
              </h1>
              <p className="text-white/90 text-lg">
                Siga este passo a passo para adquirir e entregar os vales aos prestadores
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.number}
                className={`border-l-4 ${step.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <CardHeader className={`${step.bgColor} border-b ${step.borderColor}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${step.bgColor} ${step.color} flex items-center justify-center font-bold text-xl border-2 ${step.borderColor} shadow-sm`}>
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Icon className={`h-6 w-6 ${step.color}`} />
                        {step.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 leading-relaxed text-base mb-4">
                    {step.description}
                  </p>
                  
                  {step.actionButton && (
                    <a
                      href={step.actionButton.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button
                        size="lg"
                        className={`${step.bgColor} ${step.color} border-2 ${step.borderColor} hover:opacity-80 transition-all shadow-md`}
                      >
                        {step.actionButton.text}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Warnings */}
        <Card className="mt-8 border-2 border-amber-300 bg-amber-50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-amber-50 border-b border-amber-200">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              Avisos Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-3">
              {warnings.map((warning, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-amber-900 font-medium"
                >
                  <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate(buildPath('beneficio-prestadores'))}
            size="lg"
            className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white shadow-lg"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar para Benefícios
          </Button>
          
          <a
            href="https://loja.smash.gifts/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="w-full border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white shadow-lg"
            >
              <Gift className="h-5 w-5 mr-2" />
              Ir para Loja Smash
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default BenefitPurchaseInstructions;
