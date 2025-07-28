
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import RegistrationHeader from '@/components/auth/RegistrationHeader';
import ImprovedRegistrationForm from '@/components/auth/ImprovedRegistrationForm';
import ErrorDisplay from '@/components/auth/ErrorDisplay';
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
            privacy_accepted_at: new Date().toISOString()
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
      {/* Container principal com padding adequado para evitar sobreposição do header */}
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <RegistrationHeader />
              
              <CardContent className="p-6">
                {error && <ErrorDisplay error={error} />}
                
                <ImprovedRegistrationForm
                  name={name}
                  email={email}
                  password={password}
                  confirmPassword={confirmPassword}
                  document={document}
                  documentType={documentType}
                  acceptedTerms={acceptedTerms}
                  acceptedPrivacy={acceptedPrivacy}
                  isLoading={isLoading}
                  onNameChange={setName}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onConfirmPasswordChange={setConfirmPassword}
                  onDocumentTypeChange={setDocumentType}
                  onDocumentChange={handleChangeDocument}
                  onTermsChange={setAcceptedTerms}
                  onPrivacyChange={setAcceptedPrivacy}
                  onSubmit={handleSignUp}
                />
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
                <div className="text-center text-sm">
                  <span className="text-gray-600">Já tem uma conta?</span>{' '}
                  <Link 
                    to={`/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                    className="font-medium text-indexa-purple hover:text-indexa-purple-dark hover:underline transition-colors"
                  >
                    Faça login
                  </Link>
                </div>
                
                <div className="text-center text-xs text-gray-500 px-2">
                  <p>
                    Ao criar uma conta, você concorda com os nossos{' '}
                    <a href="#" className="underline hover:text-indexa-purple transition-colors">
                      termos de uso
                    </a>{' '}
                    e{' '}
                    <a href="#" className="underline hover:text-indexa-purple transition-colors">
                      política de privacidade
                    </a>.
                  </p>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
