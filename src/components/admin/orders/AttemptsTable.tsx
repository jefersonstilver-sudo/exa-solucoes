
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Clock, MapPin, AlertTriangle, DollarSign } from 'lucide-react';
import { OrderOrAttempt } from '@/hooks/useOrdersWithAttempts';

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

  const getPanelsCount = (item: OrderOrAttempt) => {
    if (item.type === 'attempt') {
      return item.predios_selecionados?.length || 0;
    }
    return item.lista_paineis?.length || 0;
  };

  const getAttemptBadge = (item: OrderOrAttempt) => {
    if (item.type === 'attempt') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Carrinho Abandonado
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-300">
          <Clock className="h-3 w-3 mr-1" />
          Aguardando Pagamento
        </Badge>
      );
    }
  };

  const handleContact = (email: string, type: 'email' | 'phone') => {
    if (type === 'email') {
      window.open(`mailto:${email}?subject=Finalize sua compra na Indexa&body=Olá! Notamos que você iniciou uma compra em nossa plataforma mas não finalizou o pagamento. Podemos ajudá-lo a concluir?`);
    } else {
      // Para telefone, você pode integrar com WhatsApp ou outro sistema
      window.open(`https://wa.me/?text=Olá! Sobre sua tentativa de compra na Indexa...`);
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
            <TableHead className="text-gray-900 font-semibold">Status</TableHead>
            <TableHead className="text-gray-900 font-semibold">Cliente</TableHead>
            <TableHead className="text-gray-900 font-semibold">Data da Tentativa</TableHead>
            <TableHead className="text-gray-900 font-semibold">Valor</TableHead>
            <TableHead className="text-gray-900 font-semibold">Painéis</TableHead>
            <TableHead className="text-gray-900 font-semibold">Ações CRM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt) => (
            <TableRow key={`${attempt.type}-${attempt.id}`} className="border-gray-200 hover:bg-red-25">
              <TableCell>
                {getAttemptBadge(attempt)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{getClientName(attempt)}</span>
                  <span className="text-sm text-gray-700">{getClientEmail(attempt)}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-800 font-medium">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                  {formatDate(attempt.created_at)}
                </div>
              </TableCell>
              <TableCell className="font-bold text-red-600 text-base">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {formatCurrency(attempt.valor_total || 0)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-gray-800 font-medium">
                  <MapPin className="h-4 w-4 mr-1 text-indexa-purple" />
                  <span>{getPanelsCount(attempt)} painéis</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleContact(getClientEmail(attempt), 'email')}
                    className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
                    title="Enviar email"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleContact(getClientEmail(attempt), 'phone')}
                    className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                    title="Contatar via WhatsApp"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AttemptsTable;
