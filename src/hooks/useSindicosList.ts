import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SindicoRow {
  id: string;
  protocolo: string | null;
  created_at: string;
  status: string;
  nome_predio: string;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  endereco: string | null;
  cep: string | null;
  endereco_complemento: string | null;
  endereco_latitude: number | null;
  endereco_longitude: number | null;
  endereco_google_place_id: string | null;
  quantidade_andares: number | null;
  quantidade_blocos: number | null;
  quantidade_unidades_total: number | null;
  quantidade_elevadores_sociais: number | null;
  numero_unidades: number | null;
  internet_operadoras: string[] | null;
  empresa_elevador: string | null;
  elevador_casa_maquinas: string | null;
  tipo_predio: 'residencial' | 'comercial' | null;
  permite_airbnb: 'sim' | 'nao' | null;
  sindico_nome: string | null;
  sindico_cpf: string | null;
  sindico_whatsapp: string | null;
  sindico_email: string | null;
  sindico_mandato_ate: string | null;
  nome_completo: string | null;
  email: string | null;
  celular: string | null;
  aceite_timestamp: string | null;
  aceite_ip: string | null;
  aceite_user_agent: string | null;
  aceite_pdf_url: string | null;
  aceite_hash: string | null;
  fotos_elevador_urls: string[] | null;
  observacoes_internas: string | null;
  visita_agendada_em: string | null;
  responsavel_id: string | null;
  email_confirmacao_enviado_em: string | null;
  email_confirmacao_message_id: string | null;
  email_confirmacao_erro: string | null;
}

export interface SindicosListFilters {
  search: string;
  status: string; // 'all' ou valor específico
  startDate?: Date;
  endDate?: Date;
}

const PAGE_SIZE = 20;

export function useSindicosList() {
  const [rows, setRows] = useState<SindicoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SindicosListFilters>({
    search: '',
    status: 'all',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sindicos_interessados')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('[useSindicosList] erro:', error);
      setRows([]);
    } else {
      setRows((data ?? []) as SindicoRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('sindicos-list-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sindicos_interessados' },
        () => fetchAll()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (term) {
        const haystack = [
          r.nome_predio,
          r.sindico_nome,
          r.nome_completo,
          r.protocolo,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.startDate) {
        if (new Date(r.created_at) < filters.startDate) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(r.created_at) > end) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return {
    rows: paginated,
    allFiltered: filtered,
    loading,
    filters,
    setFilters: (next: Partial<SindicosListFilters>) => {
      setFilters((prev) => ({ ...prev, ...next }));
      setPage(1);
    },
    clearFilters: () => {
      setFilters({ search: '', status: 'all' });
      setPage(1);
    },
    page: safePage,
    setPage,
    totalPages,
    totalCount: filtered.length,
    pageSize: PAGE_SIZE,
    refetch: fetchAll,
  };
}
