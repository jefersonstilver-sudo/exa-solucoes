
import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Monitor, Settings, Network, Eye, EyeOff } from 'lucide-react';

interface PanelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel?: any;
  onSuccess: () => void;
}

const PanelFormDialog: React.FC<PanelFormDialogProps> = ({
  open,
  onOpenChange,
  panel,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    code: '',
    building_id: '',
    status: 'offline',
    resolucao: '1080x1920',
    polegada: '22',
    orientacao: 'vertical',
    sistema_operacional: 'linux',
    codigo_anydesk: '',
    senha_anydesk: '',
    modelo: '',
    versao_firmware: '',
    ip_interno: '',
    mac_address: '',
    observacoes: '',
    localizacao: ''
  });

  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBuildings();
      if (panel) {
        setFormData({
          code: panel.code || '',
          building_id: panel.building_id || '',
          status: panel.status || 'offline',
          resolucao: panel.resolucao || '1080x1920',
          polegada: panel.polegada || '22',
          orientacao: panel.orientacao || 'vertical',
          sistema_operacional: panel.sistema_operacional || 'linux',
          codigo_anydesk: panel.codigo_anydesk || '',
          senha_anydesk: panel.senha_anydesk || '',
          modelo: panel.modelo || '',
          versao_firmware: panel.versao_firmware || '',
          ip_interno: panel.ip_interno || '',
          mac_address: panel.mac_address || '',
          observacoes: panel.observacoes || '',
          localizacao: panel.localizacao || ''
        });
      } else {
        setFormData({
          code: '',
          building_id: '',
          status: 'offline',
          resolucao: '1080x1920',
          polegada: '22',
          orientacao: 'vertical',
          sistema_operacional: 'linux',
          codigo_anydesk: '',
          senha_anydesk: '',
          modelo: '',
          versao_firmware: '',
          ip_interno: '',
          mac_address: '',
          observacoes: '',
          localizacao: ''
        });
      }
    }
  }, [panel, open]);

  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, endereco, bairro')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      setBuildings(data || []);
    } catch (error) {
      console.error('Erro ao buscar prédios:', error);
      toast.error('Erro ao carregar lista de prédios');
    }
  };

  const handleFormUpdate = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.code.trim()) {
        toast.error('Código do painel é obrigatório');
        return;
      }

      if (!formData.building_id) {
        toast.error('Selecione um prédio');
        return;
      }

      const dataToSave = {
        ...formData,
        codigo_anydesk: formData.codigo_anydesk || null,
        senha_anydesk: formData.senha_anydesk || null,
      };

      if (panel) {
        const { error } = await supabase
          .from('painels')
          .update(dataToSave)
          .eq('id', panel.id);

        if (error) throw error;
        toast.success('Painel atualizado com sucesso!');
      } else {
        // Verificar se o código já existe
        const { data: existingPanel } = await supabase
          .from('painels')
          .select('id')
          .eq('code', formData.code)
          .single();

        if (existingPanel) {
          toast.error('Já existe um painel com este código');
          return;
        }

        const { error } = await supabase
          .from('painels')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success('Painel criado com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar painel:', error);
      toast.error(error.message || 'Erro ao salvar painel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <Monitor className="h-6 w-6 mr-2" />
            {panel ? 'Editar Painel' : 'Novo Painel'}
          </DialogTitle>
          <DialogDescription>
            {panel ? 'Edite as configurações do painel' : 'Configure um novo painel digital (Padrão: 22", 1080x1920, Vertical, Linux)'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="technical">Técnico</TabsTrigger>
              <TabsTrigger value="network">Rede</TabsTrigger>
              <TabsTrigger value="remote">Acesso Remoto</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Configure as informações principais do painel</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código do Painel *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleFormUpdate('code', e.target.value)}
                      placeholder="Ex: PANEL001"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="building_id">Prédio *</Label>
                    <Select value={formData.building_id} onValueChange={(value) => handleFormUpdate('building_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um prédio" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.nome} - {building.bairro}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleFormUpdate('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localizacao">Localização</Label>
                    <Input
                      id="localizacao"
                      value={formData.localizacao}
                      onChange={(e) => handleFormUpdate('localizacao', e.target.value)}
                      placeholder="Ex: Térreo - Hall Principal"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => handleFormUpdate('observacoes', e.target.value)}
                      placeholder="Observações gerais sobre o painel"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Especificações Técnicas</CardTitle>
                  <CardDescription>Especificações padrão: 22", 1080x1920 (Vertical), Linux</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input
                      id="modelo"
                      value={formData.modelo}
                      onChange={(e) => handleFormUpdate('modelo', e.target.value)}
                      placeholder="Ex: QM55R-T, 55UH5F-H"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="polegada">Tamanho (polegadas)</Label>
                    <Input
                      id="polegada"
                      value={formData.polegada}
                      onChange={(e) => handleFormUpdate('polegada', e.target.value)}
                      placeholder="Padrão: 22"
                      disabled={!panel}
                      className={!panel ? "bg-gray-100" : ""}
                    />
                    {!panel && (
                      <p className="text-xs text-gray-500">Padrão fixo: 22 polegadas</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orientacao">Orientação</Label>
                    <Select 
                      value={formData.orientacao} 
                      onValueChange={(value) => handleFormUpdate('orientacao', value)}
                      disabled={!panel}
                    >
                      <SelectTrigger className={!panel ? "bg-gray-100" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal (Paisagem)</SelectItem>
                        <SelectItem value="vertical">Vertical (Retrato)</SelectItem>
                      </SelectContent>
                    </Select>
                    {!panel && (
                      <p className="text-xs text-gray-500">Padrão fixo: Vertical</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resolucao">Resolução</Label>
                    <Select 
                      value={formData.resolucao} 
                      onValueChange={(value) => handleFormUpdate('resolucao', value)}
                      disabled={!panel}
                    >
                      <SelectTrigger className={!panel ? "bg-gray-100" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1920x1080">Full HD (1920x1080)</SelectItem>
                        <SelectItem value="3840x2160">4K UHD (3840x2160)</SelectItem>
                        <SelectItem value="1366x768">HD (1366x768)</SelectItem>
                        <SelectItem value="1080x1920">Full HD Vertical (1080x1920)</SelectItem>
                        <SelectItem value="2160x3840">4K UHD Vertical (2160x3840)</SelectItem>
                      </SelectContent>
                    </Select>
                    {!panel && (
                      <p className="text-xs text-gray-500">Padrão fixo: 1080x1920 (Vertical)</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sistema_operacional">Sistema Operacional</Label>
                    <Select 
                      value={formData.sistema_operacional} 
                      onValueChange={(value) => handleFormUpdate('sistema_operacional', value)}
                      disabled={!panel}
                    >
                      <SelectTrigger className={!panel ? "bg-gray-100" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="windows">Windows</SelectItem>
                        <SelectItem value="linux">Linux</SelectItem>
                        <SelectItem value="android">Android</SelectItem>
                      </SelectContent>
                    </Select>
                    {!panel && (
                      <p className="text-xs text-gray-500">Padrão fixo: Linux</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="versao_firmware">Versão do Firmware</Label>
                    <Input
                      id="versao_firmware"
                      value={formData.versao_firmware}
                      onChange={(e) => handleFormUpdate('versao_firmware', e.target.value)}
                      placeholder="Ex: 1.2.3, v2.0.1"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Rede</CardTitle>
                  <CardDescription>Configure as informações de rede do painel</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ip_interno">IP Interno</Label>
                    <Input
                      id="ip_interno"
                      value={formData.ip_interno}
                      onChange={(e) => handleFormUpdate('ip_interno', e.target.value)}
                      placeholder="Ex: 192.168.1.100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mac_address">Endereço MAC</Label>
                    <Input
                      id="mac_address"
                      value={formData.mac_address}
                      onChange={(e) => handleFormUpdate('mac_address', e.target.value)}
                      placeholder="Ex: 00:1B:44:11:3A:B7"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="remote" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Acesso Remoto</CardTitle>
                  <CardDescription>Configure as credenciais de acesso remoto via AnyDesk</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo_anydesk">Código AnyDesk</Label>
                    <Input
                      id="codigo_anydesk"
                      value={formData.codigo_anydesk}
                      onChange={(e) => handleFormUpdate('codigo_anydesk', e.target.value)}
                      placeholder="Ex: 123 456 789"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha_anydesk">Senha AnyDesk</Label>
                    <div className="relative">
                      <Input
                        id="senha_anydesk"
                        type={showPassword ? "text" : "password"}
                        value={formData.senha_anydesk}
                        onChange={(e) => handleFormUpdate('senha_anydesk', e.target.value)}
                        placeholder="Senha de acesso"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-indexa-purple hover:bg-indexa-purple-dark">
              {loading ? 'Salvando...' : (panel ? 'Atualizar Painel' : 'Criar Painel')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PanelFormDialog;
