import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, MapPin, Search, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LocalImage } from './ImageGallery3';

export interface ImportedFormData {
  nome: string;
  endereco: string;
  bairro: string;
  venue_type: string;
  numero_unidades: number | '';
  numero_andares: number | '';
  numero_blocos: number | '';
  nome_sindico: string;
  contato_sindico: string;
  nome_vice_sindico: string;
  contato_vice_sindico: string;
  nome_contato_predio: string;
  numero_contato_predio: string;
  caracteristicas: string[];
  preco_base: number | '';
  preco_trimestral: number | '';
  preco_semestral: number | '';
  preco_anual: number | '';
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onImport: (data: Partial<ImportedFormData>, images: LocalImage[], sourceId: string) => void;
}

interface Cadastro {
  id: string;
  nome: string | null;
  endereco: string;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  tipo_predio: string | null;
  numero_unidades: number | null;
  numero_andares: number | null;
  numero_blocos: number | null;
  sindico_nome: string | null;
  sindico_contato: string | null;
  vice_sindico_nome: string | null;
  vice_sindico_contato: string | null;
  contato_portaria: string | null;
  telefone_principal: string | null;
  caracteristicas: string[] | null;
  fotos_urls: string[] | null;
  valor_mensal: number | null;
  valor_trimestral: number | null;
  valor_semestral: number | null;
  valor_anual: number | null;
  created_at: string;
}

const ImportarFormularioDialog: React.FC<Props> = ({ open, onOpenChange, onImport }) => {
  const [items, setItems] = useState<Cadastro[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('predios_cadastro_externo')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) toast.error('Erro ao carregar formulários');
      setItems((data as Cadastro[]) || []);
      setLoading(false);
    })();
  }, [open]);

  const filtered = items.filter(it => {
    if (!q.trim()) return true;
    const s = `${it.nome || ''} ${it.endereco} ${it.bairro || ''} ${it.cidade || ''}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const handlePick = async (it: Cadastro) => {
    setImportingId(it.id);
    try {
      // Fetch fotos and convert to File objects so they're uploaded into building-images
      const images: LocalImage[] = [];
      const urls = (it.fotos_urls || []).slice(0, 4);
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const blob = await res.blob();
          const ext = (blob.type.split('/')[1] || 'jpg').split(';')[0];
          const file = new File([blob], `import-${i + 1}.${ext}`, { type: blob.type });
          images.push({
            id: `${it.id}-${i}-${Date.now()}`,
            file,
            url: URL.createObjectURL(blob),
            isNew: true,
          });
        } catch (e) {
          console.warn('Falha ao importar foto', url, e);
        }
      }

      const enderecoCompleto = [it.endereco, it.cidade, it.estado].filter(Boolean).join(', ');

      const data: Partial<ImportedFormData> = {
        nome: it.nome || '',
        endereco: enderecoCompleto || it.endereco,
        bairro: it.bairro || '',
        venue_type: it.tipo_predio || 'Residencial',
        numero_unidades: it.numero_unidades ?? '',
        numero_andares: it.numero_andares ?? '',
        numero_blocos: it.numero_blocos ?? '',
        nome_sindico: it.sindico_nome || '',
        contato_sindico: it.sindico_contato || '',
        nome_vice_sindico: it.vice_sindico_nome || '',
        contato_vice_sindico: it.vice_sindico_contato || '',
        nome_contato_predio: it.contato_portaria || '',
        numero_contato_predio: it.telefone_principal || '',
        caracteristicas: it.caracteristicas || [],
        preco_base: it.valor_mensal ?? '',
        preco_trimestral: it.valor_trimestral ?? '',
        preco_semestral: it.valor_semestral ?? '',
        preco_anual: it.valor_anual ?? '',
      };

      onImport(data, images);
      toast.success('Formulário importado — revise e salve');
      onOpenChange(false);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#9C1E1E]" />
            Importar formulário preenchido
          </DialogTitle>
          <DialogDescription>
            Escolha um cadastro feito pela equipe para pré-preencher o formulário. Você poderá editar antes de salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, endereço ou cidade..."
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Nenhum formulário encontrado.
            </div>
          ) : (
            filtered.map(it => (
              <button
                key={it.id}
                type="button"
                disabled={!!importingId}
                onClick={() => handlePick(it)}
                className="w-full text-left p-3 rounded-lg border hover:border-[#9C1E1E] hover:bg-muted/40 transition disabled:opacity-50 flex gap-3 items-center"
              >
                <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  {it.fotos_urls && it.fotos_urls[0] ? (
                    <img src={it.fotos_urls[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{it.nome || 'Sem nome'}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{[it.endereco, it.bairro, it.cidade].filter(Boolean).join(' • ')}</span>
                  </div>
                </div>
                {importingId === it.id && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportarFormularioDialog;
