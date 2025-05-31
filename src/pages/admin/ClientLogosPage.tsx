import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientLogo {
  id: string;
  name: string;
  logo_url: string;
  link?: string;
  is_active: boolean;
  order_position: number;
  created_at: string;
  updated_at: string;
}

const ClientLogosPage = () => {
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLogo, setEditingLogo] = useState<ClientLogo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    link: '',
    is_active: true,
    order_position: 0
  });

  const fetchLogos = async () => {
    try {
      const { data, error } = await supabase
        .from('client_logos')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) {
        console.error('Erro ao carregar logos:', error);
        toast.error('Erro ao carregar logos');
        return;
      }

      setLogos(data || []);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar logos');
    } finally {
      setIsLoading(false);
    }
  };

  const addSampleLogos = async () => {
    const sampleLogos = [
      {
        name: 'Microsoft',
        logo_url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=100&fit=crop&auto=format',
        link: 'https://microsoft.com',
        is_active: true,
        order_position: 1
      },
      {
        name: 'Google',
        logo_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=100&fit=crop&auto=format',
        link: 'https://google.com',
        is_active: true,
        order_position: 2
      },
      {
        name: 'Apple',
        logo_url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=200&h=100&fit=crop&auto=format',
        link: 'https://apple.com',
        is_active: true,
        order_position: 3
      },
      {
        name: 'Amazon',
        logo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=100&fit=crop&auto=format',
        link: 'https://amazon.com',
        is_active: true,
        order_position: 4
      },
      {
        name: 'Netflix',
        logo_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&h=100&fit=crop&auto=format',
        link: 'https://netflix.com',
        is_active: true,
        order_position: 5
      }
    ];

    try {
      const { error } = await supabase
        .from('client_logos')
        .insert(sampleLogos);

      if (error) throw error;
      toast.success('Logos de exemplo adicionados!');
      fetchLogos();
    } catch (error) {
      console.error('Erro ao adicionar logos de exemplo:', error);
      toast.error('Erro ao adicionar logos de exemplo');
    }
  };

  const handleSave = async () => {
    try {
      // Validar URL se fornecida
      if (formData.link && formData.link.trim()) {
        try {
          new URL(formData.link);
        } catch {
          toast.error('Por favor, insira uma URL válida para o link');
          return;
        }
      }

      const dataToSave = {
        ...formData,
        link: formData.link.trim() || null
      };

      if (editingLogo) {
        // Atualizar logo existente
        const { error } = await supabase
          .from('client_logos')
          .update(dataToSave)
          .eq('id', editingLogo.id);

        if (error) throw error;
        toast.success('Logo atualizado com sucesso!');
      } else {
        // Criar novo logo
        const { error } = await supabase
          .from('client_logos')
          .insert(dataToSave);

        if (error) throw error;
        toast.success('Logo adicionado com sucesso!');
      }

      setDialogOpen(false);
      setEditingLogo(null);
      setFormData({ name: '', logo_url: '', link: '', is_active: true, order_position: 0 });
      fetchLogos();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar logo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este logo?')) return;

    try {
      const { error } = await supabase
        .from('client_logos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Logo excluído com sucesso!');
      fetchLogos();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir logo');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('client_logos')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Logo ${isActive ? 'ativado' : 'desativado'} com sucesso!`);
      fetchLogos();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao alterar status do logo');
    }
  };

  const openDialog = (logo?: ClientLogo) => {
    if (logo) {
      setEditingLogo(logo);
      setFormData({
        name: logo.name,
        logo_url: logo.logo_url,
        link: logo.link || '',
        is_active: logo.is_active,
        order_position: logo.order_position
      });
    } else {
      setEditingLogo(null);
      const nextPosition = logos.length > 0 ? Math.max(...logos.map(l => l.order_position)) + 1 : 1;
      setFormData({ 
        name: '', 
        logo_url: '', 
        link: '',
        is_active: true, 
        order_position: nextPosition 
      });
    }
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando logos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logos dos Clientes</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os logos que aparecem no carrossel da página de marketing e no rodapé
          </p>
        </div>
        <div className="flex gap-2">
          {logos.length === 0 && (
            <Button onClick={addSampleLogos} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Exemplos
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} className="bg-indexa-purple hover:bg-indexa-purple/90">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Logo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLogo ? 'Editar Logo' : 'Adicionar Novo Logo'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Cliente/Parceiro</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: TechCorp Solutions"
                  />
                </div>
                <div>
                  <Label htmlFor="logo_url">URL do Logo (PNG branco, fundo transparente)</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div>
                  <Label htmlFor="link">Link (Site/Instagram/etc.) - Opcional</Label>
                  <Input
                    id="link"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://exemplo.com ou https://instagram.com/perfil"
                  />
                </div>
                <div>
                  <Label htmlFor="order">Posição na Ordem</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order_position}
                    onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active">Logo ativo</Label>
                </div>
                {formData.logo_url && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <Label>Preview:</Label>
                    <div className="mt-2 flex items-center justify-center h-20 bg-gray-800 rounded">
                      <img
                        src={formData.logo_url}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain filter brightness-0 invert"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={!formData.name || !formData.logo_url}>
                  {editingLogo ? 'Atualizar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Logos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Logos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {logos.filter(l => l.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Com Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {logos.filter(l => l.link).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logos Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Logos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {logos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum logo cadastrado
              </h3>
              <p className="text-gray-600 mb-4">
                Adicione logos dos seus clientes e parceiros para exibir no carrossel
              </p>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Logo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {logos.map((logo) => (
                <Card key={logo.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={logo.is_active ? "default" : "secondary"}>
                        {logo.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <span className="text-sm text-gray-500">#{logo.order_position}</span>
                    </div>
                    
                    <div className="mb-3 h-16 bg-gray-800 rounded flex items-center justify-center">
                      <img
                        src={logo.logo_url}
                        alt={logo.name}
                        className="max-h-full max-w-full object-contain filter brightness-0 invert"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-2">{logo.name}</h4>
                    
                    {logo.link && (
                      <div className="mb-3">
                        <a 
                          href={logo.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visitar Link
                        </a>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(logo.id, !logo.is_active)}
                      >
                        {logo.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(logo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(logo.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientLogosPage;
