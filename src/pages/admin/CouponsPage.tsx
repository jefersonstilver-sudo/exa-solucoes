
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { useCouponsData } from '@/hooks/useCouponsData';
import CouponStatsCards from '@/components/admin/coupons/CouponStatsCards';
import CouponFiltersComponent from '@/components/admin/coupons/CouponFilters';
import CouponsTable from '@/components/admin/coupons/CouponsTable';
import CouponFormDialog from '@/components/admin/coupons/CouponFormDialog';
import { Coupon } from '@/types/coupon';

const CouponsPage: React.FC = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Cupons</h1>
          <p className="text-muted-foreground">
            Crie e gerencie cupons de desconto para os usuários
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCoupons}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={handleCreateCoupon}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cupom
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <CouponStatsCards stats={stats} isLoading={isLoading} />

      {/* Lista de Cupons */}
      <Card>
        <CardHeader>
          <CardTitle>Cupons Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CouponFiltersComponent filters={filters} onFiltersChange={setFilters} />
          
          <CouponsTable
            coupons={coupons}
            isLoading={isLoading}
            onEdit={handleEditCoupon}
            onDelete={deleteCoupon}
            onToggleStatus={handleToggleStatus}
            onViewUsage={getCouponUsageDetails}
          />
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
