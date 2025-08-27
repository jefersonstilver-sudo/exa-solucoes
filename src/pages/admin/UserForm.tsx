
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  Save,
  User,
  Mail,
  Shield,
  Crown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== 'novo';

  // Mock data para edição
  const [formData, setFormData] = useState({
    email: isEdit ? 'usuario@exemplo.com' : '',
    name: isEdit ? 'Nome do Usuário' : '',
    role: isEdit ? 'client' : 'client',
    password: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validações
    if (!formData.email || !formData.role) {
      toast.error('Email e role são obrigatórios');
      setIsLoading(false);
      return;
    }

    if (!isEdit && (!formData.password || formData.password !== formData.confirmPassword)) {
      toast.error('Senhas são obrigatórias e devem coincidir');
      setIsLoading(false);
      return;
    }

    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
      navigate('/super_admin/usuarios');
    } catch (error) {
      toast.error('Erro ao salvar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    const roleMap: Record<string, any> = {
      super_admin: Crown,
      admin: Shield,
      admin_marketing: Shield,
      client: User,
      painel: User
    };
    return roleMap[role] || User;
  };

  const getRoleLabel = (role: string) => {
    const labelMap: Record<string, string> = {
      super_admin: 'Super Administrador',
      admin: 'Administrador',
      admin_marketing: 'Administrador Marketing',
      client: 'Cliente',
      painel: 'Painel'
    };
    return labelMap[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/super_admin/usuarios')}
          className="text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p className="text-slate-400">
            {isEdit ? 'Altere as informações do usuário' : 'Crie uma nova conta de usuário'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="h-5 w-5 mr-2 text-amber-400" />
                Informações do Usuário
              </CardTitle>
              <CardDescription className="text-slate-400">
                Preencha os dados básicos da conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                        placeholder="usuario@exemplo.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      placeholder="Nome do usuário"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-300">
                    Função *
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="client" className="text-slate-300">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Cliente</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin" className="text-slate-300">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Administrador</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin_marketing" className="text-slate-300">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-purple-400" />
                          <span>Administrador Marketing</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="super_admin" className="text-slate-300">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-4 w-4 text-amber-400" />
                          <span>Super Administrador</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="painel" className="text-slate-300">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Painel</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!isEdit && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300">
                          Senha *
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="bg-slate-700/50 border-slate-600 text-white"
                          placeholder="••••••••"
                          required={!isEdit}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-300">
                          Confirmar Senha *
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="bg-slate-700/50 border-slate-600 text-white"
                          placeholder="••••••••"
                          required={!isEdit}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/super_admin/usuarios')}
                    className="border-slate-600 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                  >
                    {isLoading ? (
                      <>Salvando...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isEdit ? 'Atualizar' : 'Criar'} Usuário
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informações Laterais */}
        <div className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-sm">Permissões por Função</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <div>
                    <p className="text-white font-medium">Super Admin</p>
                    <p className="text-slate-400 text-xs">Acesso total ao sistema</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Administrador</p>
                    <p className="text-slate-400 text-xs">Gerencia prédios, painéis e conteúdo</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Admin Marketing</p>
                    <p className="text-slate-400 text-xs">Homepage, vídeos, portfólio e logos</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Cliente</p>
                    <p className="text-slate-400 text-xs">Cria e gerencia campanhas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isEdit && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">Ações Perigosas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full border-orange-600 text-orange-400 hover:bg-orange-600/10">
                    Resetar Senha
                  </Button>
                  <Button variant="outline" size="sm" className="w-full border-red-600 text-red-400 hover:bg-red-600/10">
                    Suspender Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserForm;
