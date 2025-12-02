
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
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
  paymentTypeFilter?: string;
  setPaymentTypeFilter?: (type: string) => void;
}

const OrdersPageFilters: React.FC<OrdersPageFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  paymentTypeFilter = 'all',
  setPaymentTypeFilter
}) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 bg-background border-border/50 focus:border-[#9C1E1E]/50 focus:ring-[#9C1E1E]/20 transition-all"
        />
      </div>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline"
            size="sm"
            className="h-10 border-border/50 hover:border-[#9C1E1E]/50 hover:bg-[#9C1E1E]/5 transition-all"
          >
            <Filter className="h-3.5 w-3.5 mr-2" />
            {statusFilter === 'all' ? 'Status' : statusFilter}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-md border-border/50">
          <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
            <DropdownMenuRadioItem value="all" className="cursor-pointer">Todos os Status</DropdownMenuRadioItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Status Inteligentes</DropdownMenuLabel>
            <DropdownMenuRadioItem value="em_exibicao" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Em Exibição</span>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="aguardando_video" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Aguardando Vídeo</span>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="aguardando_aprovacao" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Aguardando Aprovação</span>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="aguardando_pagamento" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Aguardando Pagamento</span>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioItem value="bloqueado" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Bloqueado</span>
              </div>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="tentativa" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span>Tentativas</span>
              </div>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Payment Type Filter */}
      {setPaymentTypeFilter && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline"
              size="sm"
              className="h-10 border-border/50 hover:border-[#9C1E1E]/50 hover:bg-[#9C1E1E]/5 transition-all"
            >
              <Filter className="h-3.5 w-3.5 mr-2" />
              {paymentTypeFilter === 'all' ? 'Pagamento' : 
               paymentTypeFilter === 'fidelidade' ? 'Fidelidade' :
               paymentTypeFilter === 'avista' ? 'À Vista' : 'Cartão'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-md border-border/50">
            <DropdownMenuRadioGroup value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
              <DropdownMenuRadioItem value="all" className="cursor-pointer">Todos</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="fidelidade" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Fidelidade</span>
                </div>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="avista" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>PIX à Vista</span>
                </div>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="cartao" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Cartão</span>
                </div>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default OrdersPageFilters;
