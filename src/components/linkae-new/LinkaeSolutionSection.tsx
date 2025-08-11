import React from 'react';
import { CalendarDays, ClipboardList, Edit3, Lightbulb, Rocket, Sparkles } from 'lucide-react';

const cardCls = 'rounded-2xl border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur p-6 hover-scale';

const LinkaeSolutionSection: React.FC = () => {
  return (
    <section id="como-funciona" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-indexa-purple">Como eliminamos o “não sei o que postar”</h2>
          <p className="mt-3 text-gray-700 dark:text-gray-300">Processo enxuto, resultado constante.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className={cardCls}>
            <div className="flex items-center gap-3 text-indexa-purple font-semibold"><ClipboardList className="h-5 w-5"/> 1. Diagnóstico guiado</div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Briefing simples que entende seu negócio, tom e objetivos.</p>
          </article>
          <article className={cardCls}>
            <div className="flex items-center gap-3 text-indexa-purple font-semibold"><CalendarDays className="h-5 w-5"/> 2. Calendário inteligente</div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">30 ideias/mês priorizadas por impacto e momento da sua audiência.</p>
          </article>
          <article className={cardCls}>
            <div className="flex items-center gap-3 text-indexa-purple font-semibold"><Sparkles className="h-5 w-5"/> 3. Conteúdo pronto</div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Artes e legendas editáveis + sugestões de ganchos e CTA.</p>
          </article>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={cardCls}>
            <div className="flex items-center gap-2 text-indexa-purple font-semibold"><Lightbulb className="h-4 w-4"/> Direção criativa</div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Linguagem, pilares e linhas editoriais alinhadas à marca.</p>
          </div>
          <div className={cardCls}>
            <div className="flex items-center gap-2 text-indexa-purple font-semibold"><Edit3 className="h-4 w-4"/> Artes + copy</div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Posts, carrosséis e roteiros com copy pronta para uso.</p>
          </div>
          <div className={cardCls}>
            <div className="flex items-center gap-2 text-indexa-purple font-semibold"><Rocket className="h-4 w-4"/> Performance</div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Sugestões de CTA e distribuição para acelerar resultados.</p>
          </div>
          <div className={cardCls}>
            <div className="flex items-center gap-2 text-indexa-purple font-semibold"><CalendarDays className="h-4 w-4"/> Agendamento</div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Pronto para publicar nas suas redes, sem fricção.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeSolutionSection;
