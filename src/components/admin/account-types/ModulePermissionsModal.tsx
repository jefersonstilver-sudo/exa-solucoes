import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, Loader2, ChevronDown, ChevronRight,
  LayoutDashboard, FileText, CreditCard, CheckCircle, Ticket, Gift,
  Globe, MessageSquare, Users, Bot, Bell,
  Building2, Monitor, UserCheck, Megaphone,
  Video, Play, Type, Film, Mail,
  Settings, Shield, BarChart3, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MODULE_KEYS } from '@/hooks/useDynamicModulePermissions';

interface RoleType {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  color: string;
  icon: string;
  is_system: boolean;
  is_active: boolean;
}

interface ModulePermissionsModalProps {
  role: RoleType;
  onClose: () => void;
}

// Module configuration with icons and labels organized by sidebar sections
const MODULE_SECTIONS = [
  {
    title: 'Gestão Principal',
    modules: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'sync_notion', label: 'Sync Notion', icon: RefreshCw },
      { key: 'pedidos', label: 'Pedidos', icon: FileText },
      { key: 'propostas', label: 'Propostas', icon: FileText },
      { key: 'juridico', label: 'Jurídico', icon: FileText },
      { key: 'assinaturas', label: 'Assinaturas', icon: CreditCard },
      { key: 'aprovacoes', label: 'Aprovações', icon: CheckCircle },
      { key: 'cupons', label: 'Cupons', icon: Ticket },
      { key: 'beneficios', label: 'Benefícios Prestadores', icon: Gift },
    ]
  },
  {
    title: 'CRM',
    modules: [
      { key: 'crm_site', label: 'CRM Site', icon: Globe },
      { key: 'crm_chat', label: 'CRM Chat', icon: MessageSquare },
      { key: 'escalacoes', label: 'Escalações', icon: Users },
    ]
  },
  {
    title: 'Inteligência',
    modules: [
      { key: 'agentes_sofia', label: 'Agentes Sofia', icon: Bot },
      { key: 'exa_alerts', label: 'EXA Alerts', icon: Bell },
    ]
  },
  {
    title: 'Ativos',
    modules: [
      { key: 'predios', label: 'Prédios', icon: Building2 },
      { key: 'paineis', label: 'Painéis EXA', icon: Monitor },
      { key: 'sindicos', label: 'Síndicos Interessados', icon: UserCheck },
      { key: 'leads', label: 'Leads EXA', icon: Megaphone },
    ]
  },
  {
    title: 'Conteúdo',
    modules: [
      { key: 'videos_anunciantes', label: 'Vídeos Anunciantes', icon: Video },
      { key: 'videos_site', label: 'Vídeos Site EXA', icon: Play },
      { key: 'ticker', label: 'Ticker', icon: Type },
      { key: 'editor_videos', label: 'Editor de Vídeos', icon: Film },
      { key: 'emails', label: 'Emails', icon: Mail },
    ]
  },
  {
    title: 'Sistema',
    modules: [
      { key: 'usuarios', label: 'Usuários', icon: Users },
      { key: 'notificacoes', label: 'Notificações', icon: Bell },
      { key: 'relatorios', label: 'Relatórios Financeiros', icon: BarChart3 },
      { key: 'seguranca', label: 'Segurança', icon: Shield },
      { key: 'configuracoes', label: 'Configurações', icon: Settings },
    ]
  },
];

export default function ModulePermissionsModal({ role, onClose }: ModulePermissionsModalProps) {
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<string[]>(MODULE_SECTIONS.map(s => s.title));
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current permissions for this role
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['module-permissions-modal', role.key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_key', role.key);
      
      if (error) throw error;
      return data;
    }
  });

  // Initialize local permissions from database
  useEffect(() => {
    if (permissions.length > 0) {
      const permMap: Record<string, boolean> = {};
      permissions.forEach(p => {
        permMap[p.permission_key] = p.is_enabled;
      });
      setLocalPermissions(permMap);
    }
  }, [permissions]);

  // Save all changes
  const saveChanges = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(localPermissions).map(async ([key, enabled]) => {
        const existing = permissions.find(p => p.permission_key === key);
        
        if (existing) {
          // Update existing
          await supabase
            .from('role_permissions')
            .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          // Insert new
          await supabase
            .from('role_permissions')
            .insert({
              role_key: role.key,
              permission_key: key,
              permission_label: MODULE_SECTIONS.flatMap(s => s.modules).find(m => m.key === key)?.label || key,
              permission_group: MODULE_SECTIONS.find(s => s.modules.some(m => m.key === key))?.title || 'Outros',
              is_enabled: enabled,
            });
        }
      });

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['module-permissions-modal'] });
      toast.success('Permissões salvas com sucesso');
      setHasChanges(false);
      onClose();
    },
    onError: () => {
      toast.error('Erro ao salvar permissões');
    }
  });

  const toggleModule = (moduleKey: string) => {
    if (role.key === 'super_admin') return; // Super admin always has all access
    
    setLocalPermissions(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
    setHasChanges(true);
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const toggleAllInSection = (section: typeof MODULE_SECTIONS[0], enable: boolean) => {
    if (role.key === 'super_admin') return;
    
    const newPerms = { ...localPermissions };
    section.modules.forEach(m => {
      newPerms[m.key] = enable;
    });
    setLocalPermissions(newPerms);
    setHasChanges(true);
  };

  const getEnabledCount = (section: typeof MODULE_SECTIONS[0]) => {
    return section.modules.filter(m => localPermissions[m.key]).length;
  };

  const getTotalEnabled = () => {
    return Object.values(localPermissions).filter(Boolean).length;
  };

  const getTotalModules = () => {
    return MODULE_SECTIONS.reduce((acc, s) => acc + s.modules.length, 0);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${role.color}15` }}
                >
                  <Shield className="h-6 w-6" style={{ color: role.color }} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Permissões de Módulos
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {role.display_name} • {getTotalEnabled()}/{getTotalModules()} módulos habilitados
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {role.key === 'super_admin' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Super Admin</strong> sempre tem acesso total a todos os módulos.
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODULE_SECTIONS.map(section => {
                  const enabledCount = getEnabledCount(section);
                  const isExpanded = expandedSections.includes(section.title);
                  const allEnabled = enabledCount === section.modules.length;
                  const noneEnabled = enabledCount === 0;

                  return (
                    <div
                      key={section.title}
                      className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden"
                    >
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.title)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm">{section.title}</span>
                        </div>
                        <Badge 
                          variant={allEnabled ? 'default' : noneEnabled ? 'secondary' : 'outline'}
                          className={`text-[10px] ${allEnabled ? 'bg-emerald-500' : ''}`}
                        >
                          {enabledCount}/{section.modules.length}
                        </Badge>
                      </button>

                      {/* Section Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 pb-4 space-y-2">
                              {/* Quick Actions */}
                              {role.key !== 'super_admin' && (
                                <div className="flex gap-2 mb-3">
                                  <button
                                    onClick={() => toggleAllInSection(section, true)}
                                    className="text-[10px] px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
                                  >
                                    Ativar todos
                                  </button>
                                  <button
                                    onClick={() => toggleAllInSection(section, false)}
                                    className="text-[10px] px-2 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                  >
                                    Desativar todos
                                  </button>
                                </div>
                              )}

                              {/* Module Items */}
                              {section.modules.map(module => {
                                const Icon = module.icon;
                                const isEnabled = role.key === 'super_admin' ? true : localPermissions[module.key] ?? false;

                                return (
                                  <div
                                    key={module.key}
                                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                                      isEnabled 
                                        ? 'bg-white shadow-sm border border-gray-100' 
                                        : 'bg-gray-100/50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-emerald-50' : 'bg-gray-200/50'}`}>
                                        <Icon className={`h-4 w-4 ${isEnabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                                      </div>
                                      <span className={`text-sm ${isEnabled ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                        {module.label}
                                      </span>
                                    </div>
                                    
                                    {role.key === 'super_admin' ? (
                                      <Badge variant="secondary" className="text-[10px]">
                                        Sempre ativo
                                      </Badge>
                                    ) : (
                                      <Switch
                                        checked={isEnabled}
                                        onCheckedChange={() => toggleModule(module.key)}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasChanges && (
                <span className="text-amber-600 font-medium">
                  • Alterações não salvas
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={() => saveChanges.mutate()}
                disabled={!hasChanges || saveChanges.isPending || role.key === 'super_admin'}
                className="bg-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/90"
              >
                {saveChanges.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Salvar Permissões
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
