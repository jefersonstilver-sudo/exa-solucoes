import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { List, Download, Search, RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';

interface Transaction {
  id: string;
  date: string;
  external_reference: string;
  payer_name: string;
  payer_email: string;
  amount: number;
  net_amount: number;
  payment_method: string;
  status: string;
}

interface TransactionsTableProps {
  data?: Transaction[];
  loading?: boolean;
  onRefresh?: () => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ data = [], loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = data.filter(t => {
    const search = searchTerm.toLowerCase();
    return (
      (t.payer_name?.toLowerCase() || '').includes(search) ||
      (t.payer_email?.toLowerCase() || '').includes(search) ||
      (t.external_reference?.toLowerCase() || '').includes(search) ||
      t.id.toString().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Aprovado</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'pix': 'PIX',
      'credit_card': 'Cartão Crédito',
      'debit_card': 'Cartão Débito',
      'bank_transfer': 'Transferência',
      'ticket': 'Boleto',
      'account_money': 'Saldo MP'
    };
    return methods[method] || method;
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    const headers = ['ID', 'Data', 'Referência', 'Pagador', 'Email', 'Valor', 'Líquido', 'Método', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.date,
      t.external_reference || '-',
      t.payer_name || '-',
      t.payer_email || '-',
      t.amount,
      t.net_amount,
      t.payment_method,
      t.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes_mp_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <List className="h-5 w-5 text-primary" />
            Transações Mercado Pago
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={data.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
        
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pagador, email ou referência..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando transações...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>ID/Ref</TableHead>
                  <TableHead>Pagador</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">MP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {data.length === 0 ? 'Nenhuma transação encontrada' : 'Nenhum resultado para a busca'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{t.date}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {t.external_reference ? `#${t.external_reference.slice(0, 8)}` : `#${t.id}`}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px]">
                          <p className="text-sm truncate">{t.payer_name || '-'}</p>
                          <p className="text-xs text-muted-foreground truncate">{t.payer_email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(t.net_amount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getPaymentMethodLabel(t.payment_method)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(t.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <CheckCircle2 className="h-4 w-4 text-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {data.length > 0 && (
              <div className="flex items-center justify-end mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {filteredTransactions.length} de {data.length} transações
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTable;
