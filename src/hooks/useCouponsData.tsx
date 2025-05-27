
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
      setCoupons(data || []);
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

  // Criar novo cupom
  const createCoupon = async (couponData: CreateCouponData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cupons')
        .insert({
          ...couponData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: 'Cupom criado com sucesso!',
        description: `O cupom ${couponData.codigo} foi criado.`,
      });

      await fetchCoupons();
      await fetchStats();
      return true;
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      toast({
        title: 'Erro ao criar cupom',
        description: 'Não foi possível criar o cupom. Verifique os dados.',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Atualizar cupom
  const updateCoupon = async (id: string, updates: Partial<Coupon>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cupons')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Cupom atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });

      await fetchCoupons();
      await fetchStats();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      toast({
        title: 'Erro ao atualizar cupom',
        description: 'Não foi possível salvar as alterações.',
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
    getCouponUsageDetails
  };
};
