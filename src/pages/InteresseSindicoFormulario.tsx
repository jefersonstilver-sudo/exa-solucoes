import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSindicoFormStore } from '@/components/interesse-sindico-form/formStore';
import FormStepIndicator from '@/components/interesse-sindico-form/FormStepIndicator';
import StepPredio from '@/components/interesse-sindico-form/StepPredio';
import StepSindico from '@/components/interesse-sindico-form/StepSindico';
import StepTermosPlaceholder from '@/components/interesse-sindico-form/StepTermosPlaceholder';
import '@/components/interesse-sindico-form/styles.css';

const InteresseSindicoFormulario: React.FC = () => {
  const { step, next, prev } = useSindicoFormStore();

  return (
    <div className="exa-theme font-inter sif-shell">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Cadastro de interesse — Síndico
          </h1>
          <p className="text-sm text-white/55 mt-2">
            Preencha em 3 etapas rápidas. Levará menos de 5 minutos.
          </p>
        </header>

        <div className="sif-card p-4 sm:p-6">
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
                {step === 2 && <StepTermosPlaceholder onPrev={prev} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteresseSindicoFormulario;
