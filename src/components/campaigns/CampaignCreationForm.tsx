import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdvancedCampaignCreation, VideoSchedule } from '@/hooks/campaigns/useAdvancedCampaignCreation';
import { VideoSchedulingSection } from './VideoSchedulingSection';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Building, Video, Monitor, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Panel {
  id: string;
  code: string;
  status: string;
  buildings: {
    id: string;
    nome: string;
    endereco: string;
    bairro: string;
  };
}

interface VideoItem {
  id: string;
  video_id: string;
  videos: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
  };
}

interface PaidOrder {
  id: string;
  lista_paineis: string[];
  data_inicio: string;
  data_fim: string;
  valor_total: number;
}

interface CampaignCreationFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const CampaignCreationForm: React.FC<CampaignCreationFormProps> = ({
  onCancel,
  onSuccess
}) => {
  const { 
    createAdvancedCampaign, 
    getApprovedVideos, 
    getPedidoPanels, 
    loading 
  } = useAdvancedCampaignCreation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    orderId: '',
    panelId: '',
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '22:00'
  });
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>([]);
  const [availablePanels, setAvailablePanels] = useState<Panel[]>([]);
  const [approvedVideos, setApprovedVideos] = useState<VideoItem[]>([]);
  const [videoSchedules, setVideoSchedules] = useState<VideoSchedule[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  useEffect(() => {
    loadPaidOrders();
  }, []);

  const loadPaidOrders = async () => {
    try {
      const { hasOrders, orders } = await checkPaidOrders();
      if (hasOrders) {
        setPaidOrders(orders);
      }
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos pagos');
    }
  };

  const checkPaidOrders = async () => {
    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, lista_paineis, data_inicio, data_fim, valor_total')
        .in('status', ['pago', 'pago_pendente_video', 'video_aprovado']);

      if (error) throw error;

      return {
        hasOrders: pedidos && pedidos.length > 0,
        orders: pedidos || []
      };
    } catch (error: any) {
      console.error('Erro ao verificar pedidos:', error);
      toast.error('Erro ao verificar pedidos');
      return { hasOrders: false, orders: [] };
    }
  };

  const loadOrderData = async (orderId: string) => {
    if (!orderId) return;

    try {
      // Carregar painéis e vídeos em paralelo
      const [panels, videos] = await Promise.all([
        getPedidoPanels(orderId),
        getApprovedVideos(orderId)
      ]);

      setAvailablePanels(panels);
      setApprovedVideos(videos);

      // Resetar agendamentos quando trocar de pedido
      setVideoSchedules([]);
    } catch (error: any) {
      console.error('Erro ao carregar dados do pedido:', error);
      toast.error('Erro ao carregar dados do pedido');
    }
  };

  const handleOrderChange = (orderId: string) => {
    setFormData(prev => ({ ...prev, orderId, panelId: '' }));
    loadOrderData(orderId);
    
    // Auto-preencher datas baseadas no pedido
    const selectedOrder = paidOrders.find(order => order.id === orderId);
    if (selectedOrder) {
      const start = new Date(selectedOrder.data_inicio);
      const end = new Date(selectedOrder.data_fim);
      setStartDate(start);
      setEndDate(end);
      setFormData(prev => ({
        ...prev,
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
      }));
    }
  };

  const isFormValid = () => {
    const hasName = formData.name.trim() !== '';
    const hasOrder = formData.orderId.trim() !== '';
    const hasPanel = formData.panelId.trim() !== '';
    const hasStartDate = formData.startDate.trim() !== '';
    const hasEndDate = formData.endDate.trim() !== '';
    const hasStartTime = formData.startTime.trim() !== '';
    const hasEndTime = formData.endTime.trim() !== '';
    const hasVideos = approvedVideos.length > 0;
    
    return hasName && hasOrder && hasPanel && hasStartDate && hasEndDate && hasStartTime && hasEndTime && hasVideos;
  };

  const getValidationMessage = () => {
    if (!formData.name.trim()) return "Nome da campanha é obrigatório";
    if (!formData.orderId.trim()) return "Selecione um pedido pago";
    if (!formData.panelId.trim()) return "Selecione um painel";
    if (!formData.startDate.trim()) return "Selecione a data de início";
    if (!formData.endDate.trim()) return "Selecione a data de fim";
    if (!formData.startTime.trim()) return "Defina o horário de início";
    if (!formData.endTime.trim()) return "Defina o horário de fim";
    if (approvedVideos.length === 0) return "Não há vídeos aprovados disponíveis";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.orderId || !formData.panelId || !formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar horários
    if (formData.startTime >= formData.endTime) {
      toast.error('O horário de início deve ser anterior ao horário de fim');
      return;
    }

    if (videoSchedules.length === 0) {
      toast.error('Adicione pelo menos um vídeo à campanha');
      return;
    }

    const result = await createAdvancedCampaign({
      name: formData.name,
      description: formData.description,
      pedidoId: formData.orderId,
      panelId: formData.panelId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      videoSchedules
    });

    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Nova Campanha Avançada
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome da Campanha */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Campanha Black Friday 2024"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva os objetivos e detalhes da campanha..."
              rows={3}
            />
          </div>

          {/* Seleção do Pedido */}
          <div className="space-y-2">
            <Label htmlFor="order">Pedido Pago *</Label>
            <Select value={formData.orderId} onValueChange={handleOrderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um pedido pago..." />
              </SelectTrigger>
              <SelectContent>
                {paidOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    Pedido {order.id.slice(0, 8)}... - R$ {order.valor_total} - {order.lista_paineis?.length || 0} painéis
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção do Painel com informações do prédio */}
          {availablePanels.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="panel">Painel e Localização *</Label>
              <Select 
                value={formData.panelId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, panelId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um painel..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePanels.map((panel) => (
                    <SelectItem key={panel.id} value={panel.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{panel.buildings.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {panel.buildings.endereco}, {panel.buildings.bairro} - Painel {panel.code}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Vídeos aprovados disponíveis */}
          {approvedVideos.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Vídeos Aprovados Disponíveis
              </Label>
              <div className="grid grid-cols-1 gap-2 p-4 border rounded-lg bg-muted/50">
                {approvedVideos.map((video) => (
                  <div key={video.videos.id} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div>
                      <div className="font-medium">{video.videos.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {video.videos.duracao}s • {video.videos.orientacao}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datas da campanha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date) {
                        setFormData(prev => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Data de Fim *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      if (date) {
                        setFormData(prev => ({ ...prev, endDate: format(date, 'yyyy-MM-dd') }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Horários Gerais da Campanha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário de Início da Campanha *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Horário de Fim da Campanha *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          {/* Seção de Agendamento de Vídeos */}
          {approvedVideos.length > 0 && (
            <VideoSchedulingSection
              approvedVideos={approvedVideos}
              videoSchedules={videoSchedules}
              onSchedulesChange={setVideoSchedules}
            />
          )}

          {/* Mensagem de validação */}
          {!isFormValid() && (
            <div className="p-3 bg-muted border rounded-lg">
              <p className="text-sm text-muted-foreground">
                {getValidationMessage()}
              </p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-4 pt-6">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !isFormValid()}
              className="flex-1"
              size="lg"
            >
              {loading ? (
                <>Criando Campanha...</>
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