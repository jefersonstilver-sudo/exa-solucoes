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
import { Switch } from '@/components/ui/switch';
import { Crown, Shield, UserCheck, Loader2, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useEmailCheck } from '@/hooks/useEmailCheck';
import ExistingUserAlert from './ExistingUserAlert';

// Schema de validação
const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Email inválido' })
    .max(255, { message: 'Email muito longo' }),
  nome: z
    .string()
    .trim()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome muito longo' }),
  sobrenome: z
    .string()
    .trim()
    .min(2, { message: 'Sobrenome deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Sobrenome muito longo' }),
  cpf: z
    .string()
    .trim()
    .regex(/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2}|)$/, {
      message: 'CPF inválido (digite apenas números ou formato XXX.XXX.XXX-XX)',
    })
    .optional(),
  role: z.enum(['admin', 'admin_marketing', 'admin_financeiro', 'super_admin']),
});

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState('admin');
  const [documentoObrigatorio, setDocumentoObrigatorio] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExistingAlert, setShowExistingAlert] = useState(false);
  const { checking: checkingEmail, result: emailCheckResult, checkEmail } = useEmailCheck();

  // Função para formatar CPF automaticamente
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return numbers.slice(0, 11);
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const validateForm = () => {
    try {
      // Validar com schema base
      const formData = {
        email: email.trim(),
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        cpf: cpf.replace(/\D/g, ''), // Remove formatação para validação
        role: role as 'admin' | 'admin_marketing' | 'admin_financeiro' | 'super_admin',
      };

      // Se documento é obrigatório, adicionar validação extra
      if (documentoObrigatorio && !formData.cpf) {
        setErrors({ cpf: 'CPF é obrigatório quando marcado como obrigatório' });
        return false;
      }

      createUserSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleEmailBlur = async () => {
    if (email && email.includes('@')) {
      const result = await checkEmail(email);
      if (result.exists) {
        setShowExistingAlert(true);
      }
    }
  };

  const handleCreate = async () => {
    // Validar formulário
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    // Verificar email novamente antes de criar
    const emailCheck = await checkEmail(email);
    if (emailCheck.exists) {
      setShowExistingAlert(true);
      return;
    }

    try {
      setCreating(true);

      const nomeCompleto = `${nome.trim()} ${sobrenome.trim()}`;
      const cpfLimpo = cpf.replace(/\D/g, ''); // Remove formatação

      // Preparar dados para a Edge Function
      const requestBody: any = {
        email: email.trim(),
        adminType: role,
        nome: nomeCompleto,
      };

      // Adicionar CPF se fornecido
      if (cpfLimpo) {
        requestBody.cpf = cpfLimpo;
        requestBody.tipo_documento = 'cpf';
      }

      console.log('📤 Enviando requisição para criar usuário:', requestBody);

      // Chamar Edge Function para criar usuário administrativo
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'create-admin-account',
        {
          body: requestBody,
        }
      );

      console.log('📥 Resposta da Edge Function:', { functionData, functionError });

      if (functionError) {
        console.error('❌ Erro da Edge Function:', functionError);
        throw new Error(functionError.message || 'Erro ao criar usuário');
      }

      if (functionData?.error) {
        console.error('❌ Erro retornado pela função:', functionData.error);
        
        // Tratamento especial para email duplicado
        if (functionData.error.code === 'EMAIL_EXISTS') {
          toast.error('⚠️ Email já existe no sistema', {
            description: 'Este email já está registrado. Verifique a lista de usuários ou use outro email.',
            duration: 6000,
          });
          return;
        }
        
        throw new Error(functionData.error.error || functionData.error.message || 'Erro ao criar usuário');
      }

      if (!functionData?.user) {
        console.error('❌ Resposta sem dados do usuário:', functionData);
        throw new Error('Falha ao criar usuário - nenhum dado retornado');
      }

      const roleLabels = {
        admin: 'Administrador Geral',
        admin_marketing: 'Administrador Marketing',
        admin_financeiro: 'Administrador Financeiro',
        super_admin: 'Super Administrador',
      };

      // Usar senha retornada pela Edge Function
      const senhaRetornada = functionData.password || 'exa2025';

      toast.success(`✅ Conta criada com sucesso!`, {
        description: `${nomeCompleto} - ${email}`,
        duration: 6000,
      });

      const credentials = `Nome: ${nomeCompleto}\nEmail: ${email}\nSenha: ${senhaRetornada}\nTipo: ${
        roleLabels[role as keyof typeof roleLabels]
      }`;
      
      // Tentar copiar para clipboard (pode falhar em ambientes de preview)
      try {
        await navigator.clipboard.writeText(credentials);
        toast.info('📋 Credenciais copiadas para área de transferência', {
          duration: 4000,
        });
      } catch (clipboardError) {
        console.warn('⚠️ Não foi possível copiar para clipboard (normal em preview):', clipboardError);
        toast.info('ℹ️ Anote as credenciais', {
          description: `Senha: ${senhaRetornada}`,
          duration: 8000,
        });
      }

      // Limpar formulário
      setEmail('');
      setNome('');
      setSobrenome('');
      setCpf('');
      setRole('admin');
      setDocumentoObrigatorio(false);
      setErrors({});
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black">Criar Nova Conta Administrativa</DialogTitle>
          <DialogDescription className="text-gray-600">
            Senha padrão: <span className="font-mono font-semibold">exa2025</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome e Sobrenome */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome" className="text-black flex items-center gap-1">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="João"
                className={`bg-white border-gray-300 text-black ${
                  errors.nome ? 'border-red-500' : ''
                }`}
                maxLength={100}
              />
              {errors.nome && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nome}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="sobrenome" className="text-black flex items-center gap-1">
                Sobrenome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sobrenome"
                type="text"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                placeholder="Silva"
                className={`bg-white border-gray-300 text-black ${
                  errors.sobrenome ? 'border-red-500' : ''
                }`}
                maxLength={100}
              />
              {errors.sobrenome && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.sobrenome}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-black flex items-center gap-1">
              Email <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="admin@exemplo.com"
                className={`bg-white border-gray-300 text-black ${
                  errors.email ? 'border-red-500' : ''
                } ${emailCheckResult?.exists ? 'border-amber-500' : ''}`}
                maxLength={255}
              />
              {checkingEmail && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
              {emailCheckResult?.exists && !checkingEmail && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
              )}
              {email && !emailCheckResult?.exists && !checkingEmail && email.includes('@') && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
            {emailCheckResult?.exists && !errors.email && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Este email já está cadastrado. Clique para ver detalhes.
              </p>
            )}
          </div>

          {/* CPF/Documento */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="cpf" className="text-black flex items-center gap-1">
                CPF/Documento
                {documentoObrigatorio && <span className="text-red-500">*</span>}
                {!documentoObrigatorio && (
                  <span className="text-xs text-gray-500 font-normal">(Opcional)</span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="documento-obrigatorio"
                  checked={documentoObrigatorio}
                  onCheckedChange={setDocumentoObrigatorio}
                />
                <Label
                  htmlFor="documento-obrigatorio"
                  className="text-xs text-gray-700 cursor-pointer"
                >
                  Tornar obrigatório
                </Label>
              </div>
            </div>
            <Input
              id="cpf"
              type="text"
              value={cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              className={`bg-white border-gray-300 text-black font-mono ${
                errors.cpf ? 'border-red-500' : ''
              }`}
              maxLength={14}
            />
            {errors.cpf && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.cpf}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Digite apenas números, a formatação será aplicada automaticamente
            </p>
          </div>

          {/* Tipo de Conta */}
          <div>
            <Label htmlFor="role" className="text-black flex items-center gap-1">
              Tipo de Conta <span className="text-red-500">*</span>
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-white border-gray-300 text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="admin">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span>Administrador Geral</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin_marketing">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-4 w-4 text-purple-500" />
                    <span>Administrador Marketing</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin_financeiro">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span>Administrador Financeiro</span>
                  </div>
                </SelectItem>
                <SelectItem value="super_admin">
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span>Super Administrador</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aviso de Senha */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>💡 Importante:</strong> A senha padrão{' '}
              <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">exa2025</code> será
              enviada automaticamente. O usuário deve alterá-la no primeiro acesso.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={creating || checkingEmail || emailCheckResult?.exists}
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Conta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Alert de Email Existente */}
      <ExistingUserAlert
        open={showExistingAlert}
        onOpenChange={setShowExistingAlert}
        email={email}
        role={emailCheckResult?.role}
        nome={emailCheckResult?.nome}
      />
    </Dialog>
  );
};

export default CreateUserDialog;
