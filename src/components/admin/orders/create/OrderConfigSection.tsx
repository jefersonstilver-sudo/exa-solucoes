import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PasswordInput } from '@/components/ui/password-input';
import { AdminOrderFormData } from '@/hooks/useAdminCreateOrder';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Building2, Search, CheckSquare, Square, ShieldAlert } from 'lucide-react';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { toast } from 'sonner';

interface OrderConfigSectionProps {
  formData: AdminOrderFormData;
  updateField: <K extends keyof AdminOrderFormData>(key: K, value: AdminOrderFormData[K]) => void;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sanitizeBuildingId = (rawId: any): string | null => {
  if (typeof rawId === 'string') {
    return UUID_REGEX.test(rawId) ? rawId : null;
  }
  if (typeof rawId === 'object' && rawId !== null) {
    const extracted = rawId.building_id || rawId.id;
    return typeof extracted === 'string' && UUID_REGEX.test(extracted) ? extracted : null;
  }
  return null;
};

const OrderConfigSection: React.FC<OrderConfigSectionProps> = ({ formData, updateField }) => {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [buildingSearch, setBuildingSearch] = useState('');
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const { logActivity } = useActivityLogger();

  const handleStatusChange = (newStatus: string) => {
    // TODO: Reativar validação de senha admin para status pago
    updateField('statusInicial', newStatus);
  };

  const handlePasswordConfirm = async () => {
    if (!adminPassword.trim()) {
      toast.error('Digite a senha do admin master');
      return;
    }
    setVerifyingPassword(true);
    try {
      const { data, error } = await supabase.rpc('validate_developer_token', {
        p_token: adminPassword,
      });
      if (error || data !== true) {
        toast.error('Senha inválida. Acesso negado.');
        return;
      }
      // Password valid — apply status
      if (pendingStatus) {
        updateField('statusInicial', pendingStatus);
        toast.success(`Status "${pendingStatus === 'pago_pendente_video' ? 'Pago (Aguard. Vídeo)' : 'Pago'}" autorizado`);
        logActivity('admin_authorize_paid_status', 'pedido', undefined, {
          authorized_status: pendingStatus,
        });
      }
      setShowPasswordDialog(false);
      setAdminPassword('');
      setPendingStatus(null);
    } catch (err) {
      toast.error('Erro ao validar senha');
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordDialog(false);
    setAdminPassword('');
    setPendingStatus(null);
    // revert to pendente
    updateField('statusInicial', 'pendente');
  };

  // Auto-fix: sanitize listaPredios — remove non-UUID entries
  useEffect(() => {
    if (formData.listaPredios.length === 0) return;
    const clean = formData.listaPredios
      .map(sanitizeBuildingId)
      .filter((id): id is string => id !== null);
    if (clean.length !== formData.listaPredios.length || clean.some((id, i) => id !== formData.listaPredios[i])) {
      console.log('🧹 Auto-fix listaPredios:', formData.listaPredios, '→', clean);
      updateField('listaPredios', clean);
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
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar prédio..."
              value={buildingSearch}
              onChange={e => setBuildingSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs whitespace-nowrap"
            onClick={() => {
              const filteredIds = filteredBuildings.map(b => b.id);
              const allSelected = filteredIds.length > 0 && filteredIds.every(id => formData.listaPredios.includes(id));
              if (allSelected) {
                updateField('listaPredios', formData.listaPredios.filter(id => !filteredIds.includes(id)));
              } else {
                updateField('listaPredios', Array.from(new Set([...formData.listaPredios, ...filteredIds])));
              }
            }}
          >
            {filteredBuildings.length > 0 && filteredBuildings.every(b => formData.listaPredios.includes(b.id))
              ? <><Square className="h-3.5 w-3.5 mr-1" /> Desmarcar Todos</>
              : <><CheckSquare className="h-3.5 w-3.5 mr-1" /> Selecionar Todos</>
            }
          </Button>
        </div>

        <div className="max-h-60 overflow-y-auto border rounded-lg divide-y divide-border">
          {filteredBuildings.map(b => {
            const isSelected = formData.listaPredios.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleBuilding(b.id)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-accent border-l-2 border-l-transparent'
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  readOnly
                  tabIndex={-1}
                  className="pointer-events-none h-4 w-4"
                />
                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>{b.nome}</span>
                <span className="text-xs text-muted-foreground ml-auto">{b.bairro}</span>
                {b.codigo_predio && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{b.codigo_predio}</span>}
              </button>
            );
          })}
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
          <Select value={formData.statusInicial} onValueChange={handleStatusChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago_pendente_video">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                  Pago (Aguard. Vídeo)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Admin password dialog for paid status */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => { if (!open) handlePasswordCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Autorização Necessária
            </DialogTitle>
            <DialogDescription>
              Marcar um pedido como <strong>pago manualmente</strong> requer a senha do admin master. 
              Esta ação será registrada nos logs de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Senha Admin Master</Label>
            <PasswordInput
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Digite a senha..."
              onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordConfirm(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePasswordCancel} disabled={verifyingPassword}>
              Cancelar
            </Button>
            <Button onClick={handlePasswordConfirm} disabled={verifyingPassword}>
              {verifyingPassword ? 'Verificando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
