import React from 'react';

const STEPS = ['Prédio', 'Síndico', 'Termos'];

interface Props {
  step: 0 | 1 | 2;
}

export const FormStepIndicator: React.FC<Props> = ({ step }) => {
  const pct = step === 0 ? 8 : step === 1 ? 50 : 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-1">
        {STEPS.map((label, i) => {
          const active = i <= step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                style={{
                  background: active
                    ? 'linear-gradient(135deg, var(--exa-red, #c7141a), var(--exa-bordo, #8b0e14))'
                    : 'rgba(255,255,255,0.08)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  boxShadow: active ? '0 4px 12px -4px rgba(199,20,26,0.6)' : 'none',
                }}
                aria-current={i === step ? 'step' : undefined}
              >
                {i + 1}
              </div>
              <span
                className="text-xs font-medium hidden sm:inline"
                style={{ color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)' }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="sif-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="sif-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default FormStepIndicator;
