
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Mail, Key, UserCheck, ArrowRight } from 'lucide-react';
import RegistrationHeader from '@/components/auth/RegistrationHeader';
import ErrorDisplay from '@/components/auth/ErrorDisplay';
import DocumentInput from '@/components/auth/DocumentInput';
import { PasswordInput } from '@/components/ui/password-input';
import NewTermsCheckbox from '@/components/auth/NewTermsCheckbox';
import { TermsScrollViewer } from '@/components/auth/TermsScrollViewer';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [hasReadTermsCompletely, setHasReadTermsCompletely] = useState(false);
  const [hasReadPrivacyCompletely, setHasReadPrivacyCompletely] = useState(true); // Por enquanto só termos
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const { formatDocument, validateDocument } = useDocumentValidation();
  
  // Get the redirect path from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/paineis-digitais/loja';

  const handleChangeDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatDocument(e.target.value, documentType);
    setDocument(formattedValue);
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
      }
      
      if (!validateDocument(document, documentType)) {
        setError(`${documentType.toUpperCase()} inválido. Verifique se digitou corretamente.`);
        return;
      }
      
      if (!acceptedTerms || !acceptedPrivacy) {
        setError("É obrigatório aceitar os Termos de Uso e a Política de Privacidade.");
        return;
      }
      
      if (!hasReadTermsCompletely) {
        setError("Você deve ler os Termos de Uso completamente antes de prosseguir.");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [CADASTRO] Iniciando processo de cadastro...');
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            document_type: documentType,
            document: document.replace(/\D/g, ''),
            terms_accepted: true,
            privacy_accepted: true,
            terms_accepted_at: new Date().toISOString(),
            privacy_accepted_at: new Date().toISOString(),
            terms_read_completely: hasReadTermsCompletely,
            terms_read_at: new Date().toISOString()
          },
          emailRedirectTo: `${window.location.origin}/confirmacao?redirect=${encodeURIComponent(redirectPath)}`
        }
      });
      
      if (error) {
        console.error('❌ [CADASTRO] Erro no cadastro:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('✅ [CADASTRO] Usuário criado - aguardando confirmação de email');
        
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar sua conta."
        });
        
        // Redirect to email sent page
        navigate(`/email-enviado?email=${encodeURIComponent(email)}`);
      }
    } catch (error: any) {
      console.error("💥 [CADASTRO] Erro crítico:", error);
      let errorMessage = "Erro ao criar conta. Tente novamente.";
      
      if (error.message?.includes('already registered')) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Email inválido. Verifique se digitou corretamente.";
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
      {/* Container principal expandido para layout largo */}
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <RegistrationHeader />
              
              <CardContent className="p-8">
                {error && (
                  <div className="mb-6">
                    <ErrorDisplay error={error} />
                  </div>
                )}
                
                {/* Layout de duas colunas: Formulário + Termos */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Coluna esquerda: Formulário (40%) */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center text-gray-900">
                          <UserCheck className="h-4 w-4 mr-2 text-indexa-purple" /> Nome completo
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
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center text-gray-900">
                          <Mail className="h-4 w-4 mr-2 text-indexa-purple" /> Email
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
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center text-gray-900">
                          <Key className="h-4 w-4 mr-2 text-indexa-purple" /> Senha
                        </Label>
                        <PasswordInput
                          id="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500"
                        />
                        <p className="text-xs text-gray-600">
                          A senha deve ter pelo menos 6 caracteres
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="flex items-center text-gray-900">
                          <Key className="h-4 w-4 mr-2 text-indexa-purple" /> Confirmar senha
                        </Label>
                        <PasswordInput
                          id="confirmPassword"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500"
                        />
                      </div>
                      
                      <DocumentInput
                        documentType={documentType}
                        document={document}
                        onDocumentTypeChange={setDocumentType}
                        onDocumentChange={handleChangeDocument}
                      />
                    </div>
                    
                    {/* Aceite dos termos com nova validação */}
                    <NewTermsCheckbox
                      acceptedTerms={acceptedTerms}
                      acceptedPrivacy={acceptedPrivacy}
                      onTermsChange={setAcceptedTerms}
                      onPrivacyChange={setAcceptedPrivacy}
                      hasReadTermsCompletely={hasReadTermsCompletely}
                      hasReadPrivacyCompletely={hasReadPrivacyCompletely}
                    />
                    
                    {/* Botão de submissão */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="pt-4"
                    >
                      <Button 
                        onClick={handleSignUp}
                        type="button"
                        className="w-full bg-indexa-purple hover:bg-indexa-purple-dark transition-all duration-200 h-12 text-base font-semibold"
                        disabled={isLoading || !acceptedTerms || !acceptedPrivacy || !hasReadTermsCompletely}
                      >
                        {isLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Criando conta...
                          </>
                        ) : (
                          <>
                            Criar conta <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                    
                    <div className="text-center text-sm">
                      <span className="text-gray-600">Já tem uma conta?</span>{' '}
                      <Link 
                        to={`/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                        className="font-medium text-indexa-purple hover:text-indexa-purple-dark hover:underline transition-colors"
                      >
                        Faça login
                      </Link>
                    </div>
                  </div>
                  
                  {/* Coluna direita: Visualização dos termos (60%) */}
                  <div className="lg:col-span-3">
                    <TermsScrollViewer
                      onScrollToBottom={setHasReadTermsCompletely}
                      hasScrolledToBottom={hasReadTermsCompletely}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
