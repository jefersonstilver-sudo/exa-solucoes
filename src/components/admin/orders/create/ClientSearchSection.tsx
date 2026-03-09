import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import { AdminOrderFormData } from '@/hooks/useAdminCreateOrder';

interface ClientSearchSectionProps {
  formData: AdminOrderFormData;
  updateField: <K extends keyof AdminOrderFormData>(key: K, value: AdminOrderFormData[K]) => void;
  searchClients: (term: string) => Promise<any[]>;
  searchProposals: (term: string) => Promise<any[]>;
  activateAccount: (email: string) => Promise<any>;
  createAccount: () => Promise<any>;
}

const ClientSearchSection: React.FC<ClientSearchSectionProps> = ({
  formData, updateField, searchClients, searchProposals, activateAccount, createAccount
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

  const selectClient = (client: any) => {
    updateField('clientId', client.id);
    updateField('clientName', client.nome || `${client.primeiro_nome || ''} ${client.sobrenome || ''}`.trim());
    updateField('clientEmail', client.email || '');
    updateField('clientPhone', client.telefone || '');
    setResults([]);
    setProposalResults([]);
    setSearchTerm('');
  };

  const selectProposal = (proposal: any) => {
    updateField('proposalId', proposal.id);
    updateField('clientName', proposal.client_name || '');
    updateField('clientEmail', proposal.client_email || '');
    updateField('clientPhone', proposal.client_phone || '');
    updateField('valorTotal', proposal.total_amount || 0);
    setResults([]);
    setProposalResults([]);
    setSearchTerm('');
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

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Label className="text-sm font-medium mb-1.5 block">Buscar Cliente ou Proposta</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome, email..."
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
        </div>
        
        {/* Results dropdown */}
        {(results.length > 0 || proposalResults.length > 0) && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {results.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Clientes</div>
                {results.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectClient(c)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                  >
                    <span className="font-medium">{c.nome || c.email}</span>
                    <span className="text-muted-foreground ml-2">{c.email}</span>
                  </button>
                ))}
              </>
            )}
            {proposalResults.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase border-t">Propostas</div>
                {proposalResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectProposal(p)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                  >
                    <span className="font-medium">{p.client_name}</span>
                    <span className="text-muted-foreground ml-2">R$ {p.total_amount?.toLocaleString('pt-BR')}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${p.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status}
                    </span>
                  </button>
                ))}
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

      {/* Account actions */}
      <div className="flex gap-2 flex-wrap">
        {formData.clientEmail && !formData.clientId && (
          <Button variant="outline" size="sm" onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
            Criar Conta
          </Button>
        )}
        {formData.clientEmail && formData.clientId && (
          <Button variant="outline" size="sm" onClick={handleActivate} disabled={activating}>
            {activating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
            Ativar Conta
          </Button>
        )}
      </div>
    </div>
  );
};

export default ClientSearchSection;
