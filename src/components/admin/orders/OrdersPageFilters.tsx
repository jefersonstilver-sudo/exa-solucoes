
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrdersPageFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
}

const OrdersPageFilters: React.FC<OrdersPageFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter
}) => {
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900 font-bold">
          <TrendingUp className="h-5 w-5 mr-2 text-indexa-purple" />
          Filtros Avançados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Buscar por ID, nome ou email do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-600 focus:border-indexa-purple focus:ring-indexa-purple"
              />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white font-medium"
              >
                <Filter className="h-4 w-4 mr-2" />
                Status: {statusFilter === 'all' ? 'Todos' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border-gray-200">
              <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-gray-900 hover:bg-gray-100 font-medium">
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pendente')} className="text-gray-900 hover:bg-gray-100 font-medium">
                ⏳ Aguardando Pagamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('tentativa')} className="text-gray-900 hover:bg-gray-100 font-medium">
                ❌ Tentativas Abandonadas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pago_pendente_video')} className="text-gray-900 hover:bg-gray-100 font-medium">
                📹 Aguardando Vídeo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('video_enviado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                📤 Vídeo Enviado
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('video_aprovado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                ✅ Vídeo Aprovado
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('ativo')} className="text-gray-900 hover:bg-gray-100 font-medium">
                🟢 Ativos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('cancelado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                🚫 Cancelados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('expirado')} className="text-gray-900 hover:bg-gray-100 font-medium">
                ⏰ Expirados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersPageFilters;
