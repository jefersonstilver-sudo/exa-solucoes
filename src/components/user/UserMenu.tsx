import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Lock, LogOut, LogIn, UserPlus, User as UserIcon, ShieldCheck, LayoutDashboard, Users, Package, Building, Monitor, CheckCircle, ClipboardList, ListOrdered, Gift, Film, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage, AvatarGlow } from '@/components/ui/avatar';
import { useUserSession } from '@/hooks/useUserSession';
import { ClientOnly } from '@/components/ui/client-only';
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

  // Animation variants for dropdown content
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1] as const
      }
    },
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 1, 1] as const
      }
    }
  };
  return <ClientOnly fallback={<div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-300 animate-pulse border-2 border-white/20"></div>}>
      {isLoading ? <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-300 animate-pulse border-2 border-white/20"></div> : <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative p-0 overflow-hidden border-0 text-white hover:bg-white/20 rounded-full h-10 w-10 md:h-12 md:w-12 transition-all duration-200" aria-label="Menu do usuário">
              <AvatarGlow active={isLoggedIn}>
                <motion.div whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }} transition={{
              type: "spring",
              stiffness: 400,
              damping: 15
            }}>
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
            {open && <DropdownMenuContent className="w-[280px] sm:w-[320px] p-0 overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-200 z-[100]" align="end" forceMount asChild>
                <motion.div initial="hidden" animate="visible" exit="exit" variants={dropdownVariants}>
                  <div className="bg-white text-gray-900">
                    {isLoggedIn ? <>
                        <DropdownMenuLabel className="font-normal p-4 border-b border-gray-200">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold leading-none text-gray-900">{user?.name || user?.nome || "Usuário"}</p>
                              {isSuperAdmin && <ShieldCheck className="h-4 w-4 text-amber-600" />}
                              {isAdmin && <ShieldCheck className="h-4 w-4 text-blue-600" />}
                              {isAdminFinanceiro && <ShieldCheck className="h-4 w-4 text-green-600" />}
                              {isAdminMarketing && <ShieldCheck className="h-4 w-4 text-purple-600" />}
                            </div>
                            <p className="text-xs text-gray-600 leading-none truncate">
                              {user?.email}
                            </p>
                            {isSuperAdmin && <p className="text-xs text-amber-700 leading-none font-medium">
                                Super Administrador Master
                              </p>}
                            {isAdmin && <p className="text-xs text-blue-700 leading-none font-medium">
                                Administrador
                              </p>}
                            {isAdminFinanceiro && <p className="text-xs text-green-700 leading-none font-medium">
                                Administrador Financeiro
                              </p>}
                            {isAdminMarketing && <p className="text-xs text-purple-700 leading-none font-medium">
                                Administrador de Marketing
                              </p>}
                          </div>
                        </DropdownMenuLabel>
                        
                        <DropdownMenuGroup className="p-2">
                          {/* MENU PARA SUPER ADMIN */}
                          {isSuperAdmin && <>
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-50 text-gray-900 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700">
                                <Link to="/super_admin" className="flex items-center">
                                  <ShieldCheck className="mr-3 h-5 w-5 text-amber-600" />
                                  <span className="font-medium">Master Control Panel</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-50 text-gray-900 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700">
                                <Link to="/admin/monitoramento-ia/agentes" className="flex items-center">
                                  <Bot className="mr-3 h-5 w-5 text-purple-600" />
                                  <span className="font-medium">Módulo Agentes EXA</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-50 text-gray-900 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700">
                                <Link to="/super_admin" className="flex items-center">
                                  <LayoutDashboard className="mr-3 h-5 w-5 text-amber-600" />
                                  <span className="font-medium">Dashboard Administrativo</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-50 text-gray-900 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700">
                                <Link to="/super_admin/usuarios" className="flex items-center">
                                  <Users className="mr-3 h-5 w-5 text-amber-600" />
                                  <span className="font-medium">Gerenciar Usuários</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-50 text-gray-900 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700">
                                <Link to="/super_admin/pedidos" className="flex items-center">
                                  <Package className="mr-3 h-5 w-5 text-amber-600" />
                                  <span className="font-medium">Gerenciar Pedidos</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-50 text-gray-900 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700">
                                <Link to="/super_admin/predios" className="flex items-center">
                                  <Building className="mr-3 h-5 w-5 text-amber-600" />
                                  <span className="font-medium">Gerenciar Prédios</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-50 text-gray-900 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700">
                                <Link to="/super_admin/paineis" className="flex items-center">
                                  <Monitor className="mr-3 h-5 w-5 text-amber-600" />
                                  <span className="font-medium">Gerenciar Painéis</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-50 text-gray-900 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700">
                                <Link to="/super_admin/aprovacoes" className="flex items-center">
                                  <CheckCircle className="mr-3 h-5 w-5 text-amber-600" />
                                  <span className="font-medium">Aprovações</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-50 text-gray-900 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700">
                                <Link to="/super_admin/configuracoes" className="flex items-center">
                                  <Settings className="mr-3 h-5 w-5 text-amber-600" />
                                  <span className="font-medium">Configurações do Sistema</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-50 text-gray-900 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700">
                                <Link to="/alterar-senha" className="flex items-center">
                                  <Lock className="mr-3 h-5 w-5 text-amber-600" />
                                  <span className="font-medium">Alterar Senha</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-700">
                                <LogOut className="mr-3 h-5 w-5" />
                                <span className="font-medium">Sair do Sistema</span>
                              </DropdownMenuItem>
                            </>}

                          {/* MENU PARA ADMIN REGULAR */}
                          {isAdmin && !isSuperAdmin && <>
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-blue-50 text-gray-900 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700">
                                <Link to="/admin" className="flex items-center">
                                  <LayoutDashboard className="mr-3 h-5 w-5 text-blue-600" />
                                  <span className="font-medium">Dashboard Administrativo</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-blue-50 text-gray-900 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700">
                                <Link to="/admin/pedidos" className="flex items-center">
                                  <Package className="mr-3 h-5 w-5 text-blue-600" />
                                  <span className="font-medium">Gerenciar Pedidos</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-blue-50 text-gray-900 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700">
                                <Link to="/admin/predios" className="flex items-center">
                                  <Building className="mr-3 h-5 w-5 text-blue-600" />
                                  <span className="font-medium">Gerenciar Prédios</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-blue-50 text-gray-900 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700">
                                <Link to="/admin/paineis" className="flex items-center">
                                  <Monitor className="mr-3 h-5 w-5 text-blue-600" />
                                  <span className="font-medium">Gerenciar Painéis</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-blue-50 text-gray-900 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700">
                                <Link to="/admin/aprovacoes" className="flex items-center">
                                  <CheckCircle className="mr-3 h-5 w-5 text-blue-600" />
                                  <span className="font-medium">Aprovações</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-blue-50 text-gray-900 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700">
                                <Link to="/alterar-senha" className="flex items-center">
                                  <Lock className="mr-3 h-5 w-5 text-blue-600" />
                                  <span className="font-medium">Alterar Senha</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-700">
                                <LogOut className="mr-3 h-5 w-5" />
                                <span className="font-medium">Sair</span>
                              </DropdownMenuItem>
                            </>}

                          {/* MENU PARA ADMIN FINANCEIRO */}
                          {isAdminFinanceiro && <>
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-green-50 text-gray-900 hover:text-green-700 focus:bg-green-50 focus:text-green-700">
                                <Link to="/admin" className="flex items-center">
                                  <LayoutDashboard className="mr-3 h-5 w-5 text-green-600" />
                                  <span className="font-medium">Painel Financeiro</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-green-50 text-gray-900 hover:text-green-700 focus:bg-green-50 focus:text-green-700">
                                <Link to="/admin/pedidos" className="flex items-center">
                                  <Package className="mr-3 h-5 w-5 text-green-600" />
                                  <span className="font-medium">Pedidos</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-green-50 text-gray-900 hover:text-green-700 focus:bg-green-50 focus:text-green-700">
                                <Link to="/admin/beneficio-prestadores" className="flex items-center">
                                  <Gift className="mr-3 h-5 w-5 text-green-600" />
                                  <span className="font-medium">Benefícios Prestadores</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-green-50 text-gray-900 hover:text-green-700 focus:bg-green-50 focus:text-green-700">
                                <Link to="/admin/relatorios-financeiros" className="flex items-center">
                                  <CheckCircle className="mr-3 h-5 w-5 text-green-600" />
                                  <span className="font-medium">Relatórios Financeiros</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-green-50 text-gray-900 hover:text-green-700 focus:bg-green-50 focus:text-green-700">
                                <Link to="/alterar-senha" className="flex items-center">
                                  <Lock className="mr-3 h-5 w-5 text-green-600" />
                                  <span className="font-medium">Alterar Senha</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-700">
                                <LogOut className="mr-3 h-5 w-5" />
                                <span className="font-medium">Sair</span>
                              </DropdownMenuItem>
                            </>}

                          {/* MENU PARA ADMIN MARKETING */}
                          {isAdminMarketing && <>
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-50 text-gray-900 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700">
                                <Link to="/admin" className="flex items-center">
                                  <LayoutDashboard className="mr-3 h-5 w-5 text-purple-600" />
                                  <span className="font-medium">Painel de Marketing</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-50 text-gray-900 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700">
                                <Link to="/admin/predios" className="flex items-center">
                                  <Building className="mr-3 h-5 w-5 text-purple-600" />
                                  <span className="font-medium">Prédios</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-50 text-gray-900 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700">
                                <Link to="/admin/paineis" className="flex items-center">
                                  <Monitor className="mr-3 h-5 w-5 text-purple-600" />
                                  <span className="font-medium">Painéis Publicitários</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-50 text-gray-900 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700">
                                <Link to="/alterar-senha" className="flex items-center">
                                  <Lock className="mr-3 h-5 w-5 text-purple-600" />
                                  <span className="font-medium">Alterar Senha</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-700">
                                <LogOut className="mr-3 h-5 w-5" />
                                <span className="font-medium">Sair</span>
                              </DropdownMenuItem>
                            </>}

                          {/* MENU PARA CLIENT */}
                          {isClient && <>
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-gray-50 text-gray-900 hover:text-gray-700 focus:bg-gray-50 focus:text-gray-700">
                                
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-gray-50 text-gray-900 hover:text-gray-700 focus:bg-gray-50 focus:text-gray-700">
                                <Link to="/anunciante/pedidos" className="flex items-center">
                                  <ListOrdered className="mr-3 h-5 w-5 text-gray-600" />
                                  <span className="font-medium">Meus Pedidos</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-gray-50 text-gray-900 hover:text-gray-700 focus:bg-gray-50 focus:text-gray-700">
                                <Link to="/anunciante/configuracoes" className="flex items-center">
                                  <Settings className="mr-3 h-5 w-5 text-gray-600" />
                                  <span className="font-medium">Meu Perfil</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-gray-200" />
                              
                              <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-700">
                                <LogOut className="mr-3 h-5 w-5" />
                                <span className="font-medium">Sair</span>
                              </DropdownMenuItem>
                            </>}
                        </DropdownMenuGroup>
                      </> : <>
                        <DropdownMenuLabel className="font-normal p-4 border-b border-gray-200">
                          <div className="text-center space-y-1">
                            <p className="text-lg font-bold text-gray-900">Bem-vindo</p>
                            <p className="text-xs text-gray-600">
                              Entre ou crie sua conta para acessar todos os recursos
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        
                        <div className="p-3 space-y-2">
                          <Link to="/login" className="flex items-center justify-center p-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors w-full" onClick={() => setOpen(false)}>
                            <LogIn className="mr-2 h-5 w-5" />
                            <span>Entrar</span>
                          </Link>
                          
                          <Link to="/cadastro" className="flex items-center justify-center p-3 bg-indexa-purple hover:bg-indexa-purple-dark text-white font-medium rounded-lg transition-colors w-full" onClick={() => setOpen(false)}>
                            <UserPlus className="mr-2 h-5 w-5" />
                            <span>Criar Conta</span>
                          </Link>
                        </div>
                      </>}
                  </div>
                </motion.div>
              </DropdownMenuContent>}
          </AnimatePresence>
        </DropdownMenu>}
    </ClientOnly>;
};
export default UserMenu;