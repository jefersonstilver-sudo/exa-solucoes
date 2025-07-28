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
import { CalendarIcon, Building, Video, Monitor, Save, X, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

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
  lista_predios: string[];
  data_inicio: string;
  data_fim: string;
  valor_total: number;
  buildings?: {
    id: string;
    nome: string;
    endereco: string;
    bairro: string;
    numero_unidades: number;
    publico_estimado: number;
  }[];
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
  
  // Controle para evitar carregamentos excessivos
  const [isFormLoading, setIsFormLoading] = useState(false);
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
        .select(`
          id,
          lista_paineis,
          lista_predios,
          data_inicio,
          data_fim,
          valor_total
        `)
        .in('status', ['pago', 'pago_pendente_video', 'video_aprovado']);

      if (error) throw error;

      // Enriquecer com informações dos prédios
      const enrichedOrders = await Promise.all(
        (pedidos || []).map(async (order) => {
          if (order.lista_predios && order.lista_predios.length > 0) {
            const { data: buildings } = await supabase
              .from('buildings')
              .select('id, nome, endereco, bairro, numero_unidades, publico_estimado')
              .in('id', order.lista_predios);
            
            return {
              ...order,
              buildings: buildings || []
            };
          }
          return order;
        })
      );

      return {
        hasOrders: enrichedOrders && enrichedOrders.length > 0,
        orders: enrichedOrders || []
      };
    } catch (error: any) {
      console.error('Erro ao verificar pedidos:', error);
      toast.error('Erro ao verificar pedidos');
      return { hasOrders: false, orders: [] };
    }
  };

  const loadOrderData = async (orderId: string) => {
    if (!orderId || isFormLoading) return;

    setIsFormLoading(true);
    try {
      // Carregar painéis e vídeos em paralelo
      const [panels, videos] = await Promise.all([
        getPedidoPanels(orderId),
        getApprovedVideos(orderId)
      ]);

      console.log('📦 Dados carregados - Painéis:', panels.length, 'Vídeos:', videos.length);

      setAvailablePanels(panels);
      setApprovedVideos(videos);

      // Resetar dados do form quando não há painéis válidos
      if (panels.length === 0) {
        setFormData(prev => ({ ...prev, panelId: '' }));
      }

      // Resetar agendamentos quando trocar de pedido
      setVideoSchedules([]);
    } catch (error: any) {
      console.error('Erro ao carregar dados do pedido:', error);
      toast.error('Erro ao carregar dados do pedido');
    } finally {
      setIsFormLoading(false);
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
    const hasScheduledVideos = videoSchedules.length > 0;
    
    // Debug logs temporários
    console.log('🔍 DEBUG: FormData completo:', formData);
    console.log('🔍 DEBUG: availablePanels:', availablePanels);
    console.log('🔍 DEBUG: videoSchedules:', videoSchedules);
    console.log('🔍 DEBUG: Validação individual:', {
      hasName,
      hasOrder,
      hasPanel,
      hasStartDate,
      hasEndDate,
      hasStartTime,
      hasEndTime,
      hasScheduledVideos
    });
    
    const isValid = hasName && hasOrder && hasPanel && hasStartDate && hasEndDate && hasStartTime && hasEndTime && hasScheduledVideos;
    console.log('🔍 DEBUG: Form isValid:', isValid);
    
    return isValid;
  };

  const getValidationMessage = () => {
    if (!formData.name.trim()) return "Nome da campanha é obrigatório";
    if (!formData.orderId.trim()) return "Selecione um pedido pago";
    if (!formData.panelId.trim()) return "Selecione um painel";
    if (!formData.startDate.trim()) return "Selecione a data de início";
    if (!formData.endDate.trim()) return "Selecione a data de fim";
    if (!formData.startTime.trim()) return "Defina o horário de início";
    if (!formData.endTime.trim()) return "Defina o horário de fim";
    if (videoSchedules.length === 0) return "Adicione pelo menos um vídeo ao agendamento";
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
    <Card className="w-full max-w-[98vw] sm:max-w-2xl lg:max-w-4xl mx-auto">
      <CardHeader className="p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Monitor className="h-4 w-4 sm:h-5 sm:w-5" />
            Nova Campanha Avançada
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 sm:h-10 sm:w-10">
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-6 p-3 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
          {/* Nome da Campanha */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Nome da Campanha *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Campanha Black Friday 2024"
              className="text-sm"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva os objetivos e detalhes da campanha..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {/* Seleção do Pedido */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="order" className="text-xs sm:text-sm flex items-center gap-1">
              <Building className="h-3 w-3" />
              Pedido Pago *
            </Label>
            <Select value={formData.orderId} onValueChange={handleOrderChange}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Selecione um pedido pago..." />
              </SelectTrigger>
                <SelectContent className="max-w-[95vw] z-50">
                {paidOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id} className="min-h-[85px] sm:min-h-[75px] p-0">
                    <div className="w-full p-4 sm:p-5 space-y-3 sm:space-y-2">
                      {order.buildings && order.buildings.length > 0 ? (
                        <>
                          {/* Nome do prédio com separador */}
                          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <Building className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-semibold text-sm sm:text-base text-foreground">
                              {order.buildings[0].nome}
                            </span>
                          </div>
                          
                          {/* Endereço */}
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                              {order.buildings[0].endereco}
                            </span>
                          </div>
                          
                          {/* Bairro e valor */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                              {order.buildings[0].bairro}
                            </span>
                            <Badge variant="secondary" className="text-xs font-medium">
                              R$ {order.valor_total?.toFixed(2) || '0.00'}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Pedido #{order.id.substring(0, 8)}
                          </span>
                          <Badge variant="secondary" className="text-xs font-medium">
                            R$ {order.valor_total?.toFixed(2) || '0.00'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção do Painel com informações do prédio */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="panel" className="text-xs sm:text-sm flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Painel e Localização *
            </Label>
            {availablePanels.length > 0 ? (
              <Select 
                value={formData.panelId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, panelId: value }))}
              >
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Selecione um painel..." />
                </SelectTrigger>
              <SelectContent className="max-w-[95vw] z-50">
                {availablePanels.map((panel) => (
                  <SelectItem key={panel.id} value={panel.id} className="min-h-[80px] sm:min-h-[70px] p-0">
                    <div className="w-full p-4 sm:p-5 space-y-3 sm:space-y-2">
                      {/* Código do painel com destaque */}
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <Monitor className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {panel.code}
                        </span>
                      </div>
                      
                      {/* Informações do prédio */}
                      <div className="space-y-2 sm:space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-foreground">
                          {panel.buildings.nome}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {panel.buildings.endereco}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {panel.buildings.bairro}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            ) : formData.orderId ? (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  ⚠️ Este pedido não possui painéis válidos disponíveis. 
                  Os painéis podem ter sido removidos ou estar offline. 
                  Entre em contato com o suporte.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-muted border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Selecione um pedido primeiro para ver os painéis disponíveis
                </p>
              </div>
            )}
          </div>

          {/* Vídeos aprovados disponíveis */}
          {approvedVideos.length > 0 && (
            <div className="space-y-1 sm:space-y-2">
              <Label className="flex items-center gap-1 text-xs sm:text-sm">
                <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                Vídeos Aprovados Disponíveis
              </Label>
              <div className="space-y-2 p-2 sm:p-4 border rounded-lg bg-muted/50">
                {approvedVideos.map((video) => (
                  <div key={video.videos.id} className="p-2 bg-background rounded border">
                    <div className="font-medium text-xs sm:text-sm">{video.videos.nome}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {video.videos.duracao}s • {video.videos.orientacao}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datas da campanha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Data de Início *</Label>
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
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Data de Fim *</Label>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="startTime" className="text-xs sm:text-sm">Horário de Início da Campanha *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="endTime" className="text-xs sm:text-sm">Horário de Fim da Campanha *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="text-sm"
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
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || loading}
              className="w-full sm:w-auto sm:min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs sm:text-sm">Criando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Criar Campanha</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CampaignCreationForm;