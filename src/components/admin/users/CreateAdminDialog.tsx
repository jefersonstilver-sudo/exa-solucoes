
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, Briefcase, Copy, Check, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated: () => void;
}

const CreateAdminDialog: React.FC<CreateAdminDialogProps> = ({
  open,
  onOpenChange,
  onAccountCreated
}) => {
  const [email, setEmail] = useState('');
  const [adminType, setAdminType] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    role: string;
  } | null>(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  const adminTypes = [
    {
      value: 'admin',
      label: 'Administrador Geral',
      description: 'Acesso completo exceto criação de usuários',
      icon: Shield,
      color: 'text-blue-600'
    },
    {
      value: 'admin_marketing',
      label: 'Administrador Marketing',
      description: 'Apenas leads, campanhas e configuração da homepage',
      icon: Briefcase,
      color: 'text-purple-600'
    },
    {
      value: 'admin_financeiro',
      label: 'Administrador Financeiro',
      description: 'Acesso a pedidos, benefícios e relatórios financeiros',
      icon: Briefcase,
      color: 'text-emerald-600'
    },
    {
      value: 'super_admin',
      label: 'Super Administrador',
      description: 'Acesso total incluindo gestão de usuários',
      icon: Crown,
      color: 'text-indexa-purple'
    }
  ];

  const selectedAdminType = adminTypes.find(type => type.value === adminType);

  // Função para iniciar countdown de rate limit
  const startRateLimitCountdown = (seconds: number) => {
    setRateLimitCountdown(seconds);
    const interval = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCreateAccount = async () => {
    if (!email || !adminType) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Digite um email válido');
      return;
    }

    setIsCreating(true);

    try {
      console.log('🔧 [CREATE ADMIN] Iniciando criação via Edge Function:', { email, adminType });

      // Chamar a edge function para criar a conta
      const { data, error } = await supabase.functions.invoke('create-admin-account', {
        body: {
          email,
          adminType
        }
      });

      if (error) {
        console.error('❌ [CREATE ADMIN] Erro da Edge Function:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('❌ [CREATE ADMIN] Resposta de erro:', data);
        
        // Tratar diferentes tipos de erro
        if (data?.code === 'EMAIL_EXISTS') {
          toast.error('Este email já possui uma conta no sistema');
        } else if (data?.code === 'INVALID_EMAIL') {
          toast.error('Email inválido');
        } else if (data?.code === 'INVALID_ROLE') {
          toast.error('Tipo de administrador inválido');
        } else {
          toast.error(data?.error || 'Erro ao criar conta administrativa');
        }
        return;
      }

      console.log('✅ [CREATE ADMIN] Conta criada com sucesso!', data);

      // Definir credenciais criadas
      setCreatedCredentials({
        email: data.user.email,
        password: data.user.password,
        role: data.user.role
      });

      // Copiar credenciais automaticamente
      const credentialsText = `Email: ${data.user.email}\nSenha: ${data.user.password}\nTipo: ${selectedAdminType?.label}`;
      
      try {
        await navigator.clipboard.writeText(credentialsText);
        setCredentialsCopied(true);
        setTimeout(() => setCredentialsCopied(false), 3000);
      } catch (clipboardError) {
        console.warn('Não foi possível copiar para área de transferência:', clipboardError);
      }

      // Feedback de sucesso
      toast.success(`Conta ${selectedAdminType?.label} criada com sucesso!`, {
        description: 'Credenciais copiadas para área de transferência'
      });

      // Atualizar lista
      onAccountCreated();

      // Reset form
      setEmail('');
      setAdminType('');

    } catch (error: any) {
      console.error('💥 [CREATE ADMIN] Erro crítico:', error);
      
      let errorMessage = 'Erro ao criar conta administrativa';
      
      // Tratar erro de rate limiting especificamente
      if (error.message?.includes('rate limit') || error.message?.includes('35 seconds')) {
        errorMessage = 'Aguarde 35 segundos antes de tentar novamente';
        startRateLimitCountdown(35);
        toast.error(errorMessage, {
          description: 'Limite de tentativas atingido por segurança'
        });
      } else if (error.message?.includes('email_address_already_exists')) {
        errorMessage = 'Este email já possui uma conta no sistema';
        toast.error(errorMessage);
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'Este email já está registrado';
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage, {
          description: error.message
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseDialog = () => {
    setCreatedCredentials(null);
    setCredentialsCopied(false);
    setEmail('');
    setAdminType('');
    setRateLimitCountdown(null);
    onOpenChange(false);
  };

  const copyCredentials = async () => {
    if (!createdCredentials) return;
    
    const credentialsText = `Email: ${createdCredentials.email}\nSenha: ${createdCredentials.password}\nTipo: ${selectedAdminType?.label}`;
    
    try {
      await navigator.clipboard.writeText(credentialsText);
      setCredentialsCopied(true);
      setTimeout(() => setCredentialsCopied(false), 3000);
      toast.success('Credenciais copiadas!');
    } catch (error) {
      toast.error('Erro ao copiar credenciais');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Crown className="h-6 w-6 mr-2 text-indexa-purple" />
            Criar Nova Conta Administrativa
          </DialogTitle>
          <DialogDescription>
            Crie uma nova conta para um membro da equipe EXA. A senha padrão será "exa2025".
          </DialogDescription>
        </DialogHeader>

        {/* Rate Limit Warning */}
        {rateLimitCountdown && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center text-orange-800">
              <Clock className="h-5 w-5 mr-2" />
              <div>
                <h4 className="font-semibold">Aguarde para tentar novamente</h4>
                <p className="text-sm">
                  Por segurança, aguarde {rateLimitCountdown} segundos antes da próxima tentativa.
                </p>
              </div>
            </div>
          </div>
        )}

        {createdCredentials ? (
          // Exibir credenciais criadas
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                <Check className="h-5 w-5 mr-2" />
                Conta Criada com Sucesso!
              </h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Email:</strong> {createdCredentials.email}
                </div>
                <div>
                  <strong>Senha:</strong> {createdCredentials.password}
                </div>
                <div>
                  <strong>Tipo:</strong> {selectedAdminType?.label}
                </div>
              </div>

              <Button
                onClick={copyCredentials}
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                disabled={credentialsCopied}
              >
                {credentialsCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Credenciais
                  </>
                )}
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Envie essas credenciais para o novo administrador. 
                Ele deve alterar a senha no primeiro acesso.
              </p>
            </div>
          </div>
        ) : (
          // Formulário de criação
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isCreating || !!rateLimitCountdown}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminType">Tipo de Administrador *</Label>
              <Select 
                value={adminType} 
                onValueChange={setAdminType} 
                disabled={isCreating || !!rateLimitCountdown}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de administrador" />
                </SelectTrigger>
                <SelectContent>
                  {adminTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className={`h-4 w-4 ${type.color}`} />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedAdminType && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <selectedAdminType.icon className={`h-4 w-4 mr-2 ${selectedAdminType.color}`} />
                  {selectedAdminType.label}
                </h4>
                <p className="text-sm text-gray-600">{selectedAdminType.description}</p>
                
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Senha padrão: exa2025
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {createdCredentials ? (
            <Button onClick={handleCloseDialog} className="w-full">
              Fechar
            </Button>
          ) : (
            <div className="flex space-x-2 w-full">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isCreating}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAccount}
                disabled={isCreating || !email || !adminType || !!rateLimitCountdown}
                className="flex-1 bg-indexa-purple hover:bg-indexa-purple/90"
              >
                {isCreating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </div>
                ) : rateLimitCountdown ? (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Aguarde {rateLimitCountdown}s
                  </div>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdminDialog;
