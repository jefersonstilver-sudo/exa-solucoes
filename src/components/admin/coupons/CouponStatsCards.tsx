
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, TrendingUp, Users, DollarSign } from 'lucide-react';
import { CouponStats } from '@/types/coupon';

interface CouponStatsCardsProps {
  stats: CouponStats | null;
  isLoading: boolean;
}

const CouponStatsCards: React.FC<CouponStatsCardsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
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
          <DollarSign className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-purple-600">
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
