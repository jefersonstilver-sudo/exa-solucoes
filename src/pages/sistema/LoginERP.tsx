import React from 'react';
import { motion } from 'framer-motion';
import ERPLoginForm from '@/components/sistema/ERPLoginForm';
import ERPCircuitBackground from '@/components/sistema/ERPCircuitBackground';

const LoginERP = () => {
  return (
    <div className="min-h-screen w-full flex">
      {/* Lado Esquerdo - Visual Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(355 68% 30%) 0%, hsl(355 68% 37%) 50%, hsl(355 68% 45%) 100%)'
        }}
      >
        {/* Background Circuit Pattern */}
        <ERPCircuitBackground />
        
        {/* Logo e Texto Central */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center"
          >
            {/* Logo EXA */}
            <div className="mb-4">
              <img 
                src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0"
                alt="EXA Logo"
                className="h-20 w-auto filter brightness-0 invert"
              />
            </div>
            
            {/* ERP Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="inline-block"
            >
              <span 
                className="text-white/90 font-semibold text-2xl tracking-[0.3em] uppercase"
                style={{ fontFamily: 'system-ui' }}
              >
                ERP
              </span>
            </motion.div>
            
            {/* Linha decorativa */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '80px' }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="h-0.5 bg-white/30 mx-auto mt-8"
            />
            
            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="text-white/60 text-sm mt-6 max-w-xs mx-auto"
            >
              Sistema de Gestão Empresarial
            </motion.p>
          </motion.div>
        </div>
        
        {/* Decoração inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </motion.div>

      {/* Lado Direito - Formulário */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 lg:px-16"
      >
        <div className="w-full max-w-md">
          {/* Logo para mobile */}
          <div className="lg:hidden mb-10 text-center">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, hsl(355 68% 30%) 0%, hsl(355 68% 37%) 100%)' }}
            >
              <span className="text-white font-bold text-2xl">exa</span>
            </div>
            <span className="block text-muted-foreground text-sm tracking-widest uppercase">ERP</span>
          </div>
          
          {/* Título */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Acesse sua conta
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Entre com seu email e senha para continuar
            </p>
          </motion.div>

          {/* Formulário */}
          <ERPLoginForm />
          
          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-10 text-center"
          >
            <p className="text-xs text-muted-foreground">
              Área restrita para administradores do sistema
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginERP;
