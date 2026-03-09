import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, CheckCircle, Loader2, Monitor, Smartphone, FileText, Building2 } from 'lucide-react';
import { AdminOrderFormData } from '@/hooks/useAdminCreateOrder';

interface ClientSearchSectionProps {
  formData: AdminOrderFormData;
  updateField: <K extends keyof AdminOrderFormData>(key: K, value: AdminOrderFormData[K]) => void;
  searchClients: (term: string) => Promise<any[]>;
  searchProposals: (term: string) => Promise<any[]>;
  activateAccount: (email: string) => Promise<any>;
  createAccount: () => Promise<any>;
  checkAccountStatus?: (emailOrId: string, isEmail?: boolean) => Promise<{ exists: boolean; active: boolean; userId?: string }>;
}

const ClientSearchSection: React.FC<ClientSearchSectionProps> = ({
  formData, updateField, searchClients, searchProposals, activateAccount, createAccount, checkAccountStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [proposalResults, setProposalResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activating, setActivating] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) { setResults([]); setProposalResults([]); return; }
    setSearching(true);
    try {
      const [clients, proposals] = await Promise.all([
        searchClients(term),
        searchProposals(term)
      ]);
      setResults(clients);
      setProposalResults(proposals);
    } finally {
      setSearching(false);
    }
  }, [searchClients, searchProposals]);

  const selectClient = async (client: any) => {
    updateField('clientId', client.id);
    updateField('clientName', client.nome || `${client.primeiro_nome || ''} ${client.sobrenome || ''}`.trim());
    updateField('clientEmail', client.email || '');
    updateField('clientPhone', client.telefone || '');
    
    // Check account activation status via edge function
    if (checkAccountStatus) {
      const status = await checkAccountStatus(client.id);
      updateField('clientAccountActive', status.active);
    }
    
    setResults([]);
    setProposalResults([]);
    setSearchTerm('');
  };

  const selectProposal = async (proposal: any) => {
    updateField('proposalId', proposal.id);
    updateField('clientName', proposal.client_name || '');
    updateField('clientEmail', proposal.client_email || '');
    updateField('clientPhone', proposal.client_phone || '');
    
    // Auto-fill product type
    if (proposal.tipo_produto) {
      updateField('tipoProduto', proposal.tipo_produto);
    }
    
    // Auto-fill duration
    if (proposal.duration_months) {
      updateField('planoMeses', proposal.duration_months);
    }
    
    // Auto-fill value
    const valor = proposal.cash_total_value || 0;
    updateField('valorTotal', valor);
    
    // Auto-fill buildings from selected_buildings
    if (proposal.selected_buildings) {
      try {
        let buildings: string[] = [];
        const rawBuildings = typeof proposal.selected_buildings === 'string'
          ? JSON.parse(proposal.selected_buildings)
          : proposal.selected_buildings;
        
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        buildings = (Array.isArray(rawBuildings) ? rawBuildings : [])
          .map((b: any) => {
            if (typeof b === 'string') return b;
            return b?.building_id || b?.id || null;
          })
          .filter((id): id is string => typeof id === 'string' && UUID_REGEX.test(id));
        
        console.log('🏢 Buildings extraídos (IDs limpos):', buildings);
        if (buildings.length > 0) {
          updateField('listaPredios', buildings);
        }
      } catch (e) {
        console.error('Erro ao parsear selected_buildings:', e);
      }
    }
    
    // Check if client already has an active account
    if (proposal.client_email && checkAccountStatus) {
      const status = await checkAccountStatus(proposal.client_email, true);
      if (status.exists) {
        updateField('clientId', status.userId || null);
        updateField('clientAccountActive', status.active);
      } else {
        updateField('clientId', null);
        updateField('clientAccountActive', null);
      }
    }
    
    setResults([]);
    setProposalResults([]);
    setSearchTerm('');
    toast.success('Proposta carregada com sucesso', {
      description: 'Prédios, valores e dados do cliente foram preenchidos automaticamente.',
    });
  };

  const handleActivate = async () => {
    if (!formData.clientEmail) return;
    setActivating(true);
    try { await activateAccount(formData.clientEmail); } finally { setActivating(false); }
  };

  const handleCreate = async () => {
    setCreating(true);
    try { await createAccount(); } finally { setCreating(false); }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'enviada': return { label: 'Enviada', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'rascunho': return { label: 'Rascunho', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
      case 'visualizada': return { label: 'Visualizada', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' };
      case 'visualizando': return { label: 'Visualizando', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
      case 'atualizada': return { label: 'Atualizada', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
      default: return { label: status, className: 'bg-muted text-muted-foreground' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Label className="text-sm font-medium mb-1.5 block">Buscar Cliente ou Proposta</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome, email, empresa ou nº da proposta..."
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
        </div>
        
        {/* Results dropdown */}
        {(results.length > 0 || proposalResults.length > 0) && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {results.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Clientes</div>
                {results.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectClient(c)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.nome || c.email}</span>
                      {c.empresa_nome && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c.empresa_nome}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </button>
                ))}
              </>
            )}
            {proposalResults.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase border-t">Propostas</div>
                {proposalResults.map(p => {
                  const statusInfo = getStatusLabel(p.status);
                  const valor = p.cash_total_value || 0;
                  const buildingsCount = (() => {
                    try {
                      if (Array.isArray(p.selected_buildings)) return p.selected_buildings.length;
                      if (typeof p.selected_buildings === 'string') return JSON.parse(p.selected_buildings).length;
                    } catch { /* ignore */ }
                    return 0;
                  })();

                  return (
                    <button
                      key={p.id}
                      onClick={() => selectProposal(p)}
                      className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {p.number && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                            <FileText className="h-2.5 w-2.5 mr-1" />
                            {p.number}
                          </Badge>
                        )}
                        <span className="text-sm font-medium">{p.client_name}</span>
                        {p.client_company_name && (
                          <span className="text-xs text-muted-foreground">({p.client_company_name})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Tipo produto */}
                        {p.tipo_produto === 'vertical_premium' ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200">
                            <Smartphone className="h-2.5 w-2.5 mr-0.5" /> Vertical
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200">
                            <Monitor className="h-2.5 w-2.5 mr-0.5" /> Horizontal
                          </Badge>
                        )}
                        {/* Duração */}
                        {p.duration_months && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {p.duration_months} {p.duration_months === 1 ? 'mês' : 'meses'}
                          </Badge>
                        )}
                        {/* Prédios */}
                        {buildingsCount > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <Building2 className="h-2.5 w-2.5 mr-0.5" />
                            {buildingsCount} {buildingsCount === 1 ? 'prédio' : 'prédios'}
                          </Badge>
                        )}
                        {/* Valor */}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold">
                          {formatCurrency(valor)}
                        </Badge>
                        {/* Status */}
                        <Badge className={`text-[10px] px-1.5 py-0 ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Client selected indicator */}
      {formData.clientId && (
        <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          <span>Cliente vinculado: <strong>{formData.clientName}</strong></span>
        </div>
      )}

      {/* Proposal selected indicator */}
      {formData.proposalId && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-400">
          <FileText className="h-4 w-4" />
          <span>Proposta vinculada — prédios e valores carregados automaticamente</span>
        </div>
      )}

      {/* Manual fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Nome Completo *</Label>
          <Input value={formData.clientName} onChange={e => updateField('clientName', e.target.value)} />
        </div>
        <div>
          <Label className="text-sm">Email *</Label>
          <Input type="email" value={formData.clientEmail} onChange={e => updateField('clientEmail', e.target.value)} />
        </div>
        <div>
          <Label className="text-sm">Telefone</Label>
          <Input value={formData.clientPhone} onChange={e => updateField('clientPhone', e.target.value)} />
        </div>
        <div>
          <Label className="text-sm">CPF/CNPJ</Label>
          <Input value={formData.clientDocument} onChange={e => updateField('clientDocument', e.target.value)} />
        </div>
      </div>

      {/* Account actions — conditional logic */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Criar Conta — only when no clientId exists */}
        {formData.clientEmail && !formData.clientId && (
          <Button variant="outline" size="sm" onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
            Criar Conta
          </Button>
        )}
        
        {/* Ativar Conta — only when clientId exists but account is NOT active */}
        {formData.clientEmail && formData.clientId && formData.clientAccountActive === false && (
          <Button variant="outline" size="sm" onClick={handleActivate} disabled={activating}>
            {activating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
            Ativar Conta
          </Button>
        )}

        {/* Conta Ativa badge — when account is confirmed */}
        {formData.clientId && formData.clientAccountActive === true && (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conta Ativa
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ClientSearchSection;
