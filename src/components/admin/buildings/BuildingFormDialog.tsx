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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Calculator, Users, Eye, Monitor, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BuildingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
  onSuccess: () => void;
}

const CARACTERISTICAS_OPTIONS = [
  'Piscina',
  'Academia',
  'Churrasqueira',
  'Playground',
  'Salão de festas',
  'Quadra poliesportiva',
  'Espaço gourmet',
  'Brinquedoteca',
  'Sala de jogos',
  'Espaço pet',
  'Coworking',
  'Cinema',
  'Spa / Sauna',
  'Área verde / jardim',
  'Deck com espreguiçadeiras'
];

const BuildingFormDialog: React.FC<BuildingFormDialogProps> = ({
  open,
  onOpenChange,
  building,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    bairro: '',
    numero_unidades: 0,
    preco_base: 0,
    padrao_publico: 'normal' as 'alto' | 'medio' | 'normal',
    status: 'ativo',
    venue_type: '',
    location_type: 'residential',
    latitude: 0,
    longitude: 0,
    caracteristicas: [] as string[],
    monthly_traffic: 0
  });
  const [loading, setLoading] = useState(false);

  // Cálculos automáticos
  const publicoEstimado = formData.numero_unidades * 3;
  const visualizacoesMes = 0 * 7350; // Será calculado automaticamente pelo trigger

  useEffect(() => {
    if (building) {
      setFormData({
        nome: building.nome || '',
        endereco: building.endereco || '',
        bairro: building.bairro || '',
        numero_unidades: building.numero_unidades || 0,
        preco_base: building.preco_base || 0,
        padrao_publico: building.padrao_publico || 'normal',
        status: building.status || 'ativo',
        venue_type: building.venue_type || '',
        location_type: building.location_type || 'residential',
        latitude: building.latitude || 0,
        longitude: building.longitude || 0,
        caracteristicas: building.caracteristicas || building.amenities || [],
        monthly_traffic: building.monthly_traffic || 0
      });
    } else {
      setFormData({
        nome: '',
        endereco: '',
        bairro: '',
        numero_unidades: 0,
        preco_base: 0,
        padrao_publico: 'normal',
        status: 'ativo',
        venue_type: '',
        location_type: 'residential',
        latitude: 0,
        longitude: 0,
        caracteristicas: [],
        monthly_traffic: 0
      });
    }
  }, [building, open]);

  const handleAddCaracteristica = (caracteristica: string) => {
    if (!formData.caracteristicas.includes(caracteristica)) {
      setFormData(prev => ({
        ...prev,
        caracteristicas: [...prev.caracteristicas, caracteristica]
      }));
    }
  };

  const handleRemoveCaracteristica = (caracteristica: string) => {
    setFormData(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas.filter(a => a !== caracteristica)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar dados para salvar (também salvar em amenities para compatibilidade)
      const dataToSave = {
        ...formData,
        amenities: formData.caracteristicas, // Manter compatibilidade
        // O publico_estimado e visualizacoes_mes são calculados automaticamente pelo banco
      };

      if (building) {
        // Atualizar prédio existente
        const { error } = await supabase
          .from('buildings')
          .update(dataToSave)
          .eq('id', building.id);

        if (error) throw error;

        // Log da ação
        await supabase.rpc('log_building_action', {
          p_building_id: building.id,
          p_action_type: 'update',
          p_description: `Prédio "${formData.nome}" atualizado com estrutura completa`,
          p_new_values: dataToSave
        });

        toast.success('Prédio atualizado com sucesso!');
      } else {
        // Criar novo prédio
        const { data, error } = await supabase
          .from('buildings')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;

        // Log da ação
        await supabase.rpc('log_building_action', {
          p_building_id: data.id,
          p_action_type: 'create',
          p_description: `Novo prédio "${formData.nome}" criado com estrutura completa`,
          p_new_values: dataToSave
        });

        toast.success('Prédio criado com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar prédio:', error);
      toast.error(error.message || 'Erro ao salvar prédio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {building ? 'Editar Prédio' : 'Novo Prédio'}
          </DialogTitle>
          <DialogDescription>
            {building ? 'Edite as informações completas do prédio' : 'Cadastre um novo prédio com todos os detalhes'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna 1: Dados Básicos */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Dados Básicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Prédio *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      required
                      placeholder="Ex: Residencial Solar do Jardim"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço Completo *</Label>
                    <Textarea
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                      required
                      placeholder="Rua, número, complemento..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro *</Label>
                      <Input
                        id="bairro"
                        value={formData.bairro}
                        onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="venue_type">Tipo de Venue</Label>
                      <Input
                        id="venue_type"
                        value={formData.venue_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, venue_type: e.target.value }))}
                        placeholder="Ex: Condomínio"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Dados Comerciais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numero_unidades">Número de Unidades *</Label>
                      <Input
                        id="numero_unidades"
                        type="number"
                        value={formData.numero_unidades}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_unidades: parseInt(e.target.value) || 0 }))}
                        required
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preco_base">Preço Base (R$) *</Label>
                      <Input
                        id="preco_base"
                        type="number"
                        step="0.01"
                        value={formData.preco_base}
                        onChange={(e) => setFormData(prev => ({ ...prev, preco_base: parseFloat(e.target.value) || 0 }))}
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="padrao_publico">Padrão do Público</Label>
                      <Select
                        value={formData.padrao_publico}
                        onValueChange={(value: 'alto' | 'medio' | 'normal') => 
                          setFormData(prev => ({ ...prev, padrao_publico: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alto">Alto</SelectItem>
                          <SelectItem value="medio">Médio</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_traffic">Tráfego Mensal</Label>
                    <Input
                      id="monthly_traffic"
                      type="number"
                      value={formData.monthly_traffic}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthly_traffic: parseInt(e.target.value) || 0 }))}
                      min="0"
                      placeholder="Visitantes por mês"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna 2: Características e Métricas */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Características de Lazer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {CARACTERISTICAS_OPTIONS.map((caracteristica) => (
                      <Button
                        key={caracteristica}
                        type="button"
                        variant={formData.caracteristicas.includes(caracteristica) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (formData.caracteristicas.includes(caracteristica)) {
                            handleRemoveCaracteristica(caracteristica);
                          } else {
                            handleAddCaracteristica(caracteristica);
                          }
                        }}
                        className="justify-start text-xs h-8"
                      >
                        {caracteristica}
                      </Button>
                    ))}
                  </div>
                  
                  {formData.caracteristicas.length > 0 && (
                    <div className="space-y-2">
                      <Label>Características Selecionadas:</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.caracteristicas.map((caracteristica) => (
                          <Badge key={caracteristica} variant="secondary" className="flex items-center gap-1">
                            {caracteristica}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => handleRemoveCaracteristica(caracteristica)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Métricas Automáticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-600">{publicoEstimado}</div>
                      <div className="text-xs text-blue-600">Público Estimado</div>
                      <div className="text-xs text-gray-500 mt-1">Unidades × 3</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Eye className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold text-purple-600">Auto</div>
                      <div className="text-xs text-purple-600">Visualizações/Mês</div>
                      <div className="text-xs text-gray-500 mt-1">Painéis × 7.350</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <Monitor className="h-4 w-4 inline mr-1" />
                      Quantidade de painéis será calculada automaticamente quando painéis forem atribuídos
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-indexa-purple hover:bg-indexa-purple-dark">
              {loading ? 'Salvando...' : (building ? 'Atualizar Prédio' : 'Criar Prédio')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BuildingFormDialog;
