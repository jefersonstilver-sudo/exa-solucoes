import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { List, Download, Search, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  pedido_id: string;
  client_name: string;
  value: number;
  net_value?: number;
  payment_method: string;
  status: string;
  mp_verified: 'verified' | 'warning' | 'critical';
}

interface TransactionsTableProps {
  data?: Transaction[];
  loading?: boolean;
  onRefresh?: () => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ data = [], loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTransactions = data.filter(t => {
    const matchesSearch = t.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.pedido_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.mp_verified === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    const headers = ['Data', 'Pedido', 'Cliente', 'Valor', 'Valor Líquido', 'Método', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.date, t.pedido_id, t.client_name, t.value, t.net_value || t.value, t.payment_method, t.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes_mp_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
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
              Exportar
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou referência..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="verified">Aprovados</SelectItem>
              <SelectItem value="warning">Pendentes</SelectItem>
              <SelectItem value="critical">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando transações do Mercado Pago...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Referência</TableHead>
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
                      {data.length === 0 ? 'Nenhuma transação encontrada no Mercado Pago' : 'Nenhum resultado para o filtro aplicado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.date}</TableCell>
                      <TableCell className="font-mono text-xs">{transaction.pedido_id}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{transaction.client_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {transaction.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        R$ {(transaction.net_value || transaction.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{transaction.payment_method}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            transaction.mp_verified === 'verified' 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                              : transaction.mp_verified === 'warning'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              : 'bg-red-500/10 text-red-600 border-red-500/30'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getVerificationIcon(transaction.mp_verified)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {data.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>Aprovado</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span>Pendente</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span>Rejeitado</span>
                  </div>
                </div>
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
