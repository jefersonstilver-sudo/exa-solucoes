import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { ZodError } from 'zod';

interface Props {
  error: ZodError | null;
  /** Mapa de path do schema -> rótulo amigável exibido ao usuário */
  fieldLabels: Record<string, string>;
  title?: string;
}

/**
 * Mostra de forma clara quais campos estão impedindo o avanço,
 * com rótulo amigável e o motivo extraído do schema Zod.
 */
const ValidationErrors: React.FC<Props> = ({
  error,
  fieldLabels,
  title = 'Não é possível continuar — revise os campos abaixo:',
}) => {
  if (!error) return null;

  // Deduplica por path (pega só o primeiro erro de cada campo)
  const seen = new Set<string>();
  const issues = error.issues
    .filter((iss) => {
      const key = iss.path.join('.');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((iss) => {
      const path = iss.path.join('.');
      const label = fieldLabels[path] || path || 'Campo';
      return { path, label, message: iss.message };
    });

  if (issues.length === 0) return null;

  return (
    <div className="sif-validation-box" role="alert" aria-live="polite">
      <div className="flex items-start gap-2">
        <AlertCircle size={18} className="shrink-0 mt-0.5 text-[#ef4444]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <ul className="mt-2 space-y-1.5">
            {issues.map((iss) => (
              <li key={iss.path} className="text-[13px] text-white/80 flex gap-2">
                <span className="text-[#fca5a5]">•</span>
                <span>
                  <strong className="text-white">{iss.label}:</strong>{' '}
                  <span className="text-white/70">{iss.message}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ValidationErrors;
