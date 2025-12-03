import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Search, Filter, Clock, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import MobilePageHeader from '@/components/admin/shared/MobilePageHeader';

const PropostasPage = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsiveLayout();
  const { buildPath } = useAdminBasePath();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todas');

  const filters = [
    { id: 'todas', label: 'Todas', count: 0 },
    { id: 'pendentes', label: 'Pendentes', count: 0, color: 'bg-amber-500' },
    { id: 'aceitas', label: 'Aceitas', count: 0, color: 'bg-emerald-500' },
    { id: 'recusadas', label: 'Recusadas', count: 0, color: 'bg-red-500' },
  ];

  const stats = [
    { label: 'Propostas Hoje', value: '0', icon: FileText, color: 'text-blue-600' },
    { label: 'Pendentes', value: '0', icon: Clock, color: 'text-amber-600' },
    { label: 'Aceitas (mês)', value: '0', icon: Check, color: 'text-emerald-600' },
    { label: 'Valor Potencial', value: 'R$ 0', icon: Eye, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header Mobile */}
      {isMobile ? (
        <MobilePageHeader
          title="Propostas"
          subtitle="Gerencie suas propostas comerciais"
          icon={FileText}
        />
      ) : (
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Propostas Comerciais</h1>
              <p className="text-sm text-muted-foreground">Crie e gerencie propostas para seus clientes</p>
            </div>
            <Button 
              onClick={() => navigate(buildPath('propostas/nova'))}
              className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Proposta
            </Button>
          </div>
        </div>
      )}

      <div className="p-3 md:p-6 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-lg font-bold mt-1">{stat.value}</div>
            </Card>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-white/50"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-[#9C1E1E] text-white shadow-md'
                    : 'bg-white/80 text-muted-foreground hover:bg-white'
                }`}
              >
                {filter.color && (
                  <span className={`w-2 h-2 rounded-full ${filter.color}`} />
                )}
                {filter.label}
                {filter.count > 0 && (
                  <span className="bg-white/20 px-1.5 rounded-full text-[10px]">
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* FAB Mobile */}
        {isMobile && (
          <button
            onClick={() => navigate(buildPath('propostas/nova'))}
            className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-[#9C1E1E] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#7D1818] transition-colors"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}

        {/* Empty State */}
        <Card className="p-8 bg-white/80 backdrop-blur-sm border-white/50 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma proposta encontrada
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Comece criando sua primeira proposta comercial
          </p>
          <Button 
            onClick={() => navigate(buildPath('propostas/nova'))}
            className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Proposta
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PropostasPage;
