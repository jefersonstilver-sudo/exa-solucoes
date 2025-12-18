
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, RefreshCw, Ticket } from 'lucide-react';
import { useCouponsData } from '@/hooks/useCouponsData';
import CouponStatsCards from '@/components/admin/coupons/CouponStatsCards';
import CouponFiltersComponent from '@/components/admin/coupons/CouponFilters';
import CouponsTable from '@/components/admin/coupons/CouponsTable';
import CouponFormDialog from '@/components/admin/coupons/CouponFormDialog';
import { Coupon } from '@/types/coupon';
import { useQueryClient } from '@tanstack/react-query';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useAuth } from '@/hooks/useAuth';

const CouponsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isMobile } = useAdvancedResponsive();
  const { isSuperAdmin } = useAuth();
  
  const {
    coupons,
    stats,
    isLoading,
    filters,
    setFilters,
    generateCouponCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getCouponUsageDetails
  } = useCouponsData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['coupons'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setIsFormOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingCoupon) {
      return await updateCoupon(editingCoupon.id, data);
    } else {
      return await createCoupon(data);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    await updateCoupon(id, { ativo: newStatus });
  };

  const exportCoupons = () => {
    const csvContent = [
      ['Código', 'Categoria', 'Desconto (%)', 'Usos Atuais', 'Máximo Usos', 'Status', 'Expiração'],
      ...coupons.map(coupon => [
        coupon.codigo,
        coupon.categoria,
        coupon.desconto_percentual.toString(),
        coupon.usos_atuais.toString(),
        coupon.max_usos.toString(),
        coupon.ativo ? 'Ativo' : 'Inativo',
        coupon.expira_em || 'Sem expiração'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cupons_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 pb-24">
        {/* Mobile Header Glassmorphism */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-sm">
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-sm">
                  <Ticket className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-foreground">Cupons</h1>
                  <p className="text-[10px] text-muted-foreground">Gestão de descontos</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={exportCoupons}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[#9C1E1E] hover:bg-[#7a1717] text-white h-8 px-3"
                  onClick={handleCreateCoupon}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="px-3 pb-2.5 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 whitespace-nowrap pb-0.5">
              <button 
                onClick={() => setFilters({...filters, status: 'all'})}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium min-w-fit transition-all ${
                  filters.status === 'all' 
                    ? 'bg-[#9C1E1E] text-white shadow-sm' 
                    : 'bg-white/80 text-muted-foreground border border-gray-200'
                }`}
              >
                Todos {stats?.total_cupons || 0}
              </button>
              <button 
                onClick={() => setFilters({...filters, status: 'active'})}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium min-w-fit transition-all ${
                  filters.status === 'active' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-white/80 text-muted-foreground border border-gray-200'
                }`}
              >
                ✓ Ativos {stats?.cupons_ativos || 0}
              </button>
              <button 
                onClick={() => setFilters({...filters, status: 'inactive'})}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium min-w-fit transition-all ${
                  filters.status === 'inactive' 
                    ? 'bg-gray-600 text-white shadow-sm' 
                    : 'bg-white/80 text-muted-foreground border border-gray-200'
                }`}
              >
                ○ Inativos
              </button>
              <button 
                onClick={() => setFilters({...filters, status: 'expired'})}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium min-w-fit transition-all ${
                  filters.status === 'expired' 
                    ? 'bg-red-600 text-white shadow-sm' 
                    : 'bg-white/80 text-muted-foreground border border-gray-200'
                }`}
              >
                ⏰ Expirados {stats?.cupons_expirados || 0}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 pt-3">
          {/* Stats Grid 2x2 */}
          <CouponStatsCards stats={stats} isLoading={isLoading} />

          {/* Filtros Mobile */}
          <div className="px-3">
            <CouponFiltersComponent filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Lista de Cupons */}
          <CouponsTable
            coupons={coupons}
            isLoading={isLoading}
            onEdit={handleEditCoupon}
            onDelete={deleteCoupon}
            onToggleStatus={handleToggleStatus}
            onViewUsage={getCouponUsageDetails}
            isSuperAdmin={isSuperAdmin}
          />
        </div>

        {/* Dialog de Criação/Edição */}
        <CouponFormDialog
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          onGenerateCode={generateCouponCode}
          editingCoupon={editingCoupon}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="container mx-auto py-6 space-y-8 min-h-screen pb-24">
      {/* Header com título e ações */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Cupons</h1>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie cupons de desconto para os usuários
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
            title="Atualizar dados"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={exportCoupons} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={handleCreateCoupon} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Cupom
          </Button>
        </div>
      </div>

      {/* Estatísticas - com margem adequada */}
      <div className="w-full">
        <CouponStatsCards stats={stats} isLoading={isLoading} />
      </div>

      {/* Lista de Cupons - card com padding interno */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Cupons Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          {/* Filtros com espaçamento */}
          <div className="w-full">
            <CouponFiltersComponent filters={filters} onFiltersChange={setFilters} />
          </div>
          
          {/* Tabela com scroll horizontal em mobile */}
          <div className="w-full overflow-x-auto">
            <CouponsTable
              coupons={coupons}
              isLoading={isLoading}
              onEdit={handleEditCoupon}
              onDelete={deleteCoupon}
              onToggleStatus={handleToggleStatus}
              onViewUsage={getCouponUsageDetails}
              isSuperAdmin={isSuperAdmin}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <CouponFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        onGenerateCode={generateCouponCode}
        editingCoupon={editingCoupon}
      />
    </div>
  );
};

export default CouponsPage;
