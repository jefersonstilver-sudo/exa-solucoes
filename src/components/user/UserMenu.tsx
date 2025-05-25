
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Lock, 
  LogOut, 
  LogIn, 
  UserPlus, 
  User as UserIcon, 
  ShieldCheck,
  LayoutDashboard,
  Users,
  Package,
  Building,
  Monitor,
  CheckCircle,
  ClipboardList,
  ListOrdered
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage, AvatarGlow } from '@/components/ui/avatar';
import { useUserSession } from '@/hooks/useUserSession';
import { ClientOnly } from '@/components/ui/client-only';

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const { user, isLoading, isLoggedIn, logout } = useUserSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    toast.success('Sessão encerrada com sucesso!');
  };

  // VERIFICAÇÃO RIGOROSA DO SUPER ADMIN
  const isSuperAdmin = user?.email === 'jefersonstilver@gmail.com' && user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  
  console.log('👤 UserMenu - Verificação de usuário:', {
    userEmail: user?.email,
    userRole: user?.role,
    isSuperAdmin,
    isAdmin,
    isClient,
    isLoggedIn
  });

  // Generate avatar initials from name or email
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
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    }
  };

  return (
    <ClientOnly fallback={<div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>}>
      {isLoading ? (
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative p-0 overflow-hidden border-0 text-white hover:bg-white/20 rounded-full h-10 w-10 md:h-12 md:w-12" 
              aria-label="Menu do usuário"
            >
              <AvatarGlow active={isLoggedIn}>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 15 
                  }}
                >
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-white/20">
                    <AvatarImage 
                      src={user?.avatar_url || ''} 
                      alt={user?.name || user?.email || "Usuário"}
                    />
                    <AvatarFallback 
                      className={isLoggedIn 
                        ? isSuperAdmin 
                          ? "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900" 
                          : isAdmin
                            ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                            : "bg-gradient-to-br from-[#3e1c85] to-[#4f28a1] text-white"
                        : "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700"
                      }
                    >
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
                className="w-[280px] sm:w-[320px] p-0 overflow-hidden rounded-2xl shadow-lg"
                align="end" 
                forceMount
                asChild
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={dropdownVariants}
                >
                  <div className={`${isSuperAdmin 
                    ? "bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white border border-amber-500/20"
                    : isAdmin
                      ? "bg-gradient-to-br from-purple-800 via-purple-900 to-purple-950 text-white border border-purple-500/20"
                      : "bg-gradient-to-br from-[#2a0d5c] via-[#3e1c85] to-[#4f28a1] text-white"
                  }`}>
                    {isLoggedIn ? (
                      <>
                        <DropdownMenuLabel className="font-normal p-4 border-b border-white/10">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold leading-none">{user?.name || "Usuário"}</p>
                              {isSuperAdmin && (
                                <ShieldCheck className="h-4 w-4 text-amber-400" />
                              )}
                              {isAdmin && (
                                <ShieldCheck className="h-4 w-4 text-purple-400" />
                              )}
                            </div>
                            <p className="text-xs text-white/70 leading-none truncate">
                              {user?.email}
                            </p>
                            {isSuperAdmin && (
                              <p className="text-xs text-amber-300 leading-none font-medium">
                                🔒 Super Administrador Master
                              </p>
                            )}
                            {isAdmin && (
                              <p className="text-xs text-purple-300 leading-none font-medium">
                                👑 Administrador
                              </p>
                            )}
                          </div>
                        </DropdownMenuLabel>
                        
                        <DropdownMenuGroup className="p-2">
                          {/* MENU PARA SUPER ADMIN */}
                          {isSuperAdmin && (
                            <>
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-500/20 hover:text-amber-300 focus:bg-amber-500/20 focus:text-amber-300">
                                <Link to="/super_admin" className="flex items-center">
                                  <ShieldCheck className="mr-3 h-5 w-5 text-amber-400" />
                                  <span className="font-medium">🔒 Master Control Panel</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-white/10" />
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-500/10 hover:text-amber-200 focus:bg-amber-500/10 focus:text-amber-200">
                                <Link to="/super_admin/dashboard" className="flex items-center">
                                  <LayoutDashboard className="mr-3 h-5 w-5" />
                                  <span className="font-medium">📊 Dashboard Administrativo</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-500/10 hover:text-amber-200 focus:bg-amber-500/10 focus:text-amber-200">
                                <Link to="/super_admin/users" className="flex items-center">
                                  <Users className="mr-3 h-5 w-5" />
                                  <span className="font-medium">👥 Gerenciar Usuários</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-500/10 hover:text-amber-200 focus:bg-amber-500/10 focus:text-amber-200">
                                <Link to="/super_admin/orders" className="flex items-center">
                                  <Package className="mr-3 h-5 w-5" />
                                  <span className="font-medium">📋 Gerenciar Pedidos</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-500/10 hover:text-amber-200 focus:bg-amber-500/10 focus:text-amber-200">
                                <Link to="/super_admin/buildings" className="flex items-center">
                                  <Building className="mr-3 h-5 w-5" />
                                  <span className="font-medium">🏢 Gerenciar Prédios</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-500/10 hover:text-amber-200 focus:bg-amber-500/10 focus:text-amber-200">
                                <Link to="/super_admin/panels" className="flex items-center">
                                  <Monitor className="mr-3 h-5 w-5" />
                                  <span className="font-medium">📺 Gerenciar Painéis</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-500/10 hover:text-amber-200 focus:bg-amber-500/10 focus:text-amber-200">
                                <Link to="/super_admin/approvals" className="flex items-center">
                                  <CheckCircle className="mr-3 h-5 w-5" />
                                  <span className="font-medium">✅ Aprovações</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-white/10" />
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-500/10 hover:text-amber-200 focus:bg-amber-500/10 focus:text-amber-200">
                                <Link to="/super_admin/configuracoes" className="flex items-center">
                                  <Settings className="mr-3 h-5 w-5" />
                                  <span className="font-medium">⚙️ Configurações do Sistema</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-amber-500/10 hover:text-amber-200 focus:bg-amber-500/10 focus:text-amber-200">
                                <Link to="/alterar-senha" className="flex items-center">
                                  <Lock className="mr-3 h-5 w-5" />
                                  <span className="font-medium">🔒 Alterar Senha</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-white/10" />
                              
                              <DropdownMenuItem 
                                onClick={handleLogout} 
                                className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-red-500/30 text-red-200 focus:bg-red-500/30 focus:text-red-200"
                              >
                                <LogOut className="mr-3 h-5 w-5" />
                                <span className="font-medium">🚪 Sair do Sistema</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* MENU PARA ADMIN REGULAR */}
                          {isAdmin && !isSuperAdmin && (
                            <>
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-500/20 hover:text-purple-200 focus:bg-purple-500/20 focus:text-purple-200">
                                <Link to="/super_admin/dashboard" className="flex items-center">
                                  <LayoutDashboard className="mr-3 h-5 w-5" />
                                  <span className="font-medium">📊 Dashboard Administrativo</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-500/20 hover:text-purple-200 focus:bg-purple-500/20 focus:text-purple-200">
                                <Link to="/super_admin/orders" className="flex items-center">
                                  <Package className="mr-3 h-5 w-5" />
                                  <span className="font-medium">📋 Gerenciar Pedidos</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-500/20 hover:text-purple-200 focus:bg-purple-500/20 focus:text-purple-200">
                                <Link to="/super_admin/buildings" className="flex items-center">
                                  <Building className="mr-3 h-5 w-5" />
                                  <span className="font-medium">🏢 Gerenciar Prédios</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-500/20 hover:text-purple-200 focus:bg-purple-500/20 focus:text-purple-200">
                                <Link to="/super_admin/panels" className="flex items-center">
                                  <Monitor className="mr-3 h-5 w-5" />
                                  <span className="font-medium">📺 Gerenciar Painéis</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-500/20 hover:text-purple-200 focus:bg-purple-500/20 focus:text-purple-200">
                                <Link to="/super_admin/approvals" className="flex items-center">
                                  <CheckCircle className="mr-3 h-5 w-5" />
                                  <span className="font-medium">✅ Aprovações</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-white/10" />
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-500/20 hover:text-purple-200 focus:bg-purple-500/20 focus:text-purple-200">
                                <Link to="/configuracoes" className="flex items-center">
                                  <Settings className="mr-3 h-5 w-5" />
                                  <span className="font-medium">⚙️ Configurações</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-purple-500/20 hover:text-purple-200 focus:bg-purple-500/20 focus:text-purple-200">
                                <Link to="/alterar-senha" className="flex items-center">
                                  <Lock className="mr-3 h-5 w-5" />
                                  <span className="font-medium">🔒 Alterar Senha</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-white/10" />
                              
                              <DropdownMenuItem 
                                onClick={handleLogout} 
                                className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-red-500/30 text-red-200 focus:bg-red-500/30 focus:text-red-200"
                              >
                                <LogOut className="mr-3 h-5 w-5" />
                                <span className="font-medium">🚪 Sair</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* MENU PARA CLIENT */}
                          {isClient && (
                            <>
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-white/10 hover:text-indexa-mint focus:bg-white/10 focus:text-indexa-mint">
                                <Link to="/anunciante/campanhas" className="flex items-center">
                                  <ClipboardList className="mr-3 h-5 w-5" />
                                  <span className="font-medium">📺 Minhas Campanhas</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-white/10 hover:text-indexa-mint focus:bg-white/10 focus:text-indexa-mint">
                                <Link to="/meus-pedidos" className="flex items-center">
                                  <ListOrdered className="mr-3 h-5 w-5" />
                                  <span className="font-medium">📋 Meus Pedidos</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-white/10" />
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-white/10 hover:text-indexa-mint focus:bg-white/10 focus:text-indexa-mint">
                                <Link to="/configuracoes" className="flex items-center">
                                  <Settings className="mr-3 h-5 w-5" />
                                  <span className="font-medium">⚙️ Configurações da Conta</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem asChild className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-white/10 hover:text-indexa-mint focus:bg-white/10 focus:text-indexa-mint">
                                <Link to="/alterar-senha" className="flex items-center">
                                  <Lock className="mr-3 h-5 w-5" />
                                  <span className="font-medium">🔒 Alterar Senha</span>
                                </Link>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="my-2 bg-white/10" />
                              
                              <DropdownMenuItem 
                                onClick={handleLogout} 
                                className="rounded-lg cursor-pointer p-3 transition-colors hover:bg-red-500/30 text-red-200 focus:bg-red-500/30 focus:text-red-200"
                              >
                                <LogOut className="mr-3 h-5 w-5" />
                                <span className="font-medium">🚪 Sair</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuGroup>
                      </>
                    ) : (
                      <>
                        <DropdownMenuLabel className="font-normal p-4 border-b border-white/10">
                          <div className="text-center space-y-1">
                            <p className="text-lg font-bold">Bem-vindo à Indexa</p>
                            <p className="text-xs text-white/70">
                              Entre para acessar todos os recursos
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        
                        <div className="p-3 space-y-2">
                          <Link 
                            to="/login" 
                            className="flex items-center justify-center p-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors w-full"
                            onClick={() => setOpen(false)}
                          >
                            <LogIn className="mr-2 h-5 w-5" />
                            <span>Entrar</span>
                          </Link>
                          
                          <Link 
                            to="/cadastro" 
                            className="flex items-center justify-center p-3 bg-indexa-mint hover:bg-indexa-mint-dark text-indexa-purple font-medium rounded-lg transition-colors w-full"
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
