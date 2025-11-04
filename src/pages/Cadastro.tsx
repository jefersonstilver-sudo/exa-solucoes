import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createBreadcrumbSchema } from '@/components/seo/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { User, Mail, Lock } from 'lucide-react';
import DocumentInput from '@/components/auth/DocumentInput';
import RegistrationHeader from '@/components/auth/RegistrationHeader';
import ErrorDisplay from '@/components/auth/ErrorDisplay';
import NewTermsCheckbox from '@/components/auth/NewTermsCheckbox';
import { TermsScrollViewer } from '@/components/auth/TermsScrollViewer';
import { PhoneInput } from '@/components/ui/phone-input';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { PasswordInput, validatePassword } from '@/components/auth/PasswordInput';

const Cadastro: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState<'cpf' | 'documento_estrangeiro'>('cpf');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [documentFrontUrl, setDocumentFrontUrl] = useState<string>('');
  const [documentBackUrl, setDocumentBackUrl] = useState<string>('');
  const [hasReadTermsCompletely, setHasReadTermsCompletely] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const { formatDocument, validateDocument } = useDocumentValidation();
  
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/';

  const handleChangeDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value, documentType);
    setDocument(formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };

  const validatePhone = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validação de senha forte
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(`Senha não atende aos requisitos de segurança: ${passwordValidation.errors[0]}`);
        return;
      }

      if (password !== confirmPassword) {
        setError('Senhas não coincidem');
        return;
      }

      if (!validatePhone(phone)) {
        setError('Número de celular inválido');
        return;
      }

      if (!validateDocument(document, documentType)) {
        setError(documentType === 'cpf' ? 'CPF inválido' : 'Número do documento inválido');
        return;
      }

      // Validações específicas para documento estrangeiro
      if (documentType === 'documento_estrangeiro') {
        if (!country) {
          setError('Selecione o país do documento');
          return;
        }
        if (!documentFrontUrl) {
          setError('Faça o upload da frente do documento');
          return;
        }
        if (!documentBackUrl) {
          setError('Faça o upload do verso do documento');
          return;
        }
      }

      if (!acceptedTerms) {
        setError('Você deve aceitar os termos de uso');
        return;
      }

      if (!hasReadTermsCompletely) {
        setError('Você precisa ler os termos completamente antes de aceitar');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectTo}`,
          data: {
            name,
            document,
            documentType,
            phone,
            country: documentType === 'documento_estrangeiro' ? country : null,
            documentFrontUrl: documentType === 'documento_estrangeiro' ? documentFrontUrl : null,
            documentBackUrl: documentType === 'documento_estrangeiro' ? documentBackUrl : null
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu e-mail para confirmar sua conta."
      });

      navigate(`/email-enviado?email=${encodeURIComponent(email)}`);

    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      let errorMessage = "Erro ao criar conta. Tente novamente.";

      if (error.message?.includes('already registered')) {
        errorMessage = "Este e-mail já está cadastrado. Faça login.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "E-mail inválido. Verifique se digitou corretamente.";
      } else if (error.message?.includes('Password')) {
        errorMessage = "Senha muito simples. Use uma senha mais forte.";
      }

      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <SEO
        title="Criar Conta - EXA Publicidade Inteligente"
        description="Crie sua conta gratuita na EXA e comece a anunciar em painéis digitais de elevadores em Foz do Iguaçu. Cadastro rápido e seguro."
        keywords="criar conta exa, cadastro anunciante, criar anúncio elevador, cadastro mídia indoor"
        canonical="https://exa.com.br/cadastro"
        noindex={true}
        structuredData={[
          organizationSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://exa.com.br/' },
            { name: 'Cadastro', url: 'https://exa.com.br/cadastro' }
          ])
        ]}
      />
      <motion.div
        className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-[#3B1E1E]/10 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-4xl bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24">
            <RegistrationHeader />
            
            {error && <ErrorDisplay error={error} />}
            
            {/* Formulário Principal */}
            <div className="mt-8">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center text-gray-900">
                      <User className="h-4 w-4 mr-2 text-indexa-purple" /> 
                      Nome completo <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  
                  {/* E-mail */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-indexa-purple" /> 
                      E-mail <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Senha */}
                  <PasswordInput
                    id="password"
                    label="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Crie uma senha forte"
                    required
                    showRequirements={true}
                  />
                  
                  {/* Confirmar Senha */}
                  <PasswordInput
                    id="confirmPassword"
                    label="Confirmar senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    required
                    showRequirements={false}
                  />
                </div>

                {/* Celular */}
                <PhoneInput
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                />
                
                {/* Documento */}
                <DocumentInput
                  documentType={documentType}
                  document={document}
                  country={country}
                  documentFrontUrl={documentFrontUrl}
                  documentBackUrl={documentBackUrl}
                  onDocumentTypeChange={setDocumentType}
                  onDocumentChange={handleChangeDocument}
                  onCountryChange={setCountry}
                  onDocumentFrontChange={setDocumentFrontUrl}
                  onDocumentBackChange={setDocumentBackUrl}
                />
              </form>
            </div>

            {/* Termos de Uso */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <TermsScrollViewer 
                onScrollToBottom={setHasReadTermsCompletely} 
                hasScrolledToBottom={hasReadTermsCompletely}
              />
              
              <div className="mt-6">
                <NewTermsCheckbox
                  acceptedTerms={acceptedTerms}
                  acceptedPrivacy={acceptedPrivacy}
                  onTermsChange={setAcceptedTerms}
                  onPrivacyChange={setAcceptedPrivacy}
                  hasReadTermsCompletely={hasReadTermsCompletely}
                  hasReadPrivacyCompletely={true}
                />
              </div>
            </div>

            {/* Botão de Criar Conta */}
            <div className="mt-8">
              <Button 
                onClick={handleSignUp}
                disabled={isLoading || !acceptedTerms || !hasReadTermsCompletely}
                className="w-full h-12 bg-gradient-to-r from-[#9C1E1E] to-indexa-green hover:from-[#D72638] hover:to-indexa-green/90 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Criando conta...
                  </div>
                ) : (
                  'Criar Conta'
                )}
              </Button>

              {(!hasReadTermsCompletely || !acceptedTerms) && (
                <p className="text-sm text-orange-600 mt-2 text-center">
                  {!hasReadTermsCompletely 
                    ? "📖 Leia os termos completamente para habilitar o botão" 
                    : "✅ Aceite os termos para continuar"
                  }
                </p>
              )}
            </div>
            
            <div className="text-center pt-6 border-t border-gray-200 mt-8">
              <p className="text-gray-600 mb-2">
                Já tem uma conta?
              </p>
              <Link 
                to="/login" 
                className="text-indexa-purple hover:text-indexa-purple/80 font-semibold transition-colors"
              >
                Fazer Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default Cadastro;