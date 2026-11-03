import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCorNavegador } from '@/lib/corNavegador';
import { useFonteSite } from '@/site/comum';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createBreadcrumbSchema } from '@/components/seo/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Turnstile, { conferirCaptcha } from '@/components/seguranca/Turnstile';
import { motion } from 'framer-motion';
import { User, Mail, Phone as PhoneIcon, AlertCircle, LogIn, KeyRound } from 'lucide-react';
import DocumentInput from '@/components/auth/DocumentInput';
import RegistrationHeader from '@/components/auth/RegistrationHeader';
import ErrorDisplay from '@/components/auth/ErrorDisplay';
import NewTermsCheckbox from '@/components/auth/NewTermsCheckbox';
import { TermsScrollViewer } from '@/components/auth/TermsScrollViewer';
import { PhoneInput } from '@/components/ui/phone-input';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordRequirements, validatePassword } from '@/components/auth/PasswordRequirements';
import { PhoneVerificationInline } from '@/components/auth/PhoneVerificationInline';

const Cadastro: React.FC = () => {
  // Estados do formulário
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<'BR' | 'PY' | 'AR'>('BR');
  const [phoneCode, setPhoneCode] = useState('+55');
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
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReinicio, setCaptchaReinicio] = useState(0);
  const [emailExists, setEmailExists] = useState<boolean>(false);
  const [emailConfirmed, setEmailConfirmed] = useState<boolean>(false);
  const [emailExistsMessage, setEmailExistsMessage] = useState<string>('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationSessionId, setVerificationSessionId] = useState<string>('');

  // Hooks
  const navigate = useNavigate();
  const { toast } = useToast();
  useFonteSite();
  useCorNavegador({ topo: '#0B0B0D', fundo: '#0B0B0D' });
  const location = useLocation();
  const { formatDocument, validateDocument } = useDocumentValidation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/';

  // Handlers
  const handleChangeDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value, documentType);
    setDocument(formatted);
  };

  const handlePhoneChange = (formatted: string, fullNumber: string, countryCode: 'BR' | 'PY' | 'AR' | 'UY' | 'CL' | 'US') => {
    setPhone(formatted);
    setPhoneCountry(countryCode as 'BR' | 'PY' | 'AR');
    // Extrair código do país
    const codes: Record<string, string> = { BR: '+55', PY: '+595', AR: '+54', UY: '+598', CL: '+56', US: '+1' };
    setPhoneCode(codes[countryCode] || '+55');
  };

  const validatePhone = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  };

  // Verificar se email já existe (com debounce)
  useEffect(() => {
    const checkEmailExists = async () => {
      if (!email || email.length < 5 || !email.includes('@')) {
        setEmailExists(false);
        setEmailExistsMessage('');
        return;
      }

      setIsCheckingEmail(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('check-email-exists', {
          body: { email: email.toLowerCase().trim() }
        });

        if (error) {
          console.error('Erro ao verificar email:', error);
          return;
        }

        if (data?.exists) {
          setEmailExists(true);
          setEmailConfirmed(data.is_confirmed || false);
          setEmailExistsMessage(data.message || 'Este email já está cadastrado.');
        } else {
          setEmailExists(false);
          setEmailConfirmed(false);
          setEmailExistsMessage('');
        }
      } catch (error) {
        console.error('Erro ao verificar email:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    // Debounce de 800ms
    const timeoutId = setTimeout(checkEmailExists, 800);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // VERIFICAÇÃO CRÍTICA: Email duplicado E CONFIRMADO
      if (emailExists && emailConfirmed) {
        setError('Este email já está cadastrado e confirmado. Faça login para acessar sua conta.');
        setIsLoading(false);
        return;
      }

      // Validações de nome
      if (!firstName.trim() || firstName.trim().length < 2) {
        setError('Primeiro nome é obrigatório (mínimo 2 caracteres)');
        return;
      }
      if (!lastName.trim() || lastName.trim().length < 2) {
        setError('Sobrenome é obrigatório (mínimo 2 caracteres)');
        return;
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      
      // Validações
      const passwordValidation = validatePassword(password, fullName);
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

      // CRÍTICO: Verificar WhatsApp ANTES de criar conta
      if (!phoneVerified) {
        setError('Você precisa verificar seu WhatsApp antes de continuar');
        toast({
          variant: "destructive",
          title: "Verificação necessária",
          description: "Por favor, verifique seu WhatsApp antes de criar a conta"
        });
        return;
      }

      // Captcha (Cloudflare Turnstile) conferido no servidor antes de criar a conta
      if (!captchaToken) {
        setError('Confirme que você não é um robô (caixa acima do botão).');
        return;
      }
      const captchaOk = await conferirCaptcha(captchaToken, 'cadastro');
      setCaptchaToken('');
      setCaptchaReinicio((n) => n + 1);
      if (!captchaOk) {
        setError('Não consegui confirmar que você não é um robô. Marque a caixa de novo e tente outra vez.');
        return;
      }

      // Criar conta primeiro para obter userId
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectTo}`,
          data: {
            name: fullName,
            primeiro_nome: firstName.trim(),
            sobrenome: lastName.trim(),
            phone: `${phoneCode}${phone.replace(/\D/g, '')}`,
            phoneCountry,
            document,
            documentType,
            country: documentType === 'documento_estrangeiro' ? country : null,
            documentFrontUrl: documentType === 'documento_estrangeiro' ? documentFrontUrl : null,
            documentBackUrl: documentType === 'documento_estrangeiro' ? documentBackUrl : null,
            redirectAfterConfirm: redirectTo
          }
        }
      });

      if (signUpError) throw signUpError;
      
      // Associar verificação de WhatsApp ao userId recém-criado
      if (data.user?.id && verificationSessionId) {
        console.log('🔗 [CADASTRO] Associando verificação WhatsApp ao userId:', data.user.id);
        
        // Atualizar o código de verificação para incluir o userId
        const { error: updateError } = await supabase
          .from('exa_alerts_verification_codes')
          .update({ user_id: data.user.id })
          .eq('session_id', verificationSessionId)
          .eq('telefone', `${phoneCode}${phone.replace(/\D/g, '')}`);

        if (updateError) {
          console.error('⚠️ [CADASTRO] Erro ao associar verificação:', updateError);
        }

        // Marcar telefone como verificado (com retry para aguardar trigger criar row)
        const fullPhone = `${phoneCode}${phone.replace(/\D/g, '')}`;
        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          const { error: markError } = await supabase
            .from('users')
            .update({ 
              telefone: fullPhone,
              telefone_verificado: true,
              telefone_verificado_at: new Date().toISOString()
            })
            .eq('id', data.user.id);

          if (!markError) break;
          console.warn(`⚠️ [CADASTRO] Tentativa ${attempt + 1} de marcar telefone verificado falhou:`, markError);
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu e-mail para confirmar sua conta."
      });

      navigate(`/email-not-confirmed?email=${encodeURIComponent(email)}`);
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
    <div className="exa-vidro-pagina dark">
      <SEO 
        title="Criar Conta - EXA Publicidade Inteligente" 
        description="Crie sua conta gratuita na EXA e comece a anunciar em painéis digitais de elevadores em Foz do Iguaçu. Cadastro rápido e seguro." 
        keywords="criar conta exa, cadastro anunciante, criar anúncio elevador, cadastro mídia indoor" 
        canonical="https://www.examidia.com.br/cadastro" 
        noindex={true} 
        structuredData={[
          organizationSchema, 
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://www.examidia.com.br/' }, 
            { name: 'Cadastro', url: 'https://www.examidia.com.br/cadastro' }
          ])
        ]} 
      />
      
      <header className="flex justify-center pt-[calc(env(safe-area-inset-top,0px)+28px)] pb-2">
        <Link to="/" aria-label="EXA, início"><img src="/site/exa-branco.svg" alt="EXA" width={96} height={42} style={{ height: 42, width: 'auto' }} /></Link>
      </header>
      <motion.div 
        className="flex items-start justify-center px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="exa-vidro w-full max-w-4xl border-0 shadow-none bg-transparent">
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
                    <Label htmlFor="firstName" className="flex items-center text-sm font-medium text-gray-900">
                      <User className="h-4 w-4 mr-2 text-exa-red" /> 
                      Nome <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="firstName" 
                      type="text" 
                      placeholder="Seu primeiro nome" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      required 
                      className="h-11" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center text-sm font-medium text-gray-900">
                      <User className="h-4 w-4 mr-2 text-exa-red" /> 
                      Sobrenome <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="lastName" 
                      type="text" 
                      placeholder="Seu sobrenome" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      required 
                      className="h-11" 
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center text-sm font-medium text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-exa-red" /> 
                      E-mail <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="relative">
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="seu@email.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        className={`h-11 pr-10 ${emailExists ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      {isCheckingEmail && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-exa-red"></div>
                        </div>
                      )}
                    </div>
                    {emailExists && emailConfirmed && (
                      <Alert className="mt-2 border-amber-500 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-sm text-amber-800">
                          <p className="font-semibold mb-2">{emailExistsMessage}</p>
                          <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-amber-600 text-amber-700 hover:bg-amber-100"
                              onClick={() => navigate('/login')}
                            >
                              <LogIn className="h-4 w-4 mr-1" />
                              Fazer Login
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-amber-600 text-amber-700 hover:bg-amber-100"
                              onClick={() => navigate('/esqueci-senha')}
                            >
                              <KeyRound className="h-4 w-4 mr-1" />
                              Recuperar Senha
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    {emailExists && !emailConfirmed && (
                      <Alert className="mt-2 border-blue-500 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-800">
                          <p className="font-semibold mb-2">{emailExistsMessage}</p>
                          <p className="text-xs mb-3">Você pode prosseguir com o cadastro. Um novo email de confirmação será enviado.</p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                <PhoneInput 
                  value={phone} 
                  onChange={handlePhoneChange}
                  defaultCountry="BR"
                  required
                />

                {/* Verificação INLINE de WhatsApp - aparece após preencher número válido */}
                {phone && phone.replace(/\D/g, '').length >= 10 && (
                  <PhoneVerificationInline
                    phone={`${phoneCode}${phone.replace(/\D/g, '')}`}
                    onVerified={(sessionId) => {
                      setPhoneVerified(true);
                      setVerificationSessionId(sessionId);
                    }}
                    disabled={phoneVerified}
                  />
                )}
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

                <PasswordRequirements password={password} userName={`${firstName} ${lastName}`} />

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

              <Turnstile onToken={setCaptchaToken} reiniciar={captchaReinicio} tema="dark" />

              {/* Botão de Criar Conta */}
              <Button 
                type="submit"
                data-vidro="principal"
                disabled={!captchaToken || isLoading || !acceptedTerms || !hasReadTermsCompletely || (emailExists && emailConfirmed) || isCheckingEmail}
                className="exa-vidro-botao w-full h-[54px]"
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
              <Link to="/login" className="font-extrabold text-white underline-offset-4 hover:underline">
                Fazer Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Cadastro;
