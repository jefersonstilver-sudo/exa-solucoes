
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BuildingSalesTabProps {
  sales: any[];
}

const BuildingSalesTab: React.FC<BuildingSalesTabProps> = ({ sales }) => {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas Realizadas ({sales.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Duração</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale: any) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.status}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(sale.valor_total)}</TableCell>
                  <TableCell>{sale.plano_meses} meses</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Nenhuma venda registrada para este prédio
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BuildingSalesTab;
