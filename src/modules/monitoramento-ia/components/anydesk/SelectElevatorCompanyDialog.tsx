import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Building2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddElevatorCompanyModal } from './AddElevatorCompanyModal';

interface ElevatorCompany {
  id: string;
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
}

interface SelectElevatorCompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  currentCompanyId?: string | null;
  onCompanySelected: () => void;
}

export const SelectElevatorCompanyDialog = ({
  isOpen,
  onClose,
  deviceId,
  currentCompanyId,
  onCompanySelected,
}: SelectElevatorCompanyDialogProps) => {
  const [companies, setCompanies] = useState<ElevatorCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(currentCompanyId || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
      setSelectedCompanyId(currentCompanyId || null);
    }
  }, [isOpen, currentCompanyId]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome_fantasia, razao_social, cnpj')
        .eq('tipo', 'elevador')
        .order('nome_fantasia', { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas de elevador:', error);
      toast.error('Erro ao carregar empresas de elevador');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('devices')
        .update({ empresa_elevador_id: selectedCompanyId })
        .eq('id', deviceId);

      if (error) throw error;

      toast.success(
        selectedCompanyId
          ? 'Empresa de elevador vinculada com sucesso!'
          : 'Empresa de elevador removida com sucesso!'
      );
      onCompanySelected();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar empresa de elevador:', error);
      toast.error('Erro ao salvar empresa de elevador');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    setSelectedCompanyId(null);
  };

  const handleCompanyAdded = () => {
    loadCompanies();
    setIsAddModalOpen(false);
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      company.razao_social?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Selecionar Empresa de Elevador
            </DialogTitle>
            <DialogDescription>
              Escolha a empresa responsável pela manutenção do elevador deste painel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de empresas */}
            <ScrollArea className="h-[300px] border rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
                  <p className="text-muted-foreground text-sm">
                    {search ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar empresa
                  </Button>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredCompanies.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCompanyId === company.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'hover:bg-muted border-2 border-transparent'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{company.nome_fantasia}</p>
                        {company.razao_social && (
                          <p className="text-xs text-muted-foreground">{company.razao_social}</p>
                        )}
                      </div>
                      {selectedCompanyId === company.id && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Selecionada atualmente */}
            {selectedCompanyId && (
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                    🛗 {companies.find((c) => c.id === selectedCompanyId)?.nome_fantasia}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Nova Empresa
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddElevatorCompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCompanyAdded={handleCompanyAdded}
      />
    </>
  );
};
