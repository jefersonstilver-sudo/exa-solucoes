
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                <DropdownMenuRadioItem value="all">Todos os Status</DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Status Inteligentes</DropdownMenuLabel>
                <DropdownMenuRadioItem value="em_exibicao">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>🟢 Em Exibição</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="aguardando_video">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>📹 Aguardando Vídeo</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="aguardando_aprovacao">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span>📤 Aguardando Aprovação</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="aguardando_pagamento">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>⏳ Aguardando Pagamento</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Status do Sistema</DropdownMenuLabel>
                <DropdownMenuRadioItem value="pago">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>✅ Pago</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cancelado">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>🚫 Cancelado</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cancelado_automaticamente">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-700" />
                    <span>⏰ Cancelado Automaticamente</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="bloqueado">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>🔒 Bloqueado</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="tentativa">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <span>📝 Tentativas</span>
                  </div>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersPageFilters;
