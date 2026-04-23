import React from 'react';
import { ArrowLeft, FileText, Lock } from 'lucide-react';

interface Props {
  onPrev: () => void;
}

export const StepTermosPlaceholder: React.FC<Props> = ({ onPrev }) => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Termos de aceite</h2>
        <p className="text-sm text-white/55 mt-1">Última etapa antes de enviar seu cadastro.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 max-h-72 overflow-y-auto text-sm text-white/65 leading-relaxed">
        <FileText size={20} className="text-[var(--exa-red,#c7141a)] mb-3" />
        <p className="font-medium text-white/80 mb-2">Termos completos serão disponibilizados em breve.</p>
        <p>
          Esta seção apresentará o termo de adesão completo da EXA Mídia, incluindo cláusulas sobre instalação do
          equipamento, uso compartilhado de imagem, exibição de campanhas publicitárias, comissionamento e duração da
          parceria.
        </p>
        <p className="mt-3 text-white/45">
          Conteúdo provisório — a versão definitiva será incluída na próxima atualização do formulário.
        </p>
      </div>

      <label className="flex items-center gap-3 opacity-50 cursor-not-allowed">
        <input type="checkbox" disabled className="w-5 h-5" />
        <span className="text-sm text-white/70">Li e aceito os termos da EXA Mídia</span>
      </label>

      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={onPrev} className="sif-btn-secondary flex items-center justify-center gap-2 sm:w-auto">
          <ArrowLeft size={18} /> Voltar
        </button>
        <button type="button" disabled aria-disabled className="sif-btn-primary flex-1 flex items-center justify-center gap-2">
          <Lock size={16} /> Enviar cadastro
        </button>
      </div>
      <p className="sif-help text-center">Esta etapa será ativada na próxima atualização.</p>
    </div>
  );
};

export default StepTermosPlaceholder;
