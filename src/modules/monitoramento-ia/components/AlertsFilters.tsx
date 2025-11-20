import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { AlertFilters } from '../utils/alerts';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

interface AlertsFiltersProps {
  filters: AlertFilters;
  condominios: string[];
  onFiltersChange: (filters: AlertFilters) => void;
  onClearFilters: () => void;
}

export const AlertsFilters = ({ 
  filters, 
  condominios, 
  onFiltersChange,
  onClearFilters 
}: AlertsFiltersProps) => {
  const { theme } = useModuleTheme();
  const tc = getThemeClasses(theme);
  
  return (
    <div className={`${tc.bgCard} rounded-lg p-4 mb-6 space-y-4 border ${tc.border}`}>
      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
        <Input
          placeholder="Buscar por painel, condomínio ou tipo..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className={`pl-10 ${tc.bgInput} ${tc.border} border ${tc.textPrimary} ${tc.placeholder}`}
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status */}
        <Select
          value={filters.status?.[0] || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              status: value === 'all' ? undefined : [value] 
            })
          }
        >
          <SelectTrigger className={`${tc.bgInput} ${tc.border} border ${tc.textPrimary}`}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className={`${tc.bgCard} ${tc.border} border z-50`}>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
          </SelectContent>
        </Select>

        {/* Severity */}
        <Select
          value={filters.severity?.[0] || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              severity: value === 'all' ? undefined : [value] 
            })
          }
        >
          <SelectTrigger className={`${tc.bgInput} ${tc.border} border ${tc.textPrimary}`}>
            <SelectValue placeholder="Severidade" />
          </SelectTrigger>
          <SelectContent className={`${tc.bgCard} ${tc.border} border z-50`}>
            <SelectItem value="all">Todas as severidades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>

        {/* Condominio */}
        <Select
          value={filters.condominio || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              condominio: value === 'all' ? undefined : value 
            })
          }
        >
          <SelectTrigger className={`${tc.bgInput} ${tc.border} border ${tc.textPrimary}`}>
            <SelectValue placeholder="Condomínio" />
          </SelectTrigger>
          <SelectContent className={`${tc.bgCard} ${tc.border} border z-50`}>
            <SelectItem value="all">Todos os condomínios</SelectItem>
            {condominios.map((cond) => (
              <SelectItem key={cond} value={cond}>{cond}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Order By */}
        <Select
          value={filters.orderBy || 'opened_at'}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              orderBy: value as AlertFilters['orderBy']
            })
          }
        >
          <SelectTrigger className={`${tc.bgInput} ${tc.border} border ${tc.textPrimary}`}>
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent className={`${tc.bgCard} ${tc.border} border z-50`}>
            <SelectItem value="severity">Severidade</SelectItem>
            <SelectItem value="opened_at">Tempo aberto</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="name">Nome do painel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className={`w-full md:w-auto ${tc.bgInput} ${tc.border} border ${tc.textPrimary} ${tc.bgAccentHover}`}
      >
        <X className="w-4 h-4 mr-2" />
        Limpar filtros
      </Button>
    </div>
  );
};
