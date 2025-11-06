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
import { User, Mail, Phone as PhoneIcon } from 'lucide-react';
import DocumentInput from '@/components/auth/DocumentInput';
import RegistrationHeader from '@/components/auth/RegistrationHeader';
import ErrorDisplay from '@/components/auth/ErrorDisplay';
import NewTermsCheckbox from '@/components/auth/NewTermsCheckbox';
import { TermsScrollViewer } from '@/components/auth/TermsScrollViewer';
import { PhoneInput } from '@/components/ui/phone-input';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordRequirements, validatePassword } from '@/components/auth/PasswordRequirements';

const Cadastro: React.FC = () => {
  // Estados do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState<'cpf' | 'documento_estrangeiro'>('cpf');
  const [country, setCountry] = useState('');
  const [documentFrontUrl, setDocumentFrontUrl] = useState<string>('');
  const [documentBackUrl, setDocumentBackUrl] = useState<string>('');
  const [hasReadTermsCompletely, setHasReadTermsCompletely] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const { formatDocument, validateDocument } = useDocumentValidation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/';

  // Handlers
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
      // Validações
      const passwordValidation = validatePassword(password, name);
      if (!passwordValidation.valid) {
        setError(passwordValidation.message || 'Senha não atende aos requisitos de segurança');
        return;
      }

      if (password !== confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }

      if (!validatePhone(phone)) {
        setError('Número de celular inválido. Use o formato (XX) XXXXX-XXXX');
        return;
      }

      if (!validateDocument(document, documentType)) {
        setError(documentType === 'cpf' ? 'CPF inválido' : 'Número do documento inválido');
        return;
      }

      if (documentType === 'documento_estrangeiro') {
        if (!country) {
          setError('Selecione o país do documento');
          return;
        }
        if (!documentFrontUrl || !documentBackUrl) {
          setError('Faça o upload da frente e verso do documento');
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

      // Criar conta
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectTo}`,
          data: {
            name,
            phone,
            document,
            documentType,
            country: documentType === 'documento_estrangeiro' ? country : null,
            documentFrontUrl: documentType === 'documento_estrangeiro' ? documentFrontUrl : null,
            documentBackUrl: documentType === 'documento_estrangeiro' ? documentBackUrl : null
          }
        }
      });

      if (signUpError) throw signUpError;

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
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <RegistrationHeader />
            
            {error && <ErrorDisplay error={error} />}
            
            <form onSubmit={handleSignUp} className="mt-8 space-y-8">
              {/* Seção 1: Informações Pessoais */}
              <div className="space-y-6">
                <div className="pb-2 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Informações Pessoais</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center text-sm font-medium text-gray-900">
                      <User className="h-4 w-4 mr-2 text-exa-red" /> 
                      Nome completo <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="Seu nome completo" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      className="h-11" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center text-sm font-medium text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-exa-red" /> 
                      E-mail <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="h-11" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-900">
                    <PhoneIcon className="h-4 w-4 mr-2 text-exa-red" />
                    Celular <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <PhoneInput 
                    value={phone} 
                    onChange={handlePhoneChange} 
                    required 
                  />
                </div>
              </div>

              {/* Seção 2: Senha de Acesso */}
              <div className="space-y-6">
                <div className="pb-2 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Senha de Acesso</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                      Senha <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crie uma senha forte"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
                      Confirmar senha <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <PasswordInput
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite a senha novamente"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <PasswordRequirements password={password} userName={name} />

                {confirmPassword && (
                  <div className="text-sm">
                    {password !== confirmPassword ? (
                      <p className="text-red-600">✗ As senhas não coincidem</p>
                    ) : (
                      <p className="text-green-600">✓ Senhas coincidem</p>
                    )}
                  </div>
                )}
              </div>

              {/* Seção 3: Documentação */}
              <div className="space-y-6">
                <div className="pb-2 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Documentação</h3>
                </div>

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
              </div>

              {/* Termos de Uso */}
              <div className="pt-8 border-t border-gray-200 space-y-6">
                <TermsScrollViewer 
                  onScrollToBottom={setHasReadTermsCompletely} 
                  hasScrolledToBottom={hasReadTermsCompletely} 
                />
                
                <NewTermsCheckbox 
                  acceptedTerms={acceptedTerms} 
                  acceptedPrivacy={acceptedPrivacy} 
                  onTermsChange={setAcceptedTerms} 
                  onPrivacyChange={setAcceptedPrivacy} 
                  hasReadTermsCompletely={hasReadTermsCompletely} 
                  hasReadPrivacyCompletely={true} 
                />
              </div>

              {/* Botão de Criar Conta */}
              <Button 
                type="submit"
                disabled={isLoading || !acceptedTerms || !hasReadTermsCompletely} 
                className="w-full h-12 bg-gradient-to-r from-exa-red to-exa-highlight-red hover:from-exa-highlight-red hover:to-exa-red text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            </form>
            
            <div className="text-center pt-6 border-t border-gray-200 mt-8">
              <p className="text-gray-600 mb-2">
                Já tem uma conta?
              </p>
              <Link to="/login" className="text-exa-red hover:text-exa-highlight-red font-semibold transition-colors">
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
