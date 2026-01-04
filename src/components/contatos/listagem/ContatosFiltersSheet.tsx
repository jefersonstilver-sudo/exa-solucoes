import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  ContatosFilters, 
  CategoriaContato, 
  TemperaturaContato, 
  StatusContato,
  OrigemContato,
  CATEGORIAS_CONFIG,
  CATEGORIAS_ORDER,
  TEMPERATURA_CONFIG,
  ORIGEM_CONFIG
} from '@/types/contatos';

interface ContatosFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ContatosFilters;
  onApply: (filters: ContatosFilters) => void;
}

const ORIGEM_OPTIONS: OrigemContato[] = [
  'checkout_site',
  'pedido_criado',
  'conversa_whatsapp_sofia',
  'conversa_whatsapp_vendedor',
  'cadastro_manual',
  'proposta',
  'contrato',
  'importacao',
  'agenda',
  'indicacao',
  'google',
  'instagram',
  'maps',
  'rua',
  'site',
  'telefone',
  'email',
  'outros'
];

export const ContatosFiltersSheet: React.FC<ContatosFiltersSheetProps> = ({
  open,
  onOpenChange,
  filters,
  onApply
}) => {
  const [localFilters, setLocalFilters] = React.useState<ContatosFilters>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, open]);

  const handleChange = <K extends keyof ContatosFilters>(key: K, value: ContatosFilters[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setLocalFilters({});
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros Avançados</SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={localFilters.categoria || ''}
              onValueChange={(v) => handleChange('categoria', v as CategoriaContato || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {CATEGORIAS_ORDER.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORIAS_CONFIG[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperatura */}
          <div className="space-y-2">
            <Label>Temperatura</Label>
            <Select
              value={localFilters.temperatura || ''}
              onValueChange={(v) => handleChange('temperatura', v as TemperaturaContato || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as temperaturas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {(Object.keys(TEMPERATURA_CONFIG) as TemperaturaContato[]).map((temp) => (
                  <SelectItem key={temp} value={temp}>
                    {TEMPERATURA_CONFIG[temp].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={localFilters.status || ''}
              onValueChange={(v) => handleChange('status', v as StatusContato || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
                <SelectItem value="duplicado">Duplicado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Origem */}
          <div className="space-y-2">
            <Label>Origem</Label>
            <Select
              value={localFilters.origem || ''}
              onValueChange={(v) => handleChange('origem', v as OrigemContato || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as origens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {ORIGEM_OPTIONS.map((origem) => (
                  <SelectItem key={origem} value={origem}>
                    {ORIGEM_CONFIG[origem].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cidade */}
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              placeholder="Filtrar por cidade"
              value={localFilters.cidade || ''}
              onChange={(e) => handleChange('cidade', e.target.value || undefined)}
            />
          </div>

          {/* Bairro */}
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input
              placeholder="Filtrar por bairro"
              value={localFilters.bairro || ''}
              onChange={(e) => handleChange('bairro', e.target.value || undefined)}
            />
          </div>

          {/* Pontuação */}
          <div className="space-y-2">
            <Label>Pontuação</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                value={localFilters.pontuacaoMin || ''}
                onChange={(e) => handleChange('pontuacaoMin', e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Máximo"
                value={localFilters.pontuacaoMax || ''}
                onChange={(e) => handleChange('pontuacaoMax', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Bloqueado */}
          <div className="flex items-center justify-between">
            <Label>Apenas bloqueados</Label>
            <Switch
              checked={localFilters.bloqueado === true}
              onCheckedChange={(checked) => handleChange('bloqueado', checked ? true : undefined)}
            />
          </div>

          {/* Data de Criação */}
          <div className="space-y-2">
            <Label>Data de Criação</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={localFilters.dataCriacaoInicio || ''}
                onChange={(e) => handleChange('dataCriacaoInicio', e.target.value || undefined)}
              />
              <Input
                type="date"
                value={localFilters.dataCriacaoFim || ''}
                onChange={(e) => handleChange('dataCriacaoFim', e.target.value || undefined)}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Limpar
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ContatosFiltersSheet;
