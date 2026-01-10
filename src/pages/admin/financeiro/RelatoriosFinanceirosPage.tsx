/**
 * RelatoriosFinanceirosPage - Geração de Relatórios
 * Lista de relatórios com filtros e export
 * Design neutro, minimalista
 */

import React, { useState } from 'react';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download,
  ArrowLeft,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Receipt,
  Users,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'financeiro' | 'operacional' | 'gerencial';
  formats: string[];
}

const REPORTS: ReportType[] = [
  {
    id: 'dre',
    title: 'DRE - Demonstrativo de Resultados',
    description: 'Receitas, despesas e resultado líquido do período',
    icon: BarChart3,
    category: 'financeiro',
    formats: ['PDF', 'Excel']
  },
  {
    id: 'fluxo-caixa',
    title: 'Fluxo de Caixa',
    description: 'Movimentações de entrada e saída detalhadas',
    icon: TrendingUp,
    category: 'financeiro',
    formats: ['PDF', 'Excel']
  },
  {
    id: 'contas-receber',
    title: 'Contas a Receber',
    description: 'Cobranças pendentes, vencidas e pagas',
    icon: Receipt,
    category: 'operacional',
    formats: ['PDF', 'Excel']
  },
  {
    id: 'contas-pagar',
    title: 'Contas a Pagar',
    description: 'Despesas pendentes e pagas por categoria',
    icon: Receipt,
    category: 'operacional',
    formats: ['PDF', 'Excel']
  },
  {
    id: 'inadimplencia',
    title: 'Relatório de Inadimplência',
    description: 'Clientes em atraso com análise de risco',
    icon: Users,
    category: 'gerencial',
    formats: ['PDF', 'Excel']
  },
  {
    id: 'investimentos',
    title: 'Investimentos e CAPEX',
    description: 'Investimentos realizados e retorno esperado',
    icon: Building2,
    category: 'gerencial',
    formats: ['PDF', 'Excel']
  },
  {
    id: 'aportes',
    title: 'Histórico de Aportes',
    description: 'Capital investido pelos sócios',
    icon: PieChart,
    category: 'gerencial',
    formats: ['PDF', 'Excel']
  }
];

const RelatoriosFinanceirosPage = () => {
  const navigate = useNavigate();
  const basePath = useAdminBasePath();
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [generating, setGenerating] = useState<string | null>(null);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'financeiro': return 'Financeiro';
      case 'operacional': return 'Operacional';
      case 'gerencial': return 'Gerencial';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financeiro': return 'border-emerald-500 text-emerald-700';
      case 'operacional': return 'border-blue-500 text-blue-700';
      case 'gerencial': return 'border-purple-500 text-purple-700';
      default: return 'border-gray-300 text-gray-600';
    }
  };

  const handleGenerate = async (reportId: string, format: string) => {
    setGenerating(`${reportId}-${format}`);
    // Simular geração
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGenerating(null);
    // TODO: Integrar com edge function de geração de relatórios
  };

  const filteredReports = REPORTS.filter(r => 
    categoryFilter === 'todos' || r.category === categoryFilter
  );

  return (
    <ModernSuperAdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`${basePath}/financeiro`)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Relatórios Financeiros</h1>
            <p className="text-sm text-gray-500">Geração de relatórios em PDF e Excel</p>
          </div>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {['todos', 'financeiro', 'operacional', 'gerencial'].map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              className="whitespace-nowrap"
            >
              {cat === 'todos' ? 'Todos' : getCategoryLabel(cat)}
            </Button>
          ))}
        </div>

        {/* Grid de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => {
            const IconComponent = report.icon;
            return (
              <Card key={report.id} className="bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-medium">{report.title}</CardTitle>
                        <CardDescription className="text-sm">{report.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={getCategoryColor(report.category)}>
                      {getCategoryLabel(report.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {report.formats.map((format) => (
                      <Button
                        key={format}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={generating === `${report.id}-${format}`}
                        onClick={() => handleGenerate(report.id, format)}
                      >
                        {generating === `${report.id}-${format}` ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        {format}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Nota */}
        <Card className="bg-white mt-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Período de Geração</p>
                <p className="text-sm text-gray-500">
                  Por padrão, os relatórios são gerados com dados do mês corrente. 
                  Períodos personalizados estarão disponíveis em breve.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernSuperAdminLayout>
  );
};

export default RelatoriosFinanceirosPage;
