
import React from 'react';
import { Menu, Bell, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserMenu from '@/components/user/UserMenu';
import { motion } from 'framer-motion';

interface ModernAdvertiserHeaderProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

const ModernAdvertiserHeader = ({ 
  onMenuClick, 
  isMobile 
}: ModernAdvertiserHeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-[#6B46C1] via-[#9333EA] to-[#A855F7] border-b border-purple-700/30 shadow-lg backdrop-blur-sm relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <div className="relative z-10 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {isMobile && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMenuClick}
                  className="text-white hover:bg-white/10 h-10 w-10 rounded-xl backdrop-blur-sm border border-white/20"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </motion.div>
            )}

            {!isMobile && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                  <img 
                    src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
                    alt="Indexa Logo" 
                    className="w-5 h-5 object-contain filter brightness-0 invert"
                  />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">Portal do Anunciante</h1>
                  <p className="text-white/80 text-xs">Gerencie suas campanhas e pedidos</p>
                </div>
              </div>
            )}

            {isMobile && (
              <div>
                <h1 className="text-white font-semibold text-lg">Portal do Anunciante</h1>
                <p className="text-white/80 text-xs">Bem-vindo de volta!</p>
              </div>
            )}
          </div>

          {/* Center Section - Search (Desktop Only) */}
          {!isMobile && (
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Buscar pedidos, campanhas..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 h-10 rounded-xl backdrop-blur-sm"
                />
              </div>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-10 w-10 rounded-xl backdrop-blur-sm border border-white/20 relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
              </Button>
            </motion.div>

            {/* Settings */}
            {!isMobile && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 h-10 w-10 rounded-xl backdrop-blur-sm border border-white/20"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </motion.div>
            )}

            {/* User Menu */}
            <div className="ml-2">
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                placeholder="Buscar..."
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 h-10 rounded-xl backdrop-blur-sm"
              />
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default ModernAdvertiserHeader;
