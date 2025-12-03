
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { CouponFilters } from '@/types/coupon';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

interface CouponFiltersProps {
  filters: CouponFilters;
  onFiltersChange: (filters: CouponFilters) => void;
}

const CouponFiltersComponent: React.FC<CouponFiltersProps> = ({ 
  filters, 
  onFiltersChange 
}) => {
  const { isMobile } = useAdvancedResponsive();

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status as CouponFilters['status']
    });
  };

  const handleCategoryChange = (categoria: string) => {
    onFiltersChange({
      ...filters,
      categoria
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchTerm: e.target.value
    });
  };

  // Mobile: Only search input (status is in quick filter pills)
  if (isMobile) {
    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
          <Input
            placeholder="Buscar cupom..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="pl-9 h-9 text-sm bg-white/80 backdrop-blur-sm border-white/50"
          />
        </div>
        <Select value={filters.categoria} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-28 h-9 text-xs bg-white/80 backdrop-blur-sm border-white/50">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="geral">Geral</SelectItem>
            <SelectItem value="primeiro_pedido">1º Pedido</SelectItem>
            <SelectItem value="fidelidade">Fidelidade</SelectItem>
            <SelectItem value="especial">Especial</SelectItem>
            <SelectItem value="parceiro">Parceiro</SelectItem>
            <SelectItem value="promocional">Promocional</SelectItem>
            <SelectItem value="cortesia">Cortesia</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Desktop: Full filters
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por código ou descrição..."
          value={filters.searchTerm}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>
      
      <Select value={filters.status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value="active">Ativos</SelectItem>
          <SelectItem value="inactive">Inativos</SelectItem>
          <SelectItem value="expired">Expirados</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.categoria} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Categorias</SelectItem>
          <SelectItem value="geral">Geral</SelectItem>
          <SelectItem value="primeiro_pedido">Primeiro Pedido</SelectItem>
          <SelectItem value="fidelidade">Fidelidade</SelectItem>
          <SelectItem value="especial">Especial</SelectItem>
          <SelectItem value="parceiro">Parceiro</SelectItem>
          <SelectItem value="promocional">Promocional</SelectItem>
          <SelectItem value="cortesia">Cortesia</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CouponFiltersComponent;
