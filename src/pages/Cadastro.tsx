
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import RegistrationHeader from '@/components/auth/RegistrationHeader';
import RegistrationForm from '@/components/auth/RegistrationForm';
import ErrorDisplay from '@/components/auth/ErrorDisplay';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj'>('cpf');
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
      
      if (!validateDocument(document, documentType)) {
        setError(`${documentType.toUpperCase()} inválido. Verifique se digitou corretamente.`);
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
            document: document.replace(/\D/g, '')
          }
        }
      });
      
      if (error) {
        console.error('❌ [CADASTRO] Erro no cadastro:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('✅ [CADASTRO] Usuário criado com sucesso');
        
        toast({
          title: "Conta criada com sucesso",
          description: "Bem-vindo(a) à Indexa!"
        });
        
        // Auto-login for better UX
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.error("❌ [CADASTRO] Erro no auto-login:", signInError);
          navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
          return;
        }
        
        console.log('🎯 [CADASTRO] Redirecionando para:', redirectPath);
        navigate(redirectPath);
      }
    } catch (error: any) {
      console.error("💥 [CADASTRO] Erro crítico:", error);
      const errorMessage = error.message || "Erro ao criar conta. Tente novamente.";
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center min-h-[80vh] px-4 py-8"
      >
        <Card className="w-full max-w-xl shadow-lg border-indexa-purple/10">
          <RegistrationHeader />
          <CardContent className="px-8 pb-6">
            {error && <ErrorDisplay error={error} />}
            
            <RegistrationForm
              name={name}
              email={email}
              password={password}
              document={document}
              documentType={documentType}
              isLoading={isLoading}
              onNameChange={setName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onDocumentTypeChange={setDocumentType}
              onDocumentChange={handleChangeDocument}
              onSubmit={handleSignUp}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0 px-8 pb-8">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Já tem uma conta?</span>{' '}
              <Link 
                to={`/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                className="font-medium text-indexa-purple hover:text-indexa-purple-dark hover:underline transition-colors"
              >
                Faça login
              </Link>
            </div>
            
            <div className="text-center text-xs text-muted-foreground">
              <p>Ao criar uma conta, você concorda com os nossos <a href="#" className="underline hover:text-indexa-purple transition-colors">termos de uso</a> e <a href="#" className="underline hover:text-indexa-purple transition-colors">política de privacidade</a>.</p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </Layout>
  );
}
