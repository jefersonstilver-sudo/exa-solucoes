// EXA (07/11/2026) — Dashboard refeito a pedido do Jeferson. No celular continua o DashboardCelular (compacto);
// no desktop o DashboardNovo (Hoje · Dinheiro · Comercial · Rede · Clientes no ar). Sem vendedores, vouchers ou gráficos antigos.
import React from 'react';
import DashboardCelular from '@/components/admin/dashboard/DashboardCelular';
import DashboardNovo from '@/components/admin/dashboard/DashboardNovo';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard = () => {
  const isMobile = useIsMobile();
  return isMobile ? <DashboardCelular /> : <DashboardNovo />;
};

export default Dashboard;
