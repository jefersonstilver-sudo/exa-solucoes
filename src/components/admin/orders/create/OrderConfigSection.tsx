import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminOrderFormData } from '@/hooks/useAdminCreateOrder';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Building2, Search, X } from 'lucide-react';
import { useActivityLogger } from '@/hooks/useActivityLogger';

interface OrderConfigSectionProps {
  formData: AdminOrderFormData;
  updateField: <K extends keyof AdminOrderFormData>(key: K, value: AdminOrderFormData[K]) => void;
}

const sanitizeBuildingId = (rawId: any): string | null => {
  if (typeof rawId === 'string' && rawId.length > 10) return rawId;
  if (typeof rawId === 'object' && rawId !== null) {
    return rawId.building_id || rawId.id || null;
  }
  return null;
};

const OrderConfigSection: React.FC<OrderConfigSectionProps> = ({ formData, updateField }) => {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [buildingSearch, setBuildingSearch] = useState('');
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const { logActivity } = useActivityLogger();

  // Auto-fix: sanitize listaPredios if it contains objects
  useEffect(() => {
    const hasObjects = formData.listaPredios.some(id => typeof id !== 'string' || id.length <= 10);
    if (hasObjects && formData.listaPredios.length > 0) {
      const clean = formData.listaPredios
        .map(sanitizeBuildingId)
        .filter((id): id is string => id !== null);
      if (clean.length > 0) {
        updateField('listaPredios', clean);
      }
    }
  }, [formData.listaPredios]);

  // Fetch buildings
  useEffect(() => {
    const fetchBuildings = async () => {
      setLoadingBuildings(true);
      const { data } = await supabase
        .from('buildings')
        .select('id, nome, bairro, codigo_predio')
        .eq('status', 'ativo')
        .order('nome');
      setBuildings(data || []);
      setLoadingBuildings(false);
    };
    fetchBuildings();
  }, []);

  const filteredBuildings = buildings.filter(b =>
    !buildingSearch || b.nome.toLowerCase().includes(buildingSearch.toLowerCase()) || b.bairro?.toLowerCase().includes(buildingSearch.toLowerCase())
  );

  const toggleBuilding = (buildingId: string) => {
    const current = formData.listaPredios;
    const building = buildings.find(b => b.id === buildingId);
    const buildingName = building?.nome || buildingId;

    if (current.includes(buildingId)) {
      // Removing
      const updated = current.filter(id => id !== buildingId);
      updateField('listaPredios', updated);
      logActivity('remove_building', 'pedido', buildingId, {
        action: 'Prédio removido do pedido',
        building_name: buildingName,
        building_code: building?.codigo_predio,
        remaining_count: updated.length,
      });
    } else {
      // Adding
      const updated = [...current, buildingId];
      updateField('listaPredios', updated);
      logActivity('add_building', 'pedido', buildingId, {
        action: 'Prédio adicionado ao pedido',
        building_name: buildingName,
        building_code: building?.codigo_predio,
        total_count: updated.length,
      });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateField('logoFile', file);
  };

  // Auto-calculate end date
  useEffect(() => {
    if (formData.dataInicio && formData.planoMeses) {
      const start = new Date(formData.dataInicio);
      start.setMonth(start.getMonth() + formData.planoMeses);
      updateField('dataFim', start.toISOString().split('T')[0]);
    }
  }, [formData.dataInicio, formData.planoMeses]);

  return (
    <div className="space-y-5">
      {/* Buildings multi-select */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          Prédios * 
          {formData.listaPredios.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({formData.listaPredios.length} selecionado{formData.listaPredios.length !== 1 ? 's' : ''})
            </span>
          )}
        </Label>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar prédio..."
            value={buildingSearch}
            onChange={e => setBuildingSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        
        {/* Selected buildings list */}
        {formData.listaPredios.length > 0 && (
          <div className="flex flex-col gap-1 mb-2 border rounded-lg p-2 bg-muted/30">
            <span className="text-xs text-muted-foreground font-medium mb-1">
              {formData.listaPredios.length} prédio(s) selecionado(s)
            </span>
            {formData.listaPredios.map(rawId => {
              const idStr = sanitizeBuildingId(rawId) || String(rawId);
              const b = buildings.find(x => x.id === idStr);
              return (
                <div key={idStr} className="flex items-center justify-between px-2 py-1.5 bg-background rounded border text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{b?.nome || idStr.slice(0, 8)}</span>
                    {b?.bairro && <span className="text-xs text-muted-foreground">- {b.bairro}</span>}
                  </div>
                  <button type="button" onClick={() => toggleBuilding(idStr)} className="ml-2 text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="max-h-40 overflow-y-auto border rounded-lg">
          {filteredBuildings.slice(0, 30).map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => toggleBuilding(b.id)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-accent transition-colors ${
                formData.listaPredios.some(rid => sanitizeBuildingId(rid) === b.id) ? 'bg-primary/5 font-medium' : ''
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{b.nome}</span>
              <span className="text-xs text-muted-foreground ml-auto">{b.bairro}</span>
              {b.codigo_predio && <span className="text-[10px] bg-muted px-1 rounded">{b.codigo_predio}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan, dates, value */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-sm">Plano (meses) *</Label>
          <Select value={String(formData.planoMeses)} onValueChange={v => updateField('planoMeses', parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 mês</SelectItem>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Data Início</Label>
          <Input type="date" value={formData.dataInicio} onChange={e => updateField('dataInicio', e.target.value)} />
        </div>
        <div>
          <Label className="text-sm">Data Fim</Label>
          <Input type="date" value={formData.dataFim} onChange={e => updateField('dataFim', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-sm">Valor Total (R$) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.valorTotal || ''}
            onChange={e => updateField('valorTotal', parseFloat(e.target.value) || 0)}
            placeholder="0,00"
          />
        </div>
        <div>
          <Label className="text-sm">Método Pagamento</Label>
          <Select value={formData.metodoPagamento} onValueChange={v => updateField('metodoPagamento', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pix_avista">PIX à Vista</SelectItem>
              <SelectItem value="cartao">Cartão</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="transferencia">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Status Inicial</Label>
          <Select value={formData.statusInicial} onValueChange={v => updateField('statusInicial', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pago_pendente_video">Pago (Aguard. Vídeo)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logo upload */}
      <div>
        <Label className="text-sm">Logo do Cliente</Label>
        <div className="mt-1.5">
          <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            {formData.logoFile ? formData.logoFile.name : 'Selecionar logo...'}
            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default OrderConfigSection;
