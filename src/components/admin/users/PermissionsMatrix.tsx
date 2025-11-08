import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  DollarSign,
  ShoppingCart,
  UserCheck,
  FileCheck,
  Video,
  Image,
  Package,
  Receipt,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserCustomPermissions } from '@/types/userTypes';

interface PermissionsMatrixProps {
  userId: string;
  userRole: string;
  currentPermissions?: UserCustomPermissions;
  onPermissionsChanged: () => void;
}

interface PermissionModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  permissions: {
    key: keyof UserCustomPermissions;
    label: string;
    description: string;
  }[];
}

const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Visualização de painéis e métricas',
    icon: <LayoutDashboard className="h-5 w-5" />,
    permissions: [
      { key: 'canViewDashboard', label: 'Ver Dashboard', description: 'Acesso ao painel principal' },
      { key: 'canViewOrders', label: 'Ver Pedidos', description: 'Visualizar lista de pedidos' },
      { key: 'canViewCRM', label: 'Ver CRM', description: 'Acesso ao sistema de CRM' },
      { key: 'canViewApprovals', label: 'Ver Aprovações', description: 'Visualizar fluxo de aprovações' },
    ]
  },
  {
    id: 'leads',
    name: 'Leads & Clientes',
    description: 'Gestão de leads e relacionamento',
    icon: <UserCheck className="h-5 w-5" />,
    permissions: [
      { key: 'canViewLeads', label: 'Ver Leads', description: 'Visualizar leads cadastrados' },
    ]
  },
  {
    id: 'system',
    name: 'Sistema & Administração',
    description: 'Configurações e gestão de usuários',
    icon: <Settings className="h-5 w-5" />,
    permissions: [
      { key: 'canManageUsers', label: 'Gerenciar Usuários', description: 'Criar, editar e remover contas' },
      { key: 'canManageCoupons', label: 'Gerenciar Cupons', description: 'Criar e gerenciar cupons de desconto' },
      { key: 'canViewAudit', label: 'Ver Auditoria', description: 'Acessar logs de atividades' },
    ]
  },
  {
    id: 'content',
    name: 'Conteúdo & Mídia',
    description: 'Gestão de vídeos e portfolios',
    icon: <FileText className="h-5 w-5" />,
    permissions: [
      { key: 'canManageVideos', label: 'Gerenciar Vídeos', description: 'Upload e edição de vídeos' },
      { key: 'canManagePortfolio', label: 'Gerenciar Portfolio', description: 'Gerenciar cases e portfolios' },
    ]
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Gestão financeira e benefícios',
    icon: <DollarSign className="h-5 w-5" />,
    permissions: [
      { key: 'canManageProviderBenefits', label: 'Benefícios de Prestadores', description: 'Gerenciar benefícios de fornecedores' },
      { key: 'canViewFinancialReports', label: 'Relatórios Financeiros', description: 'Visualizar relatórios financeiros' },
    ]
  },
];

export const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({
  userId,
  userRole,
  currentPermissions,
  onPermissionsChanged
}) => {
  const [permissions, setPermissions] = useState<Partial<UserCustomPermissions>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentPermissions) {
      setPermissions(currentPermissions);
    }
  }, [currentPermissions]);

  const handleTogglePermission = async (permissionKey: keyof UserCustomPermissions, value: boolean) => {
    try {
      setSaving(true);

      const newPermissions = {
        ...permissions,
        [permissionKey]: value
      };

      // Salvar no banco via upsert
      const { error } = await supabase
        .from('user_custom_permissions')
        .upsert({
          user_id: userId,
          ...newPermissions,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setPermissions(newPermissions);
      toast.success('Permissão atualizada com sucesso');
      onPermissionsChanged();
    } catch (error: any) {
      console.error('Erro ao atualizar permissão:', error);
      toast.error('Erro ao atualizar permissão', {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Matriz de Permissões Granulares
            </CardTitle>
            <CardDescription className="mt-1">
              Configure permissões específicas por módulo do sistema
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Role: {userRole}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {PERMISSION_MODULES.map((module, idx) => (
          <div key={module.id}>
            {idx > 0 && <Separator className="my-4" />}
            
            <div className="space-y-4">
              {/* Module Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {module.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base">{module.name}</h4>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
              </div>

              {/* Permissions List */}
              <div className="ml-13 space-y-3">
                {module.permissions.map((perm) => {
                  const permValue = permissions[perm.key];
                  const isEnabled = typeof permValue === 'boolean' ? permValue : false;
                  
                  return (
                    <div 
                      key={perm.key}
                      className="flex items-start justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <Label 
                          htmlFor={perm.key}
                          className="font-medium text-sm cursor-pointer"
                        >
                          {perm.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {perm.description}
                        </p>
                      </div>
                      <Switch
                        id={perm.key}
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleTogglePermission(perm.key, checked)}
                        disabled={saving}
                        className="flex-shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>ℹ️ Importante:</strong> Permissões customizadas sobrescrevem as permissões padrão da role. 
            Alterações são registradas automaticamente no log de auditoria.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
