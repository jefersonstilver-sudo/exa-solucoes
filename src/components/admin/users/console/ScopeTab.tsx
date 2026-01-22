/**
 * Aba 3: Escopo Operacional
 * Mostra permissões calculadas (read-only) baseado no cargo e departamento
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  Building2,
  Users,
  FileText,
  PieChart,
  Settings,
  Shield,
  CheckCircle,
  XCircle,
  Minus,
  Eye,
  TrendingUp,
  Megaphone
} from 'lucide-react';
import { ScopeTabProps, HierarchyLevel } from '@/types/userConsoleTypes';
import { cn } from '@/lib/utils';

interface ModuleAccess {
  key: string;
  label: string;
  icon: React.ReactNode;
  access: 'full' | 'partial' | 'none' | 'readonly';
  description?: string;
}

export const ScopeTab: React.FC<ScopeTabProps> = ({
  user,
  selectedRole,
  selectedDepartamento,
  departments
}) => {
  const selectedDept = departments.find(d => d.id === selectedDepartamento);
  
  // Calcular módulos com acesso baseado no cargo e departamento
  const modules = useMemo((): ModuleAccess[] => {
    const isCEO = selectedRole === 'super_admin';
    const isCoord = selectedRole === 'admin';
    const isDeptAdmin = selectedRole === 'admin_departamental';
    const isComercial = selectedDept?.name === 'Comercial';
    const isFinanceiro = selectedDept?.name === 'Financeiro';
    const isMarketing = selectedDept?.name === 'Marketing';
    const isTech = selectedDept?.name === 'Tecnologia' || selectedDept?.name === 'IA & Automação';

    return [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
        access: isCEO || isCoord ? 'full' : 'partial',
        description: isDeptAdmin ? 'Apenas métricas do departamento' : undefined
      },
      {
        key: 'crm',
        label: 'CRM / Conversas',
        icon: <MessageSquare className="h-4 w-4" />,
        access: isCEO ? 'full' : isCoord ? 'full' : isComercial ? 'partial' : 'none',
        description: isComercial && isDeptAdmin ? 'Apenas suas próprias conversas' : undefined
      },
      {
        key: 'pedidos',
        label: 'Pedidos',
        icon: <ShoppingCart className="h-4 w-4" />,
        access: isCEO || isCoord ? 'full' : isFinanceiro || isComercial ? 'partial' : 'none',
        description: isDeptAdmin && (isFinanceiro || isComercial) ? 'Visualização e gestão' : undefined
      },
      {
        key: 'predios',
        label: 'Prédios & Painéis',
        icon: <Building2 className="h-4 w-4" />,
        access: isCEO || isCoord ? 'full' : 'none'
      },
      {
        key: 'leads',
        label: 'Leads',
        icon: <TrendingUp className="h-4 w-4" />,
        access: isCEO || isCoord ? 'full' : isMarketing || isComercial ? 'partial' : 'none',
        description: isDeptAdmin ? 'Leads do seu departamento' : undefined
      },
      {
        key: 'marketing',
        label: 'Marketing & Conteúdo',
        icon: <Megaphone className="h-4 w-4" />,
        access: isCEO || isCoord ? 'full' : isMarketing ? 'full' : 'none'
      },
      {
        key: 'financeiro',
        label: 'Financeiro',
        icon: <PieChart className="h-4 w-4" />,
        access: isCEO ? 'full' : isCoord ? 'readonly' : isFinanceiro ? 'full' : 'none',
        description: isCoord ? 'Somente visualização' : undefined
      },
      {
        key: 'usuarios',
        label: 'Gerenciar Usuários',
        icon: <Users className="h-4 w-4" />,
        access: isCEO ? 'full' : 'none'
      },
      {
        key: 'auditoria',
        label: 'Auditoria & Segurança',
        icon: <Shield className="h-4 w-4" />,
        access: isCEO ? 'full' : 'none'
      },
      {
        key: 'configuracoes',
        label: 'Configurações do Sistema',
        icon: <Settings className="h-4 w-4" />,
        access: isCEO ? 'full' : 'none'
      }
    ];
  }, [selectedRole, selectedDept]);

  // Agrupar módulos por acesso
  const groupedModules = useMemo(() => {
    const groups = {
      full: [] as ModuleAccess[],
      partial: [] as ModuleAccess[],
      readonly: [] as ModuleAccess[],
      none: [] as ModuleAccess[]
    };
    
    modules.forEach(m => groups[m.access].push(m));
    return groups;
  }, [modules]);

  // Determinar regra de CRM
  const crmRule = useMemo(() => {
    if (selectedRole === 'super_admin') return 'Acesso total a todas as conversas';
    if (selectedRole === 'admin') return 'Acesso total a todas as conversas';
    if (selectedDept?.name === 'Comercial') return 'Apenas suas próprias conversas';
    return 'Sem acesso ao CRM';
  }, [selectedRole, selectedDept]);

  return (
    <div className="space-y-6">
      {/* Resumo do Escopo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Escopo de Acesso
          </CardTitle>
          <CardDescription>
            Baseado em: <strong>{getRoleLabel(selectedRole)}</strong>
            {selectedDept && (
              <> → <strong style={{ color: selectedDept.color }}>{selectedDept.name}</strong></>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Acesso Total"
              value={groupedModules.full.length}
              color="green"
            />
            <StatCard
              label="Parcial"
              value={groupedModules.partial.length + groupedModules.readonly.length}
              color="amber"
            />
            <StatCard
              label="Bloqueado"
              value={groupedModules.none.length}
              color="red"
            />
          </div>
        </CardContent>
      </Card>

      {/* Módulos com Acesso Total */}
      {groupedModules.full.length > 0 && (
        <ModuleGroup
          title="Acesso Total"
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          modules={groupedModules.full}
          badgeColor="green"
        />
      )}

      {/* Módulos com Acesso Parcial */}
      {(groupedModules.partial.length > 0 || groupedModules.readonly.length > 0) && (
        <ModuleGroup
          title="Acesso Parcial / Restrito"
          icon={<Minus className="h-5 w-5 text-amber-500" />}
          modules={[...groupedModules.partial, ...groupedModules.readonly]}
          badgeColor="amber"
        />
      )}

      {/* Módulos Bloqueados */}
      {groupedModules.none.length > 0 && (
        <ModuleGroup
          title="Sem Acesso"
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          modules={groupedModules.none}
          badgeColor="red"
        />
      )}

      <Separator />

      {/* Regra de CRM */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Regra de CRM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "p-4 rounded-lg",
            selectedRole === 'super_admin' || selectedRole === 'admin'
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
              : selectedDept?.name === 'Comercial'
                ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
          )}>
            <p className="font-medium">{crmRule}</p>
            {selectedDept?.name === 'Comercial' && selectedRole === 'admin_departamental' && (
              <p className="text-sm text-muted-foreground mt-1">
                Conversas onde o usuário é o responsável serão visíveis
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// === COMPONENTES AUXILIARES ===

interface StatCardProps {
  label: string;
  value: number;
  color: 'green' | 'amber' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  };

  return (
    <div className={cn("p-3 rounded-lg text-center", colorClasses[color])}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
};

interface ModuleGroupProps {
  title: string;
  icon: React.ReactNode;
  modules: ModuleAccess[];
  badgeColor: 'green' | 'amber' | 'red';
}

const ModuleGroup: React.FC<ModuleGroupProps> = ({ title, icon, modules, badgeColor }) => {
  const badgeClasses = {
    green: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
    red: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300'
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="outline" className={cn("ml-auto", badgeClasses[badgeColor])}>
            {modules.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {modules.map((module) => (
            <div
              key={module.key}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  {module.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{module.label}</p>
                  {module.description && (
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={badgeClasses[badgeColor]}>
                {module.access === 'full' && 'Total'}
                {module.access === 'partial' && 'Parcial'}
                {module.access === 'readonly' && 'Leitura'}
                {module.access === 'none' && 'Bloqueado'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper
function getRoleLabel(role: HierarchyLevel): string {
  const labels: Record<HierarchyLevel, string> = {
    'super_admin': 'CEO / Diretoria',
    'admin': 'Coordenação',
    'admin_departamental': 'Admin Departamental'
  };
  return labels[role];
}
