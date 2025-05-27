
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User } from 'lucide-react';

const EditarPerfil = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    documento: '',
    telefone: ''
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (user) {
      setFormData({
        nome: user.nome || user.name || '',
        email: user.email || '',
        documento: user.documento || '',
        telefone: user.telefone || ''
      });
    }
  }, [user, isLoggedIn, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Atualizar auth.users metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: formData.nome,
          nome: formData.nome,
          document: formData.documento,
          documento: formData.documento,
          phone: formData.telefone,
          telefone: formData.telefone
        }
      });

      if (authError) throw authError;

      // Atualizar tabela users se existir
      const { error: userError } = await supabase
        .from('users')
        .update({
          nome: formData.nome,
          documento: formData.documento,
          telefone: formData.telefone
        })
        .eq('id', user.id);

      if (userError) {
        console.warn('Erro ao atualizar tabela users:', userError);
      }

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Editar Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100"
                  placeholder="Seu email"
                />
                <p className="text-xs text-gray-500 mt-1">
                  O email não pode ser alterado
                </p>
              </div>

              <div>
                <Label htmlFor="documento">CPF/CNPJ</Label>
                <Input
                  id="documento"
                  name="documento"
                  value={formData.documento}
                  onChange={handleInputChange}
                  placeholder="Seu CPF ou CNPJ"
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="Seu telefone"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default EditarPerfil;
