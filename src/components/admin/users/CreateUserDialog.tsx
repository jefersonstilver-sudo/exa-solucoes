import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Shield, UserCheck, Loader2, DollarSign, AlertCircle, CheckCircle2, Briefcase, Megaphone, Wallet, Settings, Monitor, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useEmailCheck } from '@/hooks/useEmailCheck';
import ExistingUserAlert from './ExistingUserAlert';
import EmailConfigWarning from './EmailConfigWarning';
import { useIsMobile } from '@/hooks/use-mobile';

// Interface for role types from database
interface RoleType {
  id: string;
  key: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  is_system: boolean;
}

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
  role: z.string().min(1, { message: 'Selecione um tipo de conta' }),
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
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState('admin');
  const [documentoObrigatorio, setDocumentoObrigatorio] = useState(false);
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Fetch role types from database
  useEffect(() => {
    const fetchRoleTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('role_types')
          .select('*')
          .eq('is_active', true)
          .neq('key', 'client') // Exclude client role for admin creation
          .neq('key', 'painel') // Exclude painel role
          .order('display_name');

        if (error) throw error;
        setRoleTypes(data || []);
        
        // Set default role to first admin type
        if (data && data.length > 0) {
          const adminRole = data.find(r => r.key === 'admin');
          if (adminRole) {
            setRole(adminRole.key);
          } else {
            setRole(data[0].key);
          }
        }
      } catch (error) {
        console.error('Error fetching role types:', error);
        toast.error('Erro ao carregar tipos de conta');
      } finally {
        setLoadingRoles(false);
      }
    };

    if (open) {
      fetchRoleTypes();
    }
  }, [open]);

  // Helper function to get icon component based on icon name
  const getRoleIcon = (iconName: string, color: string) => {
    const iconClass = `h-4 w-4`;
    const style = { color };
    
    switch (iconName) {
      case 'shield':
        return <Shield className={iconClass} style={style} />;
      case 'crown':
        return <Crown className={iconClass} style={style} />;
      case 'settings':
        return <Settings className={iconClass} style={style} />;
      case 'megaphone':
        return <Megaphone className={iconClass} style={style} />;
      case 'wallet':
        return <Wallet className={iconClass} style={style} />;
      case 'briefcase':
        return <Briefcase className={iconClass} style={style} />;
      case 'monitor':
        return <Monitor className={iconClass} style={style} />;
      case 'user':
        return <User className={iconClass} style={style} />;
      default:
        return <UserCheck className={iconClass} style={style} />;
    }
  };
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExistingAlert, setShowExistingAlert] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { checking: checkingEmail, result: emailCheckResult, checkEmail, clearResult } = useEmailCheck();

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
        role: role,
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
        // Tentar extrair mensagem específica do erro
        const errorDetails = functionError.message || 'Erro ao criar usuário';
        toast.error('Erro ao criar conta', {
          description: errorDetails,
          duration: 8000,
        });
        return;
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
        
        // Tratamento para role inválido
        if (functionData.error.code === 'INVALID_ROLE') {
          toast.error('⚠️ Tipo de conta inválido', {
            description: functionData.error.details || `Role "${role}" não é válido. Recarregue a página e tente novamente.`,
            duration: 8000,
          });
          return;
        }
        
        // Erro genérico com detalhes se disponível
        toast.error('Erro ao criar conta', {
          description: functionData.error.details || functionData.error.error || functionData.error.message || 'Erro desconhecido',
          duration: 8000,
        });
        return;
      }

      if (!functionData?.user) {
        console.error('❌ Resposta sem dados do usuário:', functionData);
        throw new Error('Falha ao criar usuário - nenhum dado retornado');
      }

      // Buscar label dinâmico do role carregado do banco
      const selectedRoleType = roleTypes.find(r => r.key === role);
      const roleLabel = selectedRoleType?.display_name || role;

      // Usar senha retornada pela Edge Function
      const senhaRetornada = functionData.password || 'exa2025';

      // Verificar se o email foi enviado
      if (!functionData.emailSent) {
        console.warn('⚠️ Email não foi enviado ao usuário');
        setEmailError('RESEND_API_KEY não configurada! Configure em: https://resend.com/api-keys');
        toast.warning('⚠️ Conta criada mas email não enviado', {
          description: 'Configure o RESEND_API_KEY para enviar emails automaticamente',
          duration: 8000,
        });
      } else {
        setEmailError(null);
      }

      toast.success(`✅ Conta criada com sucesso!`, {
        description: `${nomeCompleto} - ${email}`,
        duration: 6000,
      });

      const credentials = `Nome: ${nomeCompleto}\nEmail: ${email}\nSenha: ${senhaRetornada}\nTipo: ${roleLabel}`;
      
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

  // Form content component for reuse
  const formContent = (
    <div className={`space-y-4 ${isMobile ? 'px-1' : ''}`}>
      {/* Aviso de configuração de email */}
      {emailError && (
        <EmailConfigWarning show={true} errorMessage={emailError} />
      )}

      {/* Nome e Sobrenome */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 gap-4'}`}>
        <div>
          <Label htmlFor="nome" className="text-foreground text-sm">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="João"
            className={`bg-background border-input text-foreground ${isMobile ? 'h-11' : ''} ${
              errors.nome ? 'border-destructive' : ''
            }`}
            maxLength={100}
          />
          {errors.nome && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.nome}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="sobrenome" className="text-foreground text-sm">
            Sobrenome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sobrenome"
            type="text"
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
            placeholder="Silva"
            className={`bg-background border-input text-foreground ${isMobile ? 'h-11' : ''} ${
              errors.sobrenome ? 'border-destructive' : ''
            }`}
            maxLength={100}
          />
          {errors.sobrenome && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.sobrenome}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email" className="text-foreground text-sm">
          Email <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="admin@exemplo.com"
            className={`bg-background border-input text-foreground ${isMobile ? 'h-11' : ''} ${
              errors.email ? 'border-destructive' : ''
            } ${emailCheckResult?.exists ? 'border-amber-500' : ''}`}
            maxLength={255}
          />
          {checkingEmail && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {emailCheckResult?.exists && !checkingEmail && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
          )}
          {email && !emailCheckResult?.exists && !checkingEmail && email.includes('@') && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
        </div>
        {errors.email && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </p>
        )}
        {emailCheckResult?.exists && !errors.email && (
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Este email já está cadastrado.
          </p>
        )}
      </div>

      {/* CPF/Documento */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="cpf" className="text-foreground text-sm">
            CPF/Documento
            {documentoObrigatorio && <span className="text-destructive ml-1">*</span>}
            {!documentoObrigatorio && (
              <span className="text-xs text-muted-foreground font-normal ml-1">(Opcional)</span>
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
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Obrigatório
            </Label>
          </div>
        </div>
        <Input
          id="cpf"
          type="text"
          value={cpf}
          onChange={handleCPFChange}
          placeholder="000.000.000-00"
          className={`bg-background border-input text-foreground font-mono ${isMobile ? 'h-11' : ''} ${
            errors.cpf ? 'border-destructive' : ''
          }`}
          maxLength={14}
        />
        {errors.cpf && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.cpf}
          </p>
        )}
      </div>

      {/* Tipo de Conta */}
      <div>
        <Label htmlFor="role" className="text-foreground text-sm">
          Tipo de Conta <span className="text-destructive">*</span>
        </Label>
        <Select value={role} onValueChange={setRole} disabled={loadingRoles}>
          <SelectTrigger className={`bg-background border-input text-foreground ${isMobile ? 'h-11' : ''}`}>
            {loadingRoles ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando...</span>
              </div>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent className="bg-background border-input">
            {roleTypes.map((roleType) => (
              <SelectItem key={roleType.id} value={roleType.key}>
                <div className="flex items-center space-x-2">
                  {getRoleIcon(roleType.icon, roleType.color)}
                  <span>{roleType.display_name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Aviso de Senha */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className={`text-blue-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <strong>💡</strong> Senha padrão:{' '}
          <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">exa2025</code>
        </p>
      </div>
    </div>
  );

  // Footer buttons
  const footerButtons = (
    <div className={`flex gap-2 ${isMobile ? 'flex-col-reverse' : ''}`}>
      <Button 
        variant="outline" 
        onClick={() => onOpenChange(false)} 
        disabled={creating}
        className={isMobile ? 'w-full h-11' : ''}
      >
        Cancelar
      </Button>
      <Button 
        onClick={handleCreate} 
        disabled={creating || checkingEmail || emailCheckResult?.exists}
        className={`bg-[#9C1E1E] hover:bg-[#7C1818] text-white ${isMobile ? 'w-full h-11' : ''}`}
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
    </div>
  );

  // Mobile: Sheet (bottom-sheet style)
  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[85vh] bg-background rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-lg font-semibold text-foreground">
                Nova Conta Administrativa
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Preencha os dados abaixo
              </SheetDescription>
            </SheetHeader>
            
            <ScrollArea className="h-[calc(85vh-180px)] pr-2">
              {formContent}
            </ScrollArea>
            
            <div className="pt-4 pb-safe">
              {footerButtons}
            </div>
          </SheetContent>
        </Sheet>

        {/* Alert de Email Existente */}
        <ExistingUserAlert
          open={showExistingAlert}
          onOpenChange={setShowExistingAlert}
          email={email}
          role={emailCheckResult?.role}
          nome={emailCheckResult?.nome}
          onDeleted={() => {
            setShowExistingAlert(false);
            clearResult();
          }}
        />
      </>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Criar Nova Conta Administrativa</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Senha padrão: <span className="font-mono font-semibold">exa2025</span>
          </DialogDescription>
        </DialogHeader>

        {formContent}

        <DialogFooter>
          {footerButtons}
        </DialogFooter>
      </DialogContent>

      {/* Alert de Email Existente */}
      <ExistingUserAlert
        open={showExistingAlert}
        onOpenChange={setShowExistingAlert}
        email={email}
        role={emailCheckResult?.role}
        nome={emailCheckResult?.nome}
        onDeleted={() => {
          setShowExistingAlert(false);
          clearResult();
        }}
      />
    </Dialog>
  );
};

export default CreateUserDialog;
