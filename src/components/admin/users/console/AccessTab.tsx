/**
 * Aba 2: Acesso & Organização (CRÍTICA)
 * Gerencia cargo hierárquico e departamento
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Crown,
  Shield,
  Building2,
  TrendingUp,
  Megaphone,
  DollarSign,
  Cog,
  Code,
  Bot,
  AlertTriangle,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { AccessTabProps, HierarchyLevel, ConsoleDepartment } from '@/types/userConsoleTypes';
import { cn } from '@/lib/utils';

// Mapeamento de ícones para departamentos
const getDepartmentIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Building': <Building2 className="h-4 w-4" />,
    'TrendingUp': <TrendingUp className="h-4 w-4" />,
    'Megaphone': <Megaphone className="h-4 w-4" />,
    'DollarSign': <DollarSign className="h-4 w-4" />,
    'Cog': <Cog className="h-4 w-4" />,
    'Code': <Code className="h-4 w-4" />,
    'Bot': <Bot className="h-4 w-4" />
  };
  return icons[iconName] || <Building2 className="h-4 w-4" />;
};

// Ícones e cores para hierarquia
const hierarchyConfig: Record<HierarchyLevel, { icon: React.ReactNode; color: string; bg: string }> = {
  'super_admin': {
    icon: <Crown className="h-5 w-5" />,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800'
  },
  'admin': {
    icon: <Shield className="h-5 w-5" />,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
  },
  'admin_departamental': {
    icon: <Building2 className="h-5 w-5" />,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
  }
};

export const AccessTab: React.FC<AccessTabProps> = ({
  user,
  departments,
  selectedRole,
  selectedDepartamento,
  onRoleChange,
  onDepartamentoChange,
  onSave,
  canEdit,
  isSaving,
  errors,
  impact
}) => {
  const hasErrors = Object.values(errors).some(Boolean);
  const hasPendingChanges = impact !== null;

  return (
    <div className="space-y-6">
      {/* Alertas de Erro */}
      {errors.selfRoleChange && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você não pode alterar seu próprio cargo
          </AlertDescription>
        </Alert>
      )}

      {errors.ceoDowngrade && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            O CEO não pode ser rebaixado
          </AlertDescription>
        </Alert>
      )}

      {/* Seletor de Cargo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Nível Hierárquico
          </CardTitle>
          <CardDescription>
            Define o nível de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedRole}
            onValueChange={(value) => onRoleChange(value as HierarchyLevel)}
            disabled={!canEdit || isSaving}
            className="space-y-3"
          >
            {/* CEO / Diretoria */}
            <label
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedRole === 'super_admin'
                  ? hierarchyConfig['super_admin'].bg + ' border-purple-400'
                  : 'bg-muted/30 border-transparent hover:border-muted',
                !canEdit && 'opacity-60 cursor-not-allowed'
              )}
            >
              <RadioGroupItem value="super_admin" id="super_admin" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={hierarchyConfig['super_admin'].color}>
                    {hierarchyConfig['super_admin'].icon}
                  </div>
                  <span className="font-semibold">CEO / Diretoria</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesso total ao sistema, incluindo configurações, usuários e auditoria
                </p>
              </div>
            </label>

            {/* Coordenação */}
            <label
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedRole === 'admin'
                  ? hierarchyConfig['admin'].bg + ' border-blue-400'
                  : 'bg-muted/30 border-transparent hover:border-muted',
                !canEdit && 'opacity-60 cursor-not-allowed'
              )}
            >
              <RadioGroupItem value="admin" id="admin" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={hierarchyConfig['admin'].color}>
                    {hierarchyConfig['admin'].icon}
                  </div>
                  <span className="font-semibold">Coordenação</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesso operacional completo a todos os departamentos
                </p>
              </div>
            </label>

            {/* Admin Departamental */}
            <label
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedRole === 'admin_departamental'
                  ? hierarchyConfig['admin_departamental'].bg + ' border-gray-400'
                  : 'bg-muted/30 border-transparent hover:border-muted',
                !canEdit && 'opacity-60 cursor-not-allowed'
              )}
            >
              <RadioGroupItem value="admin_departamental" id="admin_departamental" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={hierarchyConfig['admin_departamental'].color}>
                    {hierarchyConfig['admin_departamental'].icon}
                  </div>
                  <span className="font-semibold">Admin Departamental</span>
                  {selectedRole === 'admin_departamental' && !selectedDepartamento && (
                    <Badge variant="destructive" className="text-xs">
                      Departamento obrigatório
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesso restrito exclusivamente ao seu departamento
                </p>
              </div>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Seletor de Departamento */}
      <Card className={cn(
        errors.departmentRequired && 'border-2 border-red-500'
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Departamento
            {selectedRole === 'admin_departamental' && (
              <span className="text-red-500">*</span>
            )}
          </CardTitle>
          <CardDescription>
            {selectedRole === 'admin_departamental'
              ? 'Obrigatório - O usuário terá acesso apenas a este departamento'
              : 'Opcional - CEO e Coordenação têm acesso a todos os departamentos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {departments.map((dept) => (
              <DepartmentOption
                key={dept.id}
                department={dept}
                isSelected={selectedDepartamento === dept.id}
                onSelect={() => onDepartamentoChange(dept.id)}
                disabled={isSaving}
              />
            ))}
          </div>
          
          {errors.departmentRequired && (
            <p className="text-sm text-red-600 mt-3 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              Selecione um departamento para Admin Departamental
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview de Impacto */}
      {hasPendingChanges && impact && (
        <>
          <Separator />
          <ImpactPreviewCard impact={impact} />
        </>
      )}

      {/* Botão Salvar */}
      {hasPendingChanges && (
        <div className="sticky bottom-0 p-4 bg-background/95 backdrop-blur border-t -mx-6 -mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              {hasErrors ? (
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Corrija os erros para salvar
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Alterações pendentes
                </span>
              )}
            </div>
            <Button
              onClick={onSave}
              disabled={isSaving || hasErrors}
              className="min-w-[140px]"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Confirmar Alteração
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// === COMPONENTES AUXILIARES ===

interface DepartmentOptionProps {
  department: ConsoleDepartment;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const DepartmentOption: React.FC<DepartmentOptionProps> = ({
  department,
  isSelected,
  onSelect,
  disabled
}) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    className={cn(
      "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left w-full",
      isSelected
        ? 'border-primary bg-primary/5'
        : 'border-transparent bg-muted/30 hover:border-muted',
      disabled && 'opacity-60 cursor-not-allowed'
    )}
  >
    <div
      className="w-8 h-8 rounded-md flex items-center justify-center"
      style={{ backgroundColor: department.color + '20' }}
    >
      <span style={{ color: department.color }}>
        {getDepartmentIcon(department.icon)}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm truncate">{department.name}</p>
    </div>
    {isSelected && (
      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
    )}
  </button>
);

interface ImpactPreviewCardProps {
  impact: NonNullable<AccessTabProps['impact']>;
}

const ImpactPreviewCard: React.FC<ImpactPreviewCardProps> = ({ impact }) => (
  <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-5 w-5" />
        Preview de Impacto
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* De → Para */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex-1 p-2 rounded bg-muted/50 text-center">
          <p className="font-semibold">{impact.from.roleLabel}</p>
          {impact.from.departamentoLabel && (
            <p className="text-xs text-muted-foreground">{impact.from.departamentoLabel}</p>
          )}
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 p-2 rounded bg-primary/10 text-center border border-primary/20">
          <p className="font-semibold">{impact.to.roleLabel}</p>
          {impact.to.departamentoLabel && (
            <p className="text-xs text-muted-foreground">{impact.to.departamentoLabel}</p>
          )}
        </div>
      </div>

      {/* Mudanças */}
      {impact.changes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">O que muda:</p>
          <div className="space-y-1">
            {impact.changes.map((change, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex items-center gap-2 text-sm p-2 rounded",
                  change.type === 'gain' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                  change.type === 'lose' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
                  change.type === 'keep' && 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                )}
              >
                {change.type === 'gain' && <CheckCircle2 className="h-4 w-4" />}
                {change.type === 'lose' && <XCircle className="h-4 w-4" />}
                <span>{change.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CRM */}
      {impact.crmAccess.before !== impact.crmAccess.after && (
        <div className="text-sm p-2 rounded bg-blue-100 dark:bg-blue-900/30">
          <p className="font-medium text-blue-700 dark:text-blue-300">CRM:</p>
          <p className="text-blue-600 dark:text-blue-400">
            {impact.crmAccess.before} → {impact.crmAccess.after}
          </p>
        </div>
      )}

      {/* Warnings */}
      {impact.warnings.length > 0 && (
        <div className="space-y-1">
          {impact.warnings.map((warning, idx) => (
            <p key={idx} className="text-sm text-red-600 dark:text-red-400">
              {warning}
            </p>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
