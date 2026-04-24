import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSindicoFormStore } from '@/components/interesse-sindico-form/formStore';
import FormStepIndicator from '@/components/interesse-sindico-form/FormStepIndicator';
import StepPredio from '@/components/interesse-sindico-form/StepPredio';
import StepSindico from '@/components/interesse-sindico-form/StepSindico';
import StepTermos from '@/components/interesse-sindico-form/StepTermos';
import ExitGuardFloating from '@/components/interesse-sindico-form/ExitGuardFloating';
import { useExitGuard } from '@/components/interesse-sindico-form/useExitGuard';
import '@/components/interesse-sindico-form/styles.css';

const InteresseSindicoFormulario: React.FC = () => {
  const { step, next, prev } = useSindicoFormStore();
  const { shouldGuard } = useExitGuard();

  const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

  // Scroll para o topo no mount e a cada mudança de etapa (0 → 1 → 2)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (shouldGuard()) {
      e.preventDefault();
      (window as any).__exaSindicoRequestExit?.('/');
    }
  };

  return (
    <div className="exa-theme font-inter sif-shell">
      <div className="max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex justify-center mb-6">
          <a href="/" aria-label="Ir para a página inicial EXA" onClick={handleLogoClick}>
            <img
              src={EXA_LOGO_URL}
              alt="EXA - Publicidade Inteligente"
              className="h-10 sm:h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            />
          </a>
        </div>
        <header className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Cadastro de interesse — Síndico
          </h1>
          <p className="text-sm text-white/55 mt-2">
            Preencha em 3 etapas rápidas. Levará menos de 5 minutos.
          </p>
        </header>

        <div className="sif-card p-4 sm:p-6 lg:p-8">
          <FormStepIndicator step={step} />
          <div className="mt-6 relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 0 && <StepPredio onNext={next} />}
                {step === 1 && <StepSindico onNext={next} onPrev={prev} />}
                {step === 2 && <StepTermos onPrev={prev} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ExitGuardFloating defaultTarget="/" />
    </div>
  );
};

export default InteresseSindicoFormulario;
