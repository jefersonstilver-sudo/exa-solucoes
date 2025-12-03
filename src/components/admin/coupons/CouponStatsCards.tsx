
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, TrendingUp, Users, DollarSign } from 'lucide-react';
import { CouponStats } from '@/types/coupon';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

interface CouponStatsCardsProps {
  stats: CouponStats | null;
  isLoading: boolean;
}

const CouponStatsCards: React.FC<CouponStatsCardsProps> = ({ stats, isLoading }) => {
  const { isMobile } = useAdvancedResponsive();

  if (isLoading) {
    if (isMobile) {
      return (
        <div className="grid grid-cols-2 gap-2 px-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-2.5 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-12 mx-auto mb-1.5"></div>
              <div className="h-5 bg-gray-200 rounded w-8 mx-auto"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Mobile: Compact 2x2 Grid with Glassmorphism
  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-2 px-3">
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-2.5 text-center shadow-sm">
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Total</p>
          <p className="text-lg font-bold text-foreground">{stats.total_cupons}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-2.5 text-center shadow-sm">
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Ativos</p>
          <p className="text-lg font-bold text-emerald-600">{stats.cupons_ativos}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-2.5 text-center shadow-sm">
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Usos</p>
          <p className="text-lg font-bold text-blue-600">{stats.total_usos}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-2.5 text-center shadow-sm">
          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Desconto</p>
          <p className="text-lg font-bold text-[#9C1E1E]">R$ {stats.receita_com_desconto.toFixed(0)}</p>
        </div>
      </div>
    );
  }

  // Desktop: Original Cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-foreground">Total de Cupons</CardTitle>
          <Ticket className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold">{stats.total_cupons}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Cupons criados no sistema
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-foreground">Cupons Ativos</CardTitle>
          <TrendingUp className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-green-600">{stats.cupons_ativos}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <Badge variant="outline" className="text-green-600 border-green-600 text-[10px]">
              {stats.cupons_expirados} expirados
            </Badge>
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-foreground">Total de Usos</CardTitle>
          <Users className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-blue-600">{stats.total_usos}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Aplicações de cupons
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-foreground">Desconto Total</CardTitle>
          <DollarSign className="h-5 w-5 text-[#9C1E1E]" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-[#9C1E1E]">
            R$ {stats.receita_com_desconto.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Em descontos aplicados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponStatsCards;
