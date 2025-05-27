
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Mail, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';

const EditarPerfil = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useUserSession();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form state with proper initialization
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    documento: '',
    telefone: ''
  });

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || user.name || '',
        email: user.email || '',
        documento: user.documento || '',
        telefone: user.telefone || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return;
    }

    setIsUpdating(true);
    try {
      // Update user metadata - only update fields that exist in the type
      const { error } = await supabase.auth.updateUser({
        data: {
          name: formData.nome, // Use 'name' instead of 'nome' for metadata
          documento: formData.documento,
          telefone: formData.telefone
        }
      });

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      navigate('/configuracoes');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-8 w-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/configuracoes')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Editar Perfil</h1>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Digite seu nome completo"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100"
                  placeholder="Email não pode ser alterado"
                />
                <p className="text-xs text-gray-500">
                  O email não pode ser alterado por questões de segurança
                </p>
              </div>

              {/* Documento */}
              <div className="space-y-2">
                <Label htmlFor="documento" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  CPF/CNPJ
                </Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) => handleInputChange('documento', e.target.value)}
                  placeholder="Digite seu CPF ou CNPJ"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="Digite seu telefone"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default EditarPerfil;
