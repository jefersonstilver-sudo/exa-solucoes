import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';
import { PhoneVerificationOTP } from './PhoneVerificationOTP';
interface Director {
  id: string;
  user_id: string | null;
  nome: string;
  telefone: string;
  departamento: string | null;
  nivel_acesso: 'basico' | 'gerente' | 'admin';
  ativo: boolean;
  pode_usar_ia: boolean;
}
interface SuperAdmin {
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
}
interface AddDirectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  director?: Director | null;
  onClose: () => void;
}
export const AddDirectorDialog = ({
  open,
  onOpenChange,
  director,
  onClose
}: AddDirectorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingSuperAdmins, setLoadingSuperAdmins] = useState(false);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    departamento: '',
    nivel_acesso: 'basico' as 'basico' | 'gerente' | 'admin',
    ativo: true,
    pode_usar_ia: false
  });

  // Carregar super admins disponíveis
  useEffect(() => {
    if (open && !director) {
      loadAvailableSuperAdmins();
    }
  }, [open, director]);

  // Resetar verificação quando telefone mudar
  useEffect(() => {
    setIsPhoneVerified(false);
  }, [formData.telefone]);

  // Preencher dados ao editar
  useEffect(() => {
    if (director) {
      setSelectedUserId(director.user_id || '');
      setIsPhoneVerified(true); // Diretores existentes já estão verificados
      setFormData({
        nome: director.nome,
        telefone: director.telefone,
        departamento: director.departamento || '',
        nivel_acesso: director.nivel_acesso,
        ativo: director.ativo,
        pode_usar_ia: director.pode_usar_ia
      });
    } else {
      setSelectedUserId('');
      setIsPhoneVerified(false);
      setFormData({
        nome: '',
        telefone: '',
        departamento: '',
        nivel_acesso: 'basico',
        ativo: true,
        pode_usar_ia: false
      });
    }
  }, [director, open]);
  const loadAvailableSuperAdmins = async () => {
    try {
      setLoadingSuperAdmins(true);

      // Buscar todos os super_admins
      const {
        data: rolesData,
        error: rolesError
      } = await supabase.from('user_roles').select('user_id').eq('role', 'super_admin');
      if (rolesError) throw rolesError;
      const superAdminIds = rolesData?.map(r => r.user_id) || [];
      if (superAdminIds.length === 0) {
        setSuperAdmins([]);
        return;
      }

      // Buscar dados dos usuários super_admin
      const {
        data: usersData,
        error: usersError
      } = await supabase.from('users').select('id, nome, email, telefone').in('id', superAdminIds);
      if (usersError) throw usersError;

      // Buscar super_admins já cadastrados como diretores
      const {
        data: directorsData,
        error: directorsError
      } = await supabase.from('exa_alerts_directors').select('user_id').not('user_id', 'is', null);
      if (directorsError) throw directorsError;
      const usedUserIds = directorsData?.map(d => d.user_id) || [];

      // Filtrar apenas os que NÃO estão cadastrados
      const available = (usersData || []).filter(user => !usedUserIds.includes(user.id)).map(user => ({
        user_id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone
      }));
      setSuperAdmins(available);
    } catch (error: any) {
      console.error('Error loading super admins:', error);
      toast.error('Erro ao carregar super admins');
    } finally {
      setLoadingSuperAdmins(false);
    }
  };
  const handleSuperAdminSelect = (userId: string) => {
    const selected = superAdmins.find(sa => sa.user_id === userId);
    if (selected) {
      setSelectedUserId(userId);
      setFormData({
        ...formData,
        nome: selected.nome,
        telefone: selected.telefone || ''
      });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (director) {
        // Update
        const {
          error
        } = await supabase.from('exa_alerts_directors').update({
          nome: formData.nome,
          telefone: formData.telefone,
          departamento: formData.departamento || null,
          nivel_acesso: formData.nivel_acesso,
          ativo: formData.ativo,
          pode_usar_ia: formData.pode_usar_ia
        }).eq('id', director.id);
        if (error) throw error;
        toast.success('Diretor atualizado com sucesso!');
      } else {
        // Create - Validar se user_id foi selecionado
        if (!selectedUserId) {
          toast.error('Selecione um super admin');
          setLoading(false);
          return;
        }
        const {
          error
        } = await supabase.from('exa_alerts_directors').insert([{
          user_id: selectedUserId,
          nome: formData.nome,
          telefone: formData.telefone,
          departamento: formData.departamento || null,
          nivel_acesso: formData.nivel_acesso,
          ativo: formData.ativo,
          pode_usar_ia: formData.pode_usar_ia
        }]);
        if (error) throw error;
        toast.success('Diretor adicionado com sucesso!');
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving director:', error);
      toast.error(error.message || 'Erro ao salvar diretor');
    } finally {
      setLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {director ? 'Editar Diretor' : 'Adicionar Diretor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selecionar Super Admin (apenas ao criar) */}
          {!director && <div className="space-y-2">
              <Label htmlFor="superadmin">Selecionar Super Admin *</Label>
              <Select value={selectedUserId} onValueChange={handleSuperAdminSelect} disabled={loadingSuperAdmins}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingSuperAdmins ? "Carregando..." : "Selecione um super admin"} />
                </SelectTrigger>
                <SelectContent>
                  {superAdmins.length === 0 ? <div className="p-4 text-center text-sm text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      Todos os super admins já estão cadastrados
                    </div> : superAdmins.map(admin => <SelectItem key={admin.user_id} value={admin.user_id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{admin.nome}</span>
                          <span className="text-xs text-gray-500">{admin.email}</span>
                        </div>
                      </SelectItem>)}
                </SelectContent>
              </Select>
            </div>}

          {/* Nome (preenchido automaticamente) */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome {director ? '*' : '(preenchido automaticamente)'}</Label>
            <Input id="nome" value={formData.nome} onChange={e => setFormData({
            ...formData,
            nome: e.target.value
          })} placeholder="Será preenchido ao selecionar super admin" required readOnly={!director} className={!director ? 'bg-gray-50' : ''} />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone WhatsApp *</Label>
            <Input id="telefone" value={formData.telefone} onChange={e => setFormData({
            ...formData,
            telefone: e.target.value
          })} placeholder="11987654321" required />
            {!director && <p className="text-xs text-gray-500">
                ℹ️ Edite se necessário para formato WhatsApp
              </p>}
          </div>

          {/* Verificação OTP (apenas para novos diretores) */}
          {!director && formData.telefone && <>
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Verificação de Segurança</Label>
                  {isPhoneVerified && <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Verificado
                    </span>}
                </div>
                
                {!isPhoneVerified}
                
                <PhoneVerificationOTP telefone={formData.telefone} onVerified={() => setIsPhoneVerified(true)} />
              </div>
              
              <Separator className="my-4" />
            </>}

          {/* Departamento */}
          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento</Label>
            <Input id="departamento" value={formData.departamento} onChange={e => setFormData({
            ...formData,
            departamento: e.target.value
          })} placeholder="Operações" />
          </div>

          {/* Nível de Acesso */}
          <div className="space-y-2">
            <Label htmlFor="nivel">Nível de Acesso *</Label>
            <Select value={formData.nivel_acesso} onValueChange={(value: 'basico' | 'gerente' | 'admin') => setFormData({
            ...formData,
            nivel_acesso: value
          })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basico">Básico</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Switches */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Diretor Ativo</Label>
              <Switch id="ativo" checked={formData.ativo} onCheckedChange={checked => setFormData({
              ...formData,
              ativo: checked
            })} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ia">Modo Gerente (IA)</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Permite responder perguntas ao agente
                </p>
              </div>
              <Switch id="ia" checked={formData.pode_usar_ia} onCheckedChange={checked => setFormData({
              ...formData,
              pode_usar_ia: checked
            })} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !director && !isPhoneVerified} className="bg-gradient-to-r from-[#9C1E1E] to-[#D72638] hover:from-[#7A1717] hover:to-[#B01F2E]">
              {loading ? 'Salvando...' : director ? 'Salvar Alterações' : 'Adicionar Diretor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
};