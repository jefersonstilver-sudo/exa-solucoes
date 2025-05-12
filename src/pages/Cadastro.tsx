
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Input masking function for CPF/CNPJ
const formatDocument = (value: string, type: 'cpf' | 'cnpj'): string => {
  if (!value) return '';
  
  // Remove non-digits
  const digits = value.replace(/\D/g, '');
  
  if (type === 'cpf') {
    // Format as CPF (e.g., 123.456.789-10)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  } else {
    // Format as CNPJ (e.g., 12.345.678/0001-90)
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .substring(0, 18);
  }
};

// Form schema validation
const signupSchema = z.object({
  fullName: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  documentType: z.enum(['cpf', 'cnpj']),
  document: z.string().refine(val => {
    // Simple validation - just checking if we have the right number of digits
    const digits = val.replace(/\D/g, '');
    return digits.length === 11 || digits.length === 14;
  }, {
    message: "Documento inválido"
  })
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Cadastro() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      documentType: 'cpf',
      document: ''
    }
  });
  
  // Handle document input with masking
  const [documentValue, setDocumentValue] = useState('');
  const documentType = form.watch('documentType');
  
  useEffect(() => {
    // Reset document value when type changes
    setDocumentValue('');
    form.setValue('document', '');
  }, [documentType, form]);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // User is already logged in, redirect
        navigate('/paineis-digitais/loja');
      }
    };
    
    checkSession();
  }, [navigate]);
  
  const handleSignup = async (values: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            document_type: values.documentType,
            document: values.document.replace(/\D/g, '') // Store without formatting
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo à Indexa! Por favor, verifique seu email para confirmar sua conta."
        });
        
        // Redirect to client panel
        navigate('/paineis-digitais/loja');
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "Erro ao criar conta. Tente novamente.");
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message || "Verifique seus dados e tente novamente."
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
        className="flex items-center justify-center min-h-[80vh] px-4 py-10"
      >
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-indexa-purple flex items-center justify-center gap-2">
              <UserPlus size={24} /> Crie sua conta
            </CardTitle>
            <CardDescription>
              Preencha os dados abaixo para criar sua conta na Indexa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="João da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de documento</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cpf" id="cpf" />
                            <Label htmlFor="cpf">CPF</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cnpj" id="cnpj" />
                            <Label htmlFor="cnpj">CNPJ</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{documentType === 'cpf' ? 'CPF' : 'CNPJ'}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                          value={documentValue}
                          onChange={(e) => {
                            const formatted = formatDocument(e.target.value, documentType);
                            setDocumentValue(formatted);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-indexa-purple hover:bg-indexa-purple-dark"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Já tem uma conta?</span>{' '}
              <Link 
                to="/login" 
                className="font-medium text-indexa-purple hover:underline"
              >
                Entre agora
              </Link>
            </div>
            
            <div className="text-center text-xs text-muted-foreground">
              <p>Ao criar sua conta, você concorda com os nossos <a href="#" className="underline">termos de uso</a> e <a href="#" className="underline">política de privacidade</a>.</p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </Layout>
  );
}
