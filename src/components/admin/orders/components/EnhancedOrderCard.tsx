import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Building, DollarSign, Calendar, User, Mail, Phone, Shield, ShieldOff, Clock, MessageCircle, AlertTriangle, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';
import { CouponBadge } from '@/components/admin/orders/CouponBadge';
interface EnhancedOrderCardProps {
  item: OrderOrAttempt;
  isSelected: boolean;
  onSelectionChange: (id: string, checked: boolean) => void;
  onViewOrderDetails?: (orderId: string) => void;
  onBlockOrder?: (orderId: string) => void;
  onUnblockOrder?: (orderId: string) => void;
  isBlocking?: boolean;
  isUnblocking?: boolean;
}
const getStatusColor = (status: string, correctStatus?: string) => {
  const targetStatus = correctStatus || status;
  const statusMap: Record<string, string> = {
    // Novos status inteligentes
    'em_exibicao': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'aguardando_video': 'bg-blue-100 text-blue-800 border-blue-300',
    'aguardando_aprovacao': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'aguardando_pagamento': 'bg-orange-100 text-orange-800 border-orange-300',
    // Status legados
    'pendente': 'bg-orange-100 text-orange-800 border-orange-300',
    'pago': 'bg-green-100 text-green-800 border-green-300',
    'pago_pendente_video': 'bg-blue-100 text-blue-800 border-blue-300',
    'video_enviado': 'bg-purple-100 text-purple-800 border-purple-300',
    'video_aprovado': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'cancelado': 'bg-red-100 text-red-800 border-red-300',
    'cancelado_automaticamente': 'bg-red-200 text-red-900 border-red-400',
    'tentativa': 'bg-gray-100 text-gray-800 border-gray-300',
    'bloqueado': 'bg-red-200 text-red-900 border-red-400'
  };
  return statusMap[targetStatus] || 'bg-gray-100 text-gray-800 border-gray-300';
};
const getStatusText = (status: string, correctStatus?: string, videoStatus?: string) => {
  // Se o pedido tem vídeos aprovados/ativos, mostrar como "ativo"
  if (status === 'pago' && (videoStatus === 'video_ativo' || videoStatus === 'video_aprovado')) {
    return '🟢 Ativo';
  }
  
  const targetStatus = correctStatus || status;
  const statusMap: Record<string, string> = {
    // Novos status inteligentes com emojis
    'em_exibicao': '🟢 Em Exibição',
    'aguardando_video': '📹 Aguardando Vídeo',
    'aguardando_aprovacao': '📤 Aguardando Aprovação',
    'aguardando_pagamento': '⏳ Aguardando Pagamento',
    // Status legados
    'pendente': '⏳ Aguardando Pagamento',
    'ativo': '🟢 Ativo',
    'pago': '✅ Pago - Aguardando Vídeo',
    'pago_pendente_video': '📹 Aguardando Vídeo',
    'video_enviado': '📤 Vídeo Enviado',
    'video_aprovado': '🟢 Em Exibição',
    'cancelado': '🚫 Cancelado',
    'cancelado_automaticamente': '⏰ Cancelado Automaticamente',
    'tentativa': '📝 Tentativa Abandonada',
    'bloqueado': '🔒 Bloqueado'
  };
  return statusMap[targetStatus] || targetStatus;
};
const getTimeIndicator = (createdAt: string) => {
  const now = new Date();
  const created = new Date(createdAt);
  const hoursDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
  const daysDiff = Math.floor(hoursDiff / 24);
  let timeText = '';
  let urgencyClass = '';
  if (hoursDiff < 24) {
    timeText = `há ${hoursDiff}h`;
    urgencyClass = 'text-green-600'; // Recente
  } else if (daysDiff <= 3) {
    timeText = `há ${daysDiff} dia${daysDiff > 1 ? 's' : ''}`;
    urgencyClass = 'text-yellow-600'; // Moderado
  } else if (daysDiff <= 7) {
    timeText = `há ${daysDiff} dias`;
    urgencyClass = 'text-orange-600'; // Antigo
  } else {
    timeText = `há ${daysDiff} dias`;
    urgencyClass = 'text-red-600'; // Muito antigo
  }
  return {
    timeText,
    urgencyClass,
    daysDiff
  };
};

const detectNationality = (phone: string, cpf: string) => {
  if (!phone && !cpf) return null;
  
  // Se tem CPF brasileiro, é brasileiro
  if (cpf && cpf.length >= 11) return 'Brasileiro';
  
  // Detectar por código do telefone
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    // Brasil: códigos 11-99
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) return 'Brasileiro';
    // Paraguai: código 595
    if (cleanPhone.startsWith('595')) return 'Paraguaio';
    // Se começa com 11, 21, 47, etc (códigos brasileiros) e não tem código país
    if (/^(11|12|13|14|15|16|17|18|19|21|22|24|27|28|31|32|33|34|35|37|38|41|42|43|44|45|46|47|48|49|51|53|54|55|61|62|63|64|65|66|67|68|69|71|73|74|75|77|79|81|82|83|84|85|86|87|88|89|91|92|93|94|95|96|97|98|99)/.test(cleanPhone.substring(0, 2))) {
      return 'Brasileiro';
    }
  }
  
  return null;
};
const formatWhatsAppNumber = (phone: string) => {
  return phone?.replace(/\D/g, '') || '';
};
const generateWhatsAppMessage = (item: OrderOrAttempt) => {
  const clientName = item.client_name || 'Cliente';
  const orderType = item.type === 'order' ? 'pedido' : 'cotação';
  const value = formatCurrency(item.valor_total || 0);
  return encodeURIComponent(`Olá ${clientName}! 👋\n\n` + `Vi que você tem um ${orderType} no valor de ${value} que ainda não foi finalizado.\n\n` + `Posso te ajudar a concluir sua compra? Temos algumas ofertas especiais disponíveis! 🎯\n\n` + `Atenciosamente,\nEquipe Indexa`);
};
export const EnhancedOrderCard: React.FC<EnhancedOrderCardProps> = ({
  item,
  isSelected,
  onSelectionChange,
  onViewOrderDetails,
  onBlockOrder,
  onUnblockOrder,
  isBlocking,
  isUnblocking
}) => {
  const {
    timeText,
    urgencyClass,
    daysDiff
  } = getTimeIndicator(item.created_at);
  const whatsappNumber = formatWhatsAppNumber(item.client_phone || '');
  const whatsappMessage = generateWhatsAppMessage(item);
  const nationality = detectNationality(item.client_phone || '', item.client_cpf || '');
  
  // Debug logging para entender os dados disponíveis
  console.log('🔍 Item data:', {
    id: item.id.substring(0, 8),
    client_phone: item.client_phone,
    client_name: item.client_name,
    client_email: item.client_email,
    client_cpf: item.client_cpf,
    whatsappNumber,
    nationality
  });
  return <Card className={`mb-4 transition-all duration-200 hover:shadow-md ${daysDiff > 7 ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Checkbox checked={isSelected} onCheckedChange={checked => onSelectionChange(item.id, checked as boolean)} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-sm">
                  {item.type === 'order' ? `Pedido #${item.id.substring(0, 8)}` : `Cotação #${item.id.substring(0, 8)}`}
                </CardTitle>
                {item.coupon_code && <CouponBadge couponCode={item.coupon_code} size="md" />}
                <Badge className={getStatusColor(item.status, item.correct_status)}>
                  {getStatusText(item.status, item.correct_status, item.video_status)}
                </Badge>
                <div className={`flex items-center gap-1 text-xs ${urgencyClass}`}>
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">{timeText}</span>
                </div>
                {daysDiff > 7}
              </div>
              <div className="text-xs text-gray-500">
                Criado em {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {
                locale: ptBR
              })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botões de ação - SEMPRE na mesma ordem para consistência visual */}
            {item.type === 'order' && (
              <>
                {/* Botão WhatsApp */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => whatsappNumber && window.open(`https://wa.me/55${whatsappNumber}?text=${whatsappMessage}`, '_blank')} 
                  disabled={!whatsappNumber}
                  className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400 disabled:opacity-30"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>

                {/* Botão Email */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => item.client_email && window.open(`mailto:${item.client_email}?subject=Seu pedido Indexa&body=Olá! Gostaria de conversar sobre seu pedido...`, '_blank')} 
                  disabled={!item.client_email}
                  className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400 disabled:opacity-30"
                >
                  <Mail className="w-4 h-4" />
                </Button>

                {/* Botão Ver Detalhes */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onViewOrderDetails?.(item.id)}
                  className="hover:bg-muted"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                {/* Botão Bloqueio/Desbloqueio */}
                {item.status === 'bloqueado' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onUnblockOrder?.(item.id)} 
                    disabled={isUnblocking} 
                    className="text-green-600 hover:text-green-700"
                  >
                    <ShieldOff className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onBlockOrder?.(item.id)} 
                    disabled={isBlocking || !['pago', 'ativo', 'pago_pendente_video', 'video_enviado', 'video_aprovado'].includes(item.status)}
                    className="text-red-600 hover:text-red-700 disabled:opacity-30"
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}

            {/* Botões para tentativas - também padronizados */}
            {item.type === 'attempt' && (
              <>
                {/* Botão WhatsApp */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => whatsappNumber && window.open(`https://wa.me/55${whatsappNumber}?text=${whatsappMessage}`, '_blank')} 
                  disabled={!whatsappNumber}
                  className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400 disabled:opacity-30"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>

                {/* Botão Email */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => item.client_email && window.open(`mailto:${item.client_email}?subject=Sua cotação Indexa&body=Olá! Vi que você iniciou uma cotação...`, '_blank')} 
                  disabled={!item.client_email}
                  className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400 disabled:opacity-30"
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Informações principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-bold text-lg">{formatCurrency(item.valor_total || 0)}</span>
          </div>
          
          {item.client_name && <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">{item.client_name}</span>
            </div>}
          
          {item.client_email && <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm truncate">{item.client_email}</span>
            </div>}
          
          {item.client_phone && <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-600" />
              <span className="text-sm">{item.client_phone}</span>
            </div>}
        </div>

        {/* Informações adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
          {item.plano_meses && <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span>{item.plano_meses} meses</span>
            </div>}
          
          {item.client_cpf && <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span>CPF: {item.client_cpf}</span>
            </div>}
          
          {nationality && <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{nationality}</span>
            </div>}
        </div>
        
        {/* Informações específicas do tipo */}
        {item.type === 'order' && item.lista_paineis && item.lista_paineis.length > 0 && <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="w-4 h-4" />
              <span>{item.lista_paineis.length} painel(is) selecionado(s)</span>
            </div>
          </div>}
        
        {item.type === 'attempt' && item.selected_buildings && item.selected_buildings.length > 0 && <div className="pt-3 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="w-4 h-4" />
                <span className="font-medium">{item.selected_buildings.length} prédio(s) cotado(s):</span>
              </div>
              <div className="ml-6 text-xs text-gray-500">
                {item.selected_buildings.map((building, index) => <div key={index}>
                    {building.nome} - {building.bairro}
                  </div>)}
              </div>
            </div>
          </div>}

        {/* Indicador de oportunidade */}
        {item.type === 'order' && item.status === 'pendente' || item.type === 'attempt' ? <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              {daysDiff <= 1 && <Badge variant="outline" className="border-green-500 text-green-700 text-xs">
                  🔥 Oportunidade Quente
                </Badge>}
              {daysDiff > 7 && <Badge variant="outline" className="border-red-500 text-red-700 text-xs">
                  ⚠️ Pedido Antigo
                </Badge>}
            </div>
          </div> : null}
      </CardContent>
    </Card>;
};