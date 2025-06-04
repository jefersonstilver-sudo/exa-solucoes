
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
import { Crown, Shield, Briefcase, Copy, Check } from 'lucide-react';
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
      value: 'super_admin',
      label: 'Super Administrador',
      description: 'Acesso total incluindo gestão de usuários',
      icon: Crown,
      color: 'text-indexa-purple'
    }
  ];

  const selectedAdminType = adminTypes.find(type => type.value === adminType);

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
    const defaultPassword = 'indexa2025';

    try {
      console.log('🔧 [CREATE ADMIN] Iniciando criação de conta:', { email, adminType });

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: defaultPassword,
        options: {
          data: {
            role: adminType,
            created_by_admin: true
          }
        }
      });

      if (authError) {
        console.error('❌ [CREATE ADMIN] Erro no Auth:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado no Auth');
      }

      console.log('✅ [CREATE ADMIN] Usuário criado no Auth:', authData.user.id);

      // 2. Inserir na tabela users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          role: adminType
        });

      if (userError) {
        console.error('❌ [CREATE ADMIN] Erro ao inserir na tabela users:', userError);
        throw userError;
      }

      console.log('✅ [CREATE ADMIN] Usuário inserido na tabela users');

      // 3. Definir credenciais criadas
      setCreatedCredentials({
        email,
        password: defaultPassword,
        role: adminType
      });

      // 4. Copiar credenciais automaticamente
      const credentialsText = `Email: ${email}\nSenha: ${defaultPassword}\nTipo: ${selectedAdminType?.label}`;
      
      try {
        await navigator.clipboard.writeText(credentialsText);
        setCredentialsCopied(true);
        setTimeout(() => setCredentialsCopied(false), 3000);
      } catch (clipboardError) {
        console.warn('Não foi possível copiar para área de transferência:', clipboardError);
      }

      // 5. Feedback de sucesso
      toast.success(`Conta ${selectedAdminType?.label} criada com sucesso!`, {
        description: 'Credenciais copiadas para área de transferência'
      });

      // 6. Atualizar lista
      onAccountCreated();

      // Reset form
      setEmail('');
      setAdminType('');

    } catch (error: any) {
      console.error('💥 [CREATE ADMIN] Erro crítico:', error);
      
      let errorMessage = 'Erro ao criar conta administrativa';
      
      if (error.message?.includes('email_address_already_exists')) {
        errorMessage = 'Este email já possui uma conta no sistema';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'Este email já está registrado';
      }
      
      toast.error(errorMessage, {
        description: error.message
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseDialog = () => {
    setCreatedCredentials(null);
    setCredentialsCopied(false);
    setEmail('');
    setAdminType('');
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
            Crie uma nova conta para um membro da equipe INDEXA. A senha padrão será "indexa2025".
          </DialogDescription>
        </DialogHeader>

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
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminType">Tipo de Administrador *</Label>
              <Select value={adminType} onValueChange={setAdminType} disabled={isCreating}>
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
                    Senha padrão: indexa2025
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
                disabled={isCreating || !email || !adminType}
                className="flex-1 bg-indexa-purple hover:bg-indexa-purple/90"
              >
                {isCreating ? 'Criando...' : 'Criar Conta'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdminDialog;
