import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, ShoppingBag, MonitorPlay, Zap } from 'lucide-react';
import { MonthlyDashboardStats } from '@/hooks/useMonthlyDashboardData';
interface DashboardQuickActionsProps {
  stats: MonthlyDashboardStats;
}
const DashboardQuickActions = ({
  stats
}: DashboardQuickActionsProps) => {
  return;
};
export default DashboardQuickActions;