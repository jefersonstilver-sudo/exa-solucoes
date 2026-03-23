import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Lock, LogOut, LogIn, UserPlus, User as UserIcon, ShieldCheck, LayoutDashboard, Users, Package, Building, Monitor, CheckCircle, ClipboardList, ListOrdered, Gift, Film, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage, AvatarGlow } from '@/components/ui/avatar';
import { useUserSession } from '@/hooks/useUserSession';
import { ClientOnly } from '@/components/ui/client-only';
import { useDynamicModulePermissions, MODULE_ROUTES } from '@/hooks/useDynamicModulePermissions';

// Glass menu item styles
const glassMenuItemBase = "mx-2 rounded-xl cursor-pointer p-3 transition-all duration-200 ease-out active:scale-[0.98]";
const glassMenuItemDefault = "text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 hover:shadow-sm focus:bg-gray-50/80 focus:text-gray-900";
const glassMenuItemDanger = "bg-red-50/50 hover:bg-red-100/80 text-red-600 hover:text-red-700 border border-red-100/50";

// Section Label Component
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 pt-4 pb-2">
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
      {children}
    </p>
  </div>
);

// Glass Separator Component
const GlassSeparator = () => (
  <DropdownMenuSeparator className="my-2 mx-4 bg-gradient-to-r from-transparent via-gray-200/80 to-transparent" />
);

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const {
    user,
    isLoading,
    isLoggedIn,
    logout
  } = useUserSession();
  const navigate = useNavigate();

  // Debug logs para identificar o problema
  console.log('👤 UserMenu Debug:', {
    isLoading,
    isLoggedIn,
    user,
    userEmail: user?.email,
    userName: user?.name,
    userRole: user?.role
  });
  const handleLogout = async () => {
    await logout();
    setOpen(false);
    toast.success('Sessão encerrada com sucesso!');
  };

  // VERIFICAÇÃO COMPLETA DE TODOS OS ROLES
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isAdminFinanceiro = user?.role === 'admin_financeiro';
  const isAdminMarketing = user?.role === 'admin_marketing';
  const isAnyAdmin = isSuperAdmin || isAdmin || isAdminFinanceiro || isAdminMarketing;
  const isClient = user?.role === 'client';

  // Generate avatar initials from name or email - MELHORADO
  const getInitials = () => {
    if (!user) return "?";
    if (user.name) {
      const parts = user.name.split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "?";
  };

  // CORES MELHORADAS baseadas no status do usuário
  const getAvatarColors = () => {
    if (!isLoggedIn) {
      return "bg-gray-500 text-white border-2 border-white/30";
    }
    if (isSuperAdmin) {
      return "bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-2 border-yellow-400/50";
    }
    if (isAdmin) {
      return "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-2 border-blue-400/50";
    }
    if (isClient) {
      return "bg-gradient-to-br from-[#3C1361] to-[#4A1888] text-white border-2 border-[#3C1361]/50";
    }
    return "bg-gradient-to-br from-gray-600 to-gray-700 text-white border-2 border-gray-400/50";
  };

  const { hasModuleAccess, isCEO } = useDynamicModulePermissions();

  // Get role badge info - usa departamento quando disponível
  const getRoleBadge = () => {
    if (isSuperAdmin) return { label: "MASTER", colors: "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200/50" };
    const dept = (user as any)?.departamento;
    if (dept) {
      return { label: dept.toUpperCase(), colors: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200/50" };
    }
    if (isAdmin) return { label: "ADMIN", colors: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200/50" };
    if (isAdminFinanceiro) return { label: "FINANCEIRO", colors: "bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border-green-200/50" };
    if (isAdminMarketing) return { label: "MARKETING", colors: "bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-700 border-purple-200/50" };
    return null;
  };

  // Menu items dinâmicos para admins não-CEO
  const adminMenuItems = useMemo(() => {
    if (isSuperAdmin || !isAnyAdmin) return [];
    
    // Módulos prioritários para mostrar no menu rápido
    const menuModules = [
      { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { key: 'pedidos', icon: Package, label: 'Pedidos' },
      { key: 'propostas', icon: ClipboardList, label: 'Propostas' },
      { key: 'contatos', icon: Users, label: 'Contatos' },
      { key: 'predios', icon: Building, label: 'Prédios' },
      { key: 'paineis', icon: Monitor, label: 'Painéis' },
      { key: 'aprovacoes', icon: CheckCircle, label: 'Aprovações' },
      { key: 'videos_anunciantes', icon: Film, label: 'Vídeos' },
      { key: 'beneficios', icon: Gift, label: 'Benefícios' },
      { key: 'relatorios', icon: CheckCircle, label: 'Relatórios' },
    ];
    
    return menuModules.filter(m => hasModuleAccess(m.key));
  }, [isSuperAdmin, isAnyAdmin, hasModuleAccess]);

  const roleBadge = getRoleBadge();

  // Animation variants for dropdown content - Enhanced with blur
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -8,
      scale: 0.96,
      filter: "blur(4px)"
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.25,
        ease: [0.23, 1, 0.32, 1] as const
      }
    },
    exit: {
      opacity: 0,
      y: -4,
      scale: 0.98,
      filter: "blur(2px)",
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 1, 1] as const
      }
    }
  };

  return (
    <ClientOnly fallback={<div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-300 animate-pulse border-2 border-white/20"></div>}>
      {isLoading ? (
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-300 animate-pulse border-2 border-white/20"></div>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative p-0 overflow-hidden border-0 text-white hover:bg-white/20 rounded-full h-10 w-10 md:h-12 md:w-12 transition-all duration-200" aria-label="Menu do usuário">
              <AvatarGlow active={isLoggedIn}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-white/30 transition-all duration-200">
                    <AvatarImage src={user?.avatar_url || ''} alt={user?.name || user?.email || "Usuário"} />
                    <AvatarFallback className={`font-bold text-sm ${getAvatarColors()} transition-all duration-200`}>
                      {isLoggedIn ? getInitials() : <UserIcon className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </AvatarGlow>
            </Button>
          </DropdownMenuTrigger>
          
          <AnimatePresence>
            {open && (
              <DropdownMenuContent 
                className="w-[300px] sm:w-[340px] p-0 overflow-hidden rounded-3xl 
                  bg-white/95 backdrop-blur-xl border border-white/50
                  shadow-[0_8px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.6)_inset]
                  max-h-[calc(100vh-100px)] overflow-y-auto z-[110] mt-2 sm:mt-0" 
                align="end" 
                sideOffset={12}
                forceMount
              >
                <motion.div initial="hidden" animate="visible" exit="exit" variants={dropdownVariants}>
                  <div className="text-gray-900">
                    {isLoggedIn ? (
                      <>
                        {/* User Header - Glassmorphism Style */}
                        <DropdownMenuLabel className="font-normal p-5 pb-4 border-b border-gray-100/80 bg-gradient-to-b from-gray-50/80 to-white/0">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 ring-2 ring-[#9C1E1E]/20 shadow-lg">
                              <AvatarImage src={user?.avatar_url || ''} alt={user?.name || "Usuário"} />
                              <AvatarFallback className={`font-bold text-base ${getAvatarColors()}`}>
                                {getInitials()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-gray-900 truncate">
                                {user?.name || user?.nome || "Usuário"}
                              </p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {user?.email}
                              </p>
                              {roleBadge && (
                                <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 
                                  rounded-full text-[10px] font-medium tracking-wide
                                  ${roleBadge.colors} border`}>
                                  <ShieldCheck className="h-3 w-3" />
                                  {roleBadge.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </DropdownMenuLabel>
                        
                        <DropdownMenuGroup className="py-2">
                          {/* MENU PARA SUPER ADMIN */}
                          {isSuperAdmin && (
                            <>
                              <SectionLabel>Acesso Rápido</SectionLabel>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/super_admin" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <ShieldCheck className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Master Control Panel</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/admin/monitoramento-ia/agentes" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <Bot className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Módulo Agentes EXA</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <GlassSeparator />
                              
                              <SectionLabel>Gerenciamento</SectionLabel>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/super_admin" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <LayoutDashboard className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Dashboard Administrativo</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/super_admin/usuarios" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <Users className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Gerenciar Usuários</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/super_admin/pedidos" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <Package className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Gerenciar Pedidos</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/super_admin/predios" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <Building className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Gerenciar Prédios</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/super_admin/paineis" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <Monitor className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Gerenciar Painéis</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/super_admin/aprovacoes" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <CheckCircle className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Aprovações</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <GlassSeparator />
                              
                              <SectionLabel>Configurações</SectionLabel>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/super_admin/configuracoes" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <Settings className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Configurações do Sistema</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/alterar-senha" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <Lock className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Alterar Senha</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <GlassSeparator />
                              
                              <DropdownMenuItem 
                                onClick={handleLogout} 
                                className={`${glassMenuItemBase} ${glassMenuItemDanger} mb-2`}
                              >
                                <div className="flex items-center">
                                  <div className="mr-3 p-2 rounded-lg bg-red-100/80">
                                    <LogOut className="h-4 w-4" />
                                  </div>
                                  <span className="text-sm font-medium">Sair do Sistema</span>
                                </div>
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* MENU DINÂMICO PARA ADMINS NÃO-CEO */}
                          {isAnyAdmin && !isSuperAdmin && (
                            <>
                              <SectionLabel>Acesso Rápido</SectionLabel>
                              
                              {adminMenuItems.map((item) => (
                                <DropdownMenuItem key={item.key} asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                  <Link to={MODULE_ROUTES[item.key]?.path || '/admin'} className="flex items-center group">
                                    <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-blue-500/10 transition-colors duration-200">
                                      <item.icon className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                    <span className="text-sm font-medium">{item.label}</span>
                                  </Link>
                                </DropdownMenuItem>
                              ))}
                              
                              {adminMenuItems.length === 0 && (
                                <div className="px-4 py-3 text-xs text-gray-400 text-center">
                                  Nenhum módulo habilitado
                                </div>
                              )}
                              
                              <GlassSeparator />
                              
                              <SectionLabel>Conta</SectionLabel>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/admin/meu-perfil" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-blue-500/10 transition-colors duration-200">
                                    <UserIcon className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Meu Perfil</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/alterar-senha" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-blue-500/10 transition-colors duration-200">
                                    <Lock className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Alterar Senha</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <GlassSeparator />
                              
                              <DropdownMenuItem 
                                onClick={handleLogout} 
                                className={`${glassMenuItemBase} ${glassMenuItemDanger} mb-2`}
                              >
                                <div className="flex items-center">
                                  <div className="mr-3 p-2 rounded-lg bg-red-100/80">
                                    <LogOut className="h-4 w-4" />
                                  </div>
                                  <span className="text-sm font-medium">Sair</span>
                                </div>
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* MENU PARA CLIENT */}
                          {isClient && (
                            <>
                              <SectionLabel>Minha Conta</SectionLabel>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/anunciante/pedidos" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <ListOrdered className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Meus Pedidos</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <GlassSeparator />
                              
                              <SectionLabel>Configurações</SectionLabel>
                              
                              <DropdownMenuItem asChild className={`${glassMenuItemBase} ${glassMenuItemDefault}`}>
                                <Link to="/anunciante/configuracoes" className="flex items-center group">
                                  <div className="mr-3 p-2 rounded-lg bg-gray-100/80 group-hover:bg-[#9C1E1E]/10 transition-colors duration-200">
                                    <Settings className="h-4 w-4 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
                                  </div>
                                  <span className="text-sm font-medium">Meu Perfil</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <GlassSeparator />
                              
                              <DropdownMenuItem 
                                onClick={handleLogout} 
                                className={`${glassMenuItemBase} ${glassMenuItemDanger} mb-2`}
                              >
                                <div className="flex items-center">
                                  <div className="mr-3 p-2 rounded-lg bg-red-100/80">
                                    <LogOut className="h-4 w-4" />
                                  </div>
                                  <span className="text-sm font-medium">Sair</span>
                                </div>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuGroup>
                      </>
                    ) : (
                      <>
                        {/* Welcome Header - Glassmorphism Style */}
                        <div className="p-6 text-center bg-gradient-to-b from-gray-50/50 to-transparent border-b border-gray-100/80">
                          <div className="inline-flex p-3 rounded-2xl bg-gray-100/80 mb-3">
                            <UserIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900">Bem-vindo</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Acesse sua conta para continuar
                          </p>
                        </div>
                        
                        <div className="p-4 space-y-3">
                          <Link 
                            to="/login" 
                            className="flex items-center justify-center p-3 
                              bg-white hover:bg-gray-50
                              text-gray-900 font-medium rounded-xl 
                              border border-gray-200 hover:border-gray-300
                              shadow-sm hover:shadow transition-all duration-200 w-full" 
                            onClick={() => setOpen(false)}
                          >
                            <LogIn className="mr-2 h-5 w-5" />
                            <span>Entrar</span>
                          </Link>
                          
                          <Link 
                            to="/cadastro" 
                            className="flex items-center justify-center p-3 
                              bg-gradient-to-r from-[#9C1E1E] to-[#B52525] 
                              hover:from-[#8B1A1A] hover:to-[#9C1E1E]
                              text-white font-medium rounded-xl 
                              shadow-lg shadow-[#9C1E1E]/20
                              transition-all duration-200 w-full" 
                            onClick={() => setOpen(false)}
                          >
                            <UserPlus className="mr-2 h-5 w-5" />
                            <span>Criar Conta</span>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </DropdownMenuContent>
            )}
          </AnimatePresence>
        </DropdownMenu>
      )}
    </ClientOnly>
  );
};

export default UserMenu;
