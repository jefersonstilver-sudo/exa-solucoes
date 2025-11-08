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
import { Crown, Shield, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [role, setRole] = useState('admin');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    try {
      setCreating(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: 'indexa2025',
        options: {
          data: {
            role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        await supabase.from('users').upsert({
          id: authData.user.id,
          email,
          role,
          data_criacao: new Date().toISOString(),
        });
      }

      const roleLabels = {
        admin: 'Administrador Geral',
        admin_marketing: 'Administrador Marketing',
        super_admin: 'Super Administrador',
      };

      toast.success(`Conta criada com sucesso!`, {
        description: `Email: ${email} | Senha: indexa2025`,
      });

      const credentials = `Email: ${email}\nSenha: indexa2025\nTipo: ${
        roleLabels[role as keyof typeof roleLabels]
      }`;
      navigator.clipboard.writeText(credentials);
      toast.info('Credenciais copiadas');

      setEmail('');
      setRole('admin');
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
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">Criar Nova Conta</DialogTitle>
          <DialogDescription className="text-gray-600">
            Senha padrão: indexa2025
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-black">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@exemplo.com"
              className="bg-white border-gray-300 text-black"
            />
          </div>
          <div>
            <Label htmlFor="role" className="text-black">
              Tipo
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
                <SelectItem value="super_admin">
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span>Super Administrador</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
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
    </Dialog>
  );
};

export default CreateUserDialog;
