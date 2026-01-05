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
      { key: 'posicoes', label: 'Posições', icon: LayoutDashboard },
      { key: 'sync_notion', label: 'Sync Notion', icon: RefreshCw },
      { key: 'agenda', label: 'Agenda', icon: FileText },
      { key: 'pedidos', label: 'Pedidos', icon: FileText },
      { key: 'produtos', label: 'Produtos', icon: FileText },
      { key: 'propostas', label: 'Propostas', icon: FileText },
      { key: 'juridico', label: 'Jurídico', icon: FileText },
      { key: 'assinaturas', label: 'Assinaturas', icon: CreditCard },
      { key: 'aprovacoes', label: 'Aprovações', icon: CheckCircle },
      { key: 'cupons', label: 'Cupons', icon: Ticket },
      { key: 'beneficios', label: 'Benefícios', icon: Gift },
    ]
  },
  {
    title: 'CRM',
    modules: [
      { key: 'contatos', label: 'Contatos', icon: Users },
      { key: 'contatos_kanban', label: 'Contatos Kanban', icon: LayoutDashboard },
      { key: 'crm_site', label: 'CRM Site', icon: Globe },
      { key: 'crm_chat', label: 'CRM Chat', icon: MessageSquare },
      { key: 'escalacoes', label: 'Escalações', icon: Users },
      { key: 'processos', label: 'Processos', icon: RefreshCw },
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
      { key: 'sindicos', label: 'Síndicos', icon: UserCheck },
      { key: 'leads', label: 'Leads EXA', icon: Megaphone },
    ]
  },
  {
    title: 'Conteúdo',
    modules: [
      { key: 'videos_anunciantes', label: 'Vídeos Anunc.', icon: Video },
      { key: 'videos_site', label: 'Vídeos Site', icon: Play },
      { key: 'ticker', label: 'Ticker', icon: Type },
      { key: 'editor_videos', label: 'Editor', icon: Film },
      { key: 'emails', label: 'Emails', icon: Mail },
    ]
  },
  {
    title: 'Financeiro',
    modules: [
      { key: 'financeiro_mp', label: 'Financeiro MP', icon: CreditCard },
    ]
  },
  {
    title: 'Sistema',
    modules: [
      { key: 'usuarios', label: 'Usuários', icon: Users },
      { key: 'notificacoes', label: 'Notificações', icon: Bell },
      { key: 'relatorios', label: 'Relatórios', icon: BarChart3 },
      { key: 'seguranca', label: 'Segurança', icon: Shield },
      { key: 'configuracoes', label: 'Config', icon: Settings },
    ]
  },
];

export default function ModulePermissionsModal({ role, onClose }: ModulePermissionsModalProps) {
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
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

  // Initialize local permissions - include ALL modules from MODULE_SECTIONS
  useEffect(() => {
    const permMap: Record<string, boolean> = {};
    
    // First, initialize ALL modules as false (default)
    MODULE_SECTIONS.forEach(section => {
      section.modules.forEach(module => {
        permMap[module.key] = false;
      });
    });
    
    // Then, override with existing permissions from database
    if (permissions.length > 0) {
      permissions.forEach(p => {
        permMap[p.permission_key] = p.is_enabled;
      });
    }
    
    setLocalPermissions(permMap);
  }, [permissions]);

  // Save all changes
  const saveChanges = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(localPermissions).map(async ([key, enabled]) => {
        const existing = permissions.find(p => p.permission_key === key);
        
        if (existing) {
          await supabase
            .from('role_permissions')
            .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
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
      toast.success('Permissões salvas');
      setHasChanges(false);
      onClose();
    },
    onError: () => {
      toast.error('Erro ao salvar');
    }
  });

  const toggleModule = (moduleKey: string) => {
    if (role.key === 'super_admin') return;
    
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

  // Ativar TODOS os módulos de uma vez
  const enableAllModules = () => {
    if (role.key === 'super_admin') return;
    
    const newPerms: Record<string, boolean> = {};
    MODULE_SECTIONS.forEach(section => {
      section.modules.forEach(m => {
        newPerms[m.key] = true;
      });
    });
    setLocalPermissions(newPerms);
    setHasChanges(true);
    toast.success('Todos os módulos foram ativados');
  };

  // Desativar TODOS os módulos de uma vez
  const disableAllModules = () => {
    if (role.key === 'super_admin') return;
    
    const newPerms: Record<string, boolean> = {};
    MODULE_SECTIONS.forEach(section => {
      section.modules.forEach(m => {
        newPerms[m.key] = false;
      });
    });
    setLocalPermissions(newPerms);
    setHasChanges(true);
    toast.success('Todos os módulos foram desativados');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-x-0 bottom-0 md:inset-4 md:bottom-4 md:left-auto md:right-4 md:top-4 md:w-[420px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-full"
          onClick={e => e.stopPropagation()}
        >
          {/* Compact Header */}
          <div className="flex-shrink-0 p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="p-1.5 rounded-lg"
                  style={{ backgroundColor: `${role.color}15` }}
                >
                  <Shield className="h-4 w-4" style={{ color: role.color }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Permissões de Módulos
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    {role.display_name} • {getTotalEnabled()}/{getTotalModules()} ativos
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {role.key === 'super_admin' && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-[10px] text-amber-800">
                  <strong>Super Admin</strong> sempre tem acesso total.
                </p>
              </div>
            )}
          </div>

          {/* Botões Globais - Ativar/Desativar Todos */}
          {role.key !== 'super_admin' && (
            <div className="flex gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={enableAllModules}
                className="flex-1 text-xs py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Ativar Todos
              </button>
              <button
                onClick={disableAllModules}
                className="flex-1 text-xs py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Desativar Todos
              </button>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              MODULE_SECTIONS.map(section => {
                const enabledCount = getEnabledCount(section);
                const isExpanded = expandedSections.includes(section.title);
                const allEnabled = enabledCount === section.modules.length;
                const noneEnabled = enabledCount === 0;

                return (
                  <div
                    key={section.title}
                    className="bg-gray-50/80 rounded-xl border border-gray-100 overflow-hidden"
                  >
                    {/* Section Header - Compact */}
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="font-medium text-xs">{section.title}</span>
                      </div>
                      <Badge 
                        variant={allEnabled ? 'default' : noneEnabled ? 'secondary' : 'outline'}
                        className={`text-[9px] px-1.5 py-0 h-4 ${allEnabled ? 'bg-emerald-500' : ''}`}
                      >
                        {enabledCount}/{section.modules.length}
                      </Badge>
                    </button>

                    {/* Section Content - Compact */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="px-2 pb-2 space-y-1">
                            {/* Quick Actions - Ultra Compact */}
                            {role.key !== 'super_admin' && (
                              <div className="flex gap-1.5 mb-1.5">
                                <button
                                  onClick={() => toggleAllInSection(section, true)}
                                  className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                                >
                                  Ativar todos
                                </button>
                                <button
                                  onClick={() => toggleAllInSection(section, false)}
                                  className="text-[9px] px-2 py-0.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                                >
                                  Desativar
                                </button>
                              </div>
                            )}

                            {/* Module Items - Ultra Compact */}
                            {section.modules.map(module => {
                              const Icon = module.icon;
                              const isEnabled = role.key === 'super_admin' ? true : localPermissions[module.key] ?? false;

                              return (
                                <div
                                  key={module.key}
                                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all ${
                                    isEnabled 
                                      ? 'bg-white shadow-sm border border-gray-100' 
                                      : 'bg-gray-100/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded ${isEnabled ? 'bg-emerald-50' : 'bg-gray-200/50'}`}>
                                      <Icon className={`h-3 w-3 ${isEnabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                                    </div>
                                    <span className={`text-[11px] ${isEnabled ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                      {module.label}
                                    </span>
                                  </div>
                                  
                                  {role.key === 'super_admin' ? (
                                    <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">
                                      Ativo
                                    </Badge>
                                  ) : (
                                    <Switch
                                      checked={isEnabled}
                                      onCheckedChange={() => toggleModule(module.key)}
                                      className="scale-75"
                                      data-checkbox
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
              })
            )}
          </div>

          {/* Fixed Footer - Always Visible */}
          <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white safe-area-bottom">
            <div className="flex items-center justify-between gap-2">
              {hasChanges && (
                <span className="text-[10px] text-amber-600 font-medium">
                  • Não salvo
                </span>
              )}
              {!hasChanges && <span />}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onClose}
                  className="h-8 text-xs px-3"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveChanges.mutate()}
                  disabled={!hasChanges || saveChanges.isPending || role.key === 'super_admin'}
                  className="h-8 text-xs px-3 bg-[#9C1E1E] hover:bg-[#9C1E1E]/90"
                >
                  {saveChanges.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
