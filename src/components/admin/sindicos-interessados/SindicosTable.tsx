
import React from 'react';
import { Building2, User, MapPin, Phone, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SindicoInteressado } from './types';

interface SindicosTableProps {
  sindicos: SindicoInteressado[];
  onUpdateStatus: (id: string, status: string) => void;
  onViewDetails: (sindico: SindicoInteressado) => void;
}

const SindicosTable: React.FC<SindicosTableProps> = ({
  sindicos,
  onUpdateStatus,
  onViewDetails
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Síndico</TableHead>
              <TableHead>Prédio</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Unidades</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sindicos.map((sindico) => (
              <TableRow key={sindico.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">{sindico.nome_completo}</div>
                      <div className="text-sm text-gray-500">{sindico.email}</div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{sindico.nome_predio}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{sindico.endereco}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-center">
                    <div className="font-medium">{sindico.numero_unidades}</div>
                    <div className="text-xs text-gray-500">{sindico.numero_andares} andares</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{sindico.celular}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Select
                    value={sindico.status}
                    onValueChange={(value) => onUpdateStatus(sindico.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="contatado">Contatado</SelectItem>
                      <SelectItem value="interessado">Interessado</SelectItem>
                      <SelectItem value="nao_interessado">Não Interessado</SelectItem>
                      <SelectItem value="instalado">Instalado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(sindico.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewDetails(sindico)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {sindicos.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Nenhum síndico encontrado com os filtros aplicados
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SindicosTable;
