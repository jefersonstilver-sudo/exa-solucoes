import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Clock, MapPin, AlertTriangle, DollarSign } from 'lucide-react';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';

interface AttemptsTableProps {
  attempts: OrderOrAttempt[];
}

const AttemptsTable: React.FC<AttemptsTableProps> = ({ attempts }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getClientName = (item: OrderOrAttempt) => {
    if (item.type === 'attempt') {
      return item.client_name || 'Nome não disponível';
    }
    return item.client_name;
  };

  const getClientEmail = (item: OrderOrAttempt) => {
    if (item.type === 'attempt') {
      return item.client_email || 'Email não encontrado';
    }
    return item.client_email;
  };

  const getClientPhone = (item: OrderOrAttempt) => {
    return item.client_phone || null;
  };

  const getPanelsInfo = (item: OrderOrAttempt) => {
    if (item.type === 'attempt' && item.selected_buildings) {
      return item.selected_buildings;
    }
    return item.lista_paineis?.length || 0;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `Há ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Há ${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Há ${diffDays} dias`;
    }
  };

  const getUrgencyColor = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours <= 2) return 'bg-red-50 border-l-4 border-red-500';
    if (diffHours <= 24) return 'bg-orange-50 border-l-4 border-orange-500';
    return 'bg-gray-50 border-l-4 border-gray-300';
  };

  const getAttemptBadge = (item: OrderOrAttempt) => {
    const timeAgo = getTimeAgo(item.created_at);
    
    if (item.type === 'attempt') {
      return (
        <div className="flex flex-col gap-1">
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Abandonado
          </Badge>
          <span className="text-xs text-red-600 font-medium">{timeAgo}</span>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col gap-1">
          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando
          </Badge>
          <span className="text-xs text-orange-600 font-medium">{timeAgo}</span>
        </div>
      );
    }
  };

  const handleContact = (item: OrderOrAttempt, type: 'email' | 'whatsapp') => {
    const name = getClientName(item);
    const value = formatCurrency(item.valor_total || 0);
    
    if (type === 'email') {
      const subject = encodeURIComponent('Complete sua compra na Indexa - Oferta especial!');
      const body = encodeURIComponent(`Olá ${name}!\n\nNotamos que você iniciou uma compra de ${value} em nossa plataforma mas não finalizou o pagamento.\n\nPodemos ajudá-lo a concluir? Temos uma oferta especial para você!\n\nEquipe Indexa`);
      window.open(`mailto:${getClientEmail(item)}?subject=${subject}&body=${body}`);
    } else if (type === 'whatsapp') {
      const phone = getClientPhone(item);
      const message = encodeURIComponent(`Olá ${name}! 👋\n\nVi que você estava interessado em anunciar na Indexa (${value}). Posso te ajudar a finalizar? Tenho uma proposta especial para você! 🎯`);
      
      if (phone) {
        // Limpar o telefone e formatar para WhatsApp
        const cleanPhone = phone.replace(/\D/g, '');
        const whatsappPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        window.open(`https://wa.me/${whatsappPhone}?text=${message}`);
      } else {
        window.open(`https://wa.me/?text=${message}`);
      }
    }
  };

  if (attempts.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-900 text-lg font-semibold">Nenhuma tentativa encontrada</div>
        <p className="text-gray-700 mt-2">
          Quando usuários iniciarem compras sem finalizar, aparecerão aqui para follow-up
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-200">
            <TableHead className="text-gray-900 font-semibold">Status & Urgência</TableHead>
            <TableHead className="text-gray-900 font-semibold">Cliente</TableHead>
            <TableHead className="text-gray-900 font-semibold">Contato</TableHead>
            <TableHead className="text-gray-900 font-semibold">Valor</TableHead>
            <TableHead className="text-gray-900 font-semibold">Locais Selecionados</TableHead>
            <TableHead className="text-gray-900 font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt) => {
            const panelsInfo = getPanelsInfo(attempt);
            const phone = getClientPhone(attempt);
            
            return (
              <TableRow 
                key={`${attempt.type}-${attempt.id}`} 
                className={`border-gray-200 hover:bg-gray-50 ${getUrgencyColor(attempt.created_at)}`}
              >
                <TableCell>
                  {getAttemptBadge(attempt)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{getClientName(attempt)}</span>
                    <span className="text-sm text-gray-700">{getClientEmail(attempt)}</span>
                    {attempt.client_cpf && (
                      <span className="text-xs text-gray-500">CPF: {attempt.client_cpf}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    {phone ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContact(attempt, 'whatsapp')}
                        className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white w-full justify-start"
                        title={`WhatsApp: ${phone}`}
                      >
                        <Phone className="h-3 w-3 mr-2" />
                        {phone}
                      </Button>
                    ) : (
                      <div className="flex items-center text-gray-400 text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        Sem telefone
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-bold text-red-600 text-base">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {formatCurrency(attempt.valor_total || 0)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    {Array.isArray(panelsInfo) ? (
                      <div className="space-y-1">
                        {panelsInfo.map((building, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium text-gray-900">{building.nome}</div>
                            <div className="text-xs text-gray-600">{building.endereco}, {building.bairro}</div>
                          </div>
                        ))}
                        {panelsInfo.length > 1 && (
                          <Badge variant="secondary" className="mt-1">
                            {panelsInfo.length} locais
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-800 font-medium">
                        <MapPin className="h-4 w-4 mr-1 text-indexa-purple" />
                        <span>{panelsInfo} painéis</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContact(attempt, 'email')}
                      className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
                      title="Enviar email personalizado"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                    {phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContact(attempt, 'whatsapp')}
                        className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                        title="Abrir WhatsApp"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AttemptsTable;
