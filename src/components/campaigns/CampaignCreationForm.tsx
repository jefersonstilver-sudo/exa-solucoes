import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Monitor, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Panel {
  id: string;
  code: string;
  building_id: string;
  status: string;
}

interface PaidOrder {
  id: string;
  lista_paineis: string[];
  data_inicio: string;
  data_fim: string;
}

interface CampaignCreationFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const CampaignCreationForm: React.FC<CampaignCreationFormProps> = ({ onCancel, onSuccess }) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>([]);
  const [availablePanels, setAvailablePanels] = useState<Panel[]>([]);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    pedido_id: '',
    painel_id: '',
    data_inicio: '',
    data_fim: '',
  });

  useEffect(() => {
    loadPaidOrders();
  }, [userProfile]);

  const loadPaidOrders = async () => {
    if (!userProfile?.id) return;

    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, lista_paineis, data_inicio, data_fim')
        .eq('client_id', userProfile.id)
        .in('status', ['pago', 'pago_pendente_video', 'video_aprovado']);

      if (error) throw error;
      setPaidOrders(pedidos || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    }
  };

  const loadPanelsForOrder = async (orderId: string) => {
    const order = paidOrders.find(o => o.id === orderId);
    if (!order?.lista_paineis) return;

    try {
      const { data: panels, error } = await supabase
        .from('painels')
        .select('id, code, building_id, status')
        .in('id', order.lista_paineis);

      if (error) throw error;
      setAvailablePanels(panels || []);
      
      // Auto-fill dates from the order
      setFormData(prev => ({
        ...prev,
        data_inicio: order.data_inicio,
        data_fim: order.data_fim
      }));
    } catch (error) {
      console.error('Erro ao carregar painéis:', error);
      toast.error('Erro ao carregar painéis');
    }
  };

  const handleOrderChange = (orderId: string) => {
    setFormData(prev => ({ ...prev, pedido_id: orderId, painel_id: '' }));
    loadPanelsForOrder(orderId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pedido_id || !formData.painel_id) {
      toast.error('Selecione um pedido e painel');
      return;
    }

    setLoading(true);

    try {
      const campaignData = {
        client_id: userProfile?.id,
        painel_id: formData.painel_id,
        video_id: 'default_video_id', // Placeholder until video upload is implemented
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        status: 'ativa',
        obs: formData.descricao || null
      };

      const { error } = await supabase
        .from('campanhas')
        .insert(campaignData);

      if (error) throw error;

      toast.success('Campanha criada com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar campanha:', error);
      toast.error('Erro ao criar campanha: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Nova Campanha
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pedido">Pedido Pago</Label>
            <Select value={formData.pedido_id} onValueChange={handleOrderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um pedido pago" />
              </SelectTrigger>
              <SelectContent>
                {paidOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    Pedido {order.id.substring(0, 8)}... - {order.lista_paineis?.length || 0} painéis
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availablePanels.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="painel">Painel</Label>
              <Select value={formData.painel_id} onValueChange={(value) => setFormData(prev => ({ ...prev, painel_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um painel" />
                </SelectTrigger>
                <SelectContent>
                  {availablePanels.map((panel) => (
                    <SelectItem key={panel.id} value={panel.id}>
                      {panel.code} - Status: {panel.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData(prev => ({ ...prev, data_fim: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Observações (opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Adicione observações sobre a campanha..."
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.pedido_id || !formData.painel_id}
              className="flex-1"
            >
              {loading ? (
                <>Criando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Campanha
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CampaignCreationForm;