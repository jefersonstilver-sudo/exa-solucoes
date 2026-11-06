
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Coupon, CouponStats, CouponUsageDetail, CreateCouponData, CouponFilters } from '@/types/coupon';

export const useCouponsData = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<CouponFilters>({
    status: 'all',
    categoria: 'all',
    searchTerm: ''
  });
  const { toast } = useToast();

  // Buscar todos os cupons
  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Garantir que os tipos sejam corretos
      const normalizedData = (data || []).map(coupon => ({
        ...coupon,
        tipo_desconto: (coupon.tipo_desconto as any) || 'percentual',
        tipo_produto: (coupon.tipo_produto as any) || 'ambos',
        modo_predios: (coupon.modo_predios as any) || 'todos',
        predios_fora_da_lista: (coupon.predios_fora_da_lista as any) || 'bloquear',
        desconto_percentual: Number(coupon.desconto_percentual) || 0,
        categoria: coupon.categoria as 'geral' | 'especial' | 'primeiro_pedido' | 'fidelidade' | 'promocional' | 'parceiro' | 'cortesia'
      }));
      
      setCoupons(normalizedData);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
      toast({
        title: 'Erro ao carregar cupons',
        description: 'Não foi possível carregar a lista de cupons.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar estatísticas
  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_coupon_stats');
      if (error) throw error;
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  // Gerar código automático
  const generateCouponCode = async (prefix: string = 'INDEXA'): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_coupon_code', { prefix });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      throw new Error('Erro ao gerar código do cupom');
    }
  };

  const syncPredios = async (cupomId: string, modo: string | undefined, ids: string[] | undefined) => {
    const db = supabase as any;
    const { error: delErr } = await db.from('cupom_predios').delete().eq('cupom_id', cupomId);
    if (delErr) throw delErr;
    if ((modo === 'especificos' || modo === 'combinado') && ids && ids.length > 0) {
      const { error } = await db.from('cupom_predios').insert(ids.map(building_id => ({ cupom_id: cupomId, building_id })));
      if (error) throw error;
    }
  };

  const validateLocal = (d: Partial<CreateCouponData>): string | null => {
    if ((d.modo_predios === 'especificos' || d.modo_predios === 'combinado') && (!d.predio_ids || d.predio_ids.length === 0)) {
      return 'Escolha ao menos um prédio para este cupom.';
    }
    if (d.modo_predios === 'combinado' && d.max_predios && d.predio_ids && d.max_predios > d.predio_ids.length) {
      return 'A quantidade máxima não pode passar do número de prédios escolhidos.';
    }
    return null;
  };

  // Buscar prédios de um cupom
  const getCouponBuildings = async (cupomId: string): Promise<string[]> => {
    const { data } = await (supabase as any).from('cupom_predios').select('building_id').eq('cupom_id', cupomId);
    return (data || []).map((r: any) => r.building_id);
  };

  // Criar novo cupom
  const createCoupon = async (couponData: CreateCouponData): Promise<boolean> => {
    try {
      if (!couponData.codigo) throw new Error('Código do cupom é obrigatório');
      const localErr = validateLocal(couponData);
      if (localErr) throw new Error(localErr);
      const { predio_ids, ...row } = couponData;

      const { data, error } = await (supabase as any).from('cupons').insert(row).select('id').single();
      if (error) throw error;
      await syncPredios(data.id, row.modo_predios, predio_ids);

      toast({ title: 'Cupom criado com sucesso!', description: `O cupom ${couponData.codigo} foi criado.` });
      await fetchCoupons();
      await fetchStats();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar cupom:', error);
      toast({
        title: 'Erro ao criar cupom',
        description: error?.code === '23505' ? 'Já existe um cupom com este código.' : (error?.message || 'Verifique os dados.'),
        variant: 'destructive'
      });
      return false;
    }
  };

  // Atualizar cupom
  const updateCoupon = async (id: string, updates: Partial<CreateCouponData>): Promise<boolean> => {
    try {
      const { predio_ids, ...row } = updates;
      const hasScope = 'modo_predios' in updates;
      if (hasScope) {
        const localErr = validateLocal(updates);
        if (localErr) throw new Error(localErr);
      }
      const { error } = await (supabase as any).from('cupons').update(row).eq('id', id);
      if (error) throw error;
      if (hasScope) await syncPredios(id, row.modo_predios, predio_ids);

      toast({ title: 'Cupom atualizado!', description: 'As alterações foram salvas com sucesso.' });
      await fetchCoupons();
      await fetchStats();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar cupom:', error);
      toast({
        title: 'Erro ao atualizar cupom',
        description: error?.code === '23505' ? 'Já existe um cupom com este código.' : (error?.message || 'Não foi possível salvar.'),
        variant: 'destructive'
      });
      return false;
    }
  };

  // Deletar cupom
  const deleteCoupon = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Cupom deletado!',
        description: 'O cupom foi removido permanentemente.',
      });

      await fetchCoupons();
      await fetchStats();
      return true;
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
      toast({
        title: 'Erro ao deletar cupom',
        description: 'Não foi possível deletar o cupom.',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Obter detalhes de uso de um cupom
  const getCouponUsageDetails = async (couponId: string): Promise<CouponUsageDetail[]> => {
    try {
      const { data, error } = await supabase.rpc('get_coupon_usage_details', { 
        cupom_id_param: couponId 
      });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar detalhes de uso:', error);
      return [];
    }
  };

  // Filtrar cupons
  const filteredCoupons = coupons.filter(coupon => {
    // Filtro por status
    if (filters.status !== 'all') {
      const now = new Date();
      const isExpired = coupon.expira_em && new Date(coupon.expira_em) <= now;
      
      if (filters.status === 'active' && (!coupon.ativo || isExpired)) return false;
      if (filters.status === 'inactive' && coupon.ativo && !isExpired) return false;
      if (filters.status === 'expired' && !isExpired) return false;
    }

    // Filtro por categoria
    if (filters.categoria !== 'all' && coupon.categoria !== filters.categoria) {
      return false;
    }

    // Filtro por termo de busca
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        coupon.codigo.toLowerCase().includes(searchLower) ||
        coupon.descricao?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  useEffect(() => {
    fetchCoupons();
    fetchStats();
  }, []);

  return {
    coupons: filteredCoupons,
    allCoupons: coupons,
    stats,
    isLoading,
    filters,
    setFilters,
    fetchCoupons,
    fetchStats,
    generateCouponCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getCouponUsageDetails,
    getCouponBuildings
  };
};
