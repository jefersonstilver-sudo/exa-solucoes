import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye, Building, User, Monitor, Smartphone, Video, Crown, RefreshCw, MessageCircle, MoreHorizontal,
  ChevronDown, Copy, IdCard, Mail, CalendarRange,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import { formatDistanceToNow, format, differenceInCalendarDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';
import { getStatusConfig as getCanonicalStatusConfig } from '@/constants/pedidoStatus';
import { useOrderCurrentVideoData } from '@/hooks/useOrderCurrentVideoData';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import OrderPixActions from '@/components/admin/orders/pix/OrderPixActions';
import SofiaSoldBadge from '@/components/admin/orders/SofiaSoldBadge';
import OrderExpirationIndicator from '@/components/admin/orders/OrderExpirationIndicator';
import { crm360Path } from '@/services/crm360';
import { formatarFone, soDigitos } from '@/services/pedidoWhatsappService';

interface MinimalOrderCardProps {
  item: OrderOrAttempt;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
  onViewOrderDetails?: (orderId: string) => void;
  showCheckbox?: boolean;
  isSuperAdmin?: boolean;
  /** clique no nome do cliente abre o cadastro + WhatsApps do pedido */
  onOpenClientProfile?: (item: OrderOrAttempt) => void;
  /** estado inicial da secao de detalhes (botao "expandir todos" da lista) */
  defaultExpanded?: boolean;
}

// Usa o mapper central canônico para obter configuração de status
const getStatusConfig = (status: string, type: 'order' | 'attempt') => {
  if (type === 'attempt') {
    return { label: 'Tentativa', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: '📝' };
  }
  const config = getCanonicalStatusConfig(status);
  return { label: config.label, className: config.className, icon: config.icon };
};

const copiar = async (texto: string, rotulo: string) => {
  try { await navigator.clipboard.writeText(texto); toast.success(`${rotulo} copiado`); } catch { toast.error('Não foi possível copiar'); }
};

export const MinimalOrderCard: React.FC<MinimalOrderCardProps> = ({
  item,
  isSelected,
  onSelectionChange,
  onViewOrderDetails,
  showCheckbox = true,
  isSuperAdmin = false,
  onOpenClientProfile,
  defaultExpanded = false,
}) => {
  const { basePath } = useAdminBasePath();
  const [aberto, setAberto] = useState(defaultExpanded);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => { setAberto(defaultExpanded); }, [defaultExpanded]);

  const isOrder = item.type === 'order';
  const statusConfig = getStatusConfig(item.status, item.type);
  const showVideoPreview = isOrder && ['ativo', 'video_aprovado'].includes(item.status);
  const { videoData } = useOrderCurrentVideoData(showVideoPreview ? item.id : '');
  const isVertical = (item as any).tipo_produto === 'vertical_premium';
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR });

  // lista_predios e a fonte principal; lista_paineis e o fallback
  const panelList = item.lista_predios?.length ? item.lista_predios : item.lista_paineis;
  const panelCount = isOrder ? (panelList?.length || 0) : (item.predios_selecionados?.length || 0);

  // progresso do contrato (a contagem de dias restantes fica so no indicador, para nao divergir)
  const hasContractDates = !!(item.data_inicio && item.data_fim);
  let contractProgress = 0;
  if (hasContractDates) {
    const start = new Date(item.data_inicio!);
    const end = new Date(item.data_fim!);
    const total = differenceInCalendarDays(end, start);
    const passados = differenceInCalendarDays(new Date(), start);
    contractProgress = isPast(end) ? 100 : total > 0 ? Math.min(Math.max((passados / total) * 100, 0), 100) : 0;
  }

  const whatsapp = item.whatsapp || null;
  const emailPedido = item.email || item.client_email || null;
  // CRM Evolution > Sofia, ja na conversa do cliente (se nao existir, o painel cria uma pronta para escrever)
  const conversarHref = whatsapp
    ? `${basePath}/crm-evolution/conversas/sofia?telefone=${soDigitos(whatsapp)}&nome=${encodeURIComponent(item.client_name || '')}`
    : null;

  const sincronizar = async () => {
    if (!panelList?.length) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-buildings-external-api', {
        body: { pedido_id: item.id, action: 'add', building_ids: panelList },
      });
      if (error) throw error;
      if (!data?.success) toast.error('Sincronização parcial com a API AWS.');
      else toast.success(`Sincronizado! ${data.synced} vídeo(s) → ${data.buildings} prédio(s)`);
    } catch (err: any) {
      toast.error(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl hover:border-border hover:shadow-md transition-all">
      <div className="flex items-start gap-3 p-3 sm:p-4">
        {showCheckbox && (
          <div className="pt-1">
            <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectionChange(item.id, checked as boolean)} />
          </div>
        )}

        {showVideoPreview && (
          <div className={`hidden sm:block flex-shrink-0 rounded-lg overflow-hidden bg-black/90 border border-border/50 ${isVertical ? 'w-16 h-28' : 'w-24 aspect-video'}`}>
            {videoData?.videoUrl ? (
              <video src={videoData.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Video className="h-5 w-5 text-muted-foreground" /></div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Linha 1: pedido + selos | valor */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-base font-bold text-foreground truncate max-w-[260px]">
                {item.nome_pedido || `Pedido #${item.id.substring(0, 8)}`}
              </span>
              {item.nome_pedido && <span className="font-mono text-[11px] text-muted-foreground">#{item.id.substring(0, 8)}</span>}
              <Badge className={`${statusConfig.className} text-[11px] font-medium px-1.5 py-0`}>
                {statusConfig.icon} {statusConfig.label}
              </Badge>
              {isOrder && (isVertical ? (
                <Badge variant="outline" className="text-[10px] border-purple-400 text-purple-700 bg-purple-50 px-1.5 py-0">
                  <Smartphone className="h-2.5 w-2.5 mr-0.5" /> Vertical
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-700 bg-blue-50 px-1.5 py-0">
                  <Monitor className="h-2.5 w-2.5 mr-0.5" /> Horizontal
                </Badge>
              ))}
              {item.is_master && (
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-600 text-amber-950 text-[10px] px-1.5 py-0 font-bold">
                  <Crown className="h-2.5 w-2.5 mr-0.5" /> MASTER
                </Badge>
              )}
              {isOrder && <SofiaSoldBadge pedidoId={item.id} />}
            </div>
            <span className="text-base font-bold text-foreground whitespace-nowrap">{formatCurrency(item.valor_total || 0)}</span>
          </div>

          {/* Linha 2: cliente + Conversar | plano e quando */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              {isOrder && onOpenClientProfile ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenClientProfile(item); }}
                  className="text-sm font-medium truncate text-left hover:text-primary hover:underline"
                  title="Ver cadastro do cliente e WhatsApps do pedido"
                >
                  {item.client_name || 'Nome não disponível'}
                </button>
              ) : (
                <span className="text-sm font-medium truncate">{item.client_name || 'Nome não disponível'}</span>
              )}
              {isOrder && (conversarHref ? (
                <Button asChild size="sm" className="h-6 px-2 text-[11px] bg-green-600 hover:bg-green-700 text-white flex-shrink-0">
                  <Link to={conversarHref} title={`Abrir a conversa da Sofia com ${formatarFone(whatsapp)}`}>
                    <MessageCircle className="h-3 w-3 mr-1" /> Conversar
                  </Link>
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenClientProfile?.(item); }}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 flex-shrink-0"
                  title="Pedido sem WhatsApp. Clique para cadastrar."
                >
                  <MessageCircle className="h-3 w-3" /> Sem WhatsApp
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap" title={format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}>
              {isOrder && item.plano_meses ? `${item.plano_meses} meses · ` : ''}{timeAgo}
            </span>
          </div>

          {/* Linha 3: vigencia + paineis | acoes */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              {isOrder && hasContractDates && (
                <>
                  <OrderExpirationIndicator endDate={item.data_fim!} compact />
                  <Progress value={contractProgress} className="h-1.5 w-24 sm:w-40" />
                </>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Building className="h-3.5 w-3.5" /> {panelCount} {panelCount === 1 ? 'painel' : 'painéis'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isOrder && (
                <OrderPixActions order={{ id: item.id, status: item.status, type: item.type, valor_total: item.valor_total, client_name: item.client_name, email: item.client_email, client_id: item.client_id }} />
              )}
              {isOrder && onViewOrderDetails && (
                <Button variant="outline" size="sm" onClick={() => onViewOrderDetails(item.id)} className="h-8 px-3 text-xs">
                  <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                </Button>
              )}
              {isOrder && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" aria-label="Mais ações">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to={crm360Path(basePath, { user: item.client_id || undefined, phone: whatsapp || undefined, email: emailPedido || undefined })}>
                        <IdCard className="h-4 w-4 mr-2" /> Ficha 360 do cliente
                      </Link>
                    </DropdownMenuItem>
                    {onOpenClientProfile && (
                      <DropdownMenuItem onClick={() => onOpenClientProfile(item)}>
                        <User className="h-4 w-4 mr-2" /> Cadastro e WhatsApps
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {emailPedido && (
                      <DropdownMenuItem onClick={() => copiar(emailPedido, 'E-mail')}>
                        <Copy className="h-4 w-4 mr-2" /> Copiar e-mail
                      </DropdownMenuItem>
                    )}
                    {whatsapp && (
                      <DropdownMenuItem onClick={() => copiar(formatarFone(whatsapp), 'WhatsApp')}>
                        <Copy className="h-4 w-4 mr-2" /> Copiar WhatsApp
                      </DropdownMenuItem>
                    )}
                    {isSuperAdmin && !!panelList?.length && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={sincronizar} disabled={syncing}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> Sincronizar com a AWS
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                aria-label={aberto ? 'Esconder detalhes' : 'Mostrar detalhes'}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes (cada informacao aparece uma vez so) */}
      {aberto && (
        <div className="border-t border-border/50 bg-muted/30 px-4 py-3 rounded-b-xl">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="truncate font-medium">{emailPedido || 'Não informado'}</dd>
            </div>
            {isOrder && (
              <div className="flex items-center gap-2 min-w-0">
                <MessageCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <dt className="text-muted-foreground">WhatsApp</dt>
                <dd className="truncate font-medium">
                  {whatsapp ? formatarFone(whatsapp) : 'Não informado'}
                  {!!item.whatsapp_autorizados && (
                    <span className="ml-1 text-muted-foreground font-normal">+ {item.whatsapp_autorizados} autorizado(s)</span>
                  )}
                </dd>
              </div>
            )}
            {isOrder && hasContractDates && (
              <div className="flex items-center gap-2">
                <CalendarRange className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <dt className="text-muted-foreground">Vigência</dt>
                <dd className="font-medium">
                  {format(new Date(item.data_inicio!), 'dd/MM/yyyy')} a {format(new Date(item.data_fim!), 'dd/MM/yyyy')}
                </dd>
              </div>
            )}
            {isOrder && !!panelList?.length && (
              <div className="flex items-start gap-2 min-w-0 sm:col-span-2">
                <Building className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <dt className="text-muted-foreground">Painéis</dt>
                <dd className="flex flex-wrap gap-1">
                  {panelList.map((painelId: string) => (
                    <Badge key={painelId} variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-background text-muted-foreground">
                      {painelId.substring(0, 8)}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
};

export default MinimalOrderCard;
