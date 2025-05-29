
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, UserPlus, ArrowRight, Mail, Key, UserCheck, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

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
  
  // Get the redirect path from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/paineis-digitais/loja';

  // Format document input with mask
  const formatDocument = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    
    if (documentType === 'cpf') {
      // Format: 000.000.000-00
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    } else {
      // Format: 00.000.000/0000-00
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
      if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
      if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
  };

  const handleChangeDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatDocument(e.target.value);
    setDocument(formattedValue);
  };
  
  const validateDocument = (): boolean => {
    const digits = document.replace(/\D/g, '');
    
    if (documentType === 'cpf') {
      return digits.length === 11;
    } else {
      return digits.length === 14;
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      
      if (!validateDocument()) {
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
        <Card className="w-full max-w-md shadow-lg border-indexa-purple/10">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <CardTitle className="text-2xl font-bold text-indexa-purple flex items-center justify-center gap-2">
                <UserPlus size={24} /> Crie sua conta
              </CardTitle>
              <CardDescription>
                Preencha os dados abaixo para começar a usar a plataforma
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start"
              >
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}
            
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center text-gray-700">
                  <UserCheck className="h-4 w-4 mr-2 text-indexa-purple" /> Nome completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-indexa-purple/20 focus:border-indexa-purple"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-indexa-purple" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-indexa-purple/20 focus:border-indexa-purple"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center text-gray-700">
                  <Key className="h-4 w-4 mr-2 text-indexa-purple" /> Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-indexa-purple/20 focus:border-indexa-purple"
                />
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="documentType" className="flex items-center text-gray-700">
                  <FileText className="h-4 w-4 mr-2 text-indexa-purple" /> Tipo de documento
                </Label>
                <Select value={documentType} onValueChange={(value) => setDocumentType(value as 'cpf' | 'cnpj')}>
                  <SelectTrigger className="border-indexa-purple/20 focus:border-indexa-purple">
                    <SelectValue placeholder="Selecione o tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="document" className="flex items-center text-gray-700">
                  <FileText className="h-4 w-4 mr-2 text-indexa-purple" /> {documentType.toUpperCase()}
                </Label>
                <Input
                  id="document"
                  type="text"
                  placeholder={documentType === 'cpf' ? "000.000.000-00" : "00.000.000/0000-00"}
                  value={document}
                  onChange={handleChangeDocument}
                  required
                  className="border-indexa-purple/20 focus:border-indexa-purple"
                  maxLength={documentType === 'cpf' ? 14 : 18}
                />
              </div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full bg-indexa-purple hover:bg-indexa-purple-dark transition-all duration-200"
                  disabled={isLoading}
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
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0">
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
