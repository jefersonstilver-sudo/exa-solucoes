import React from 'react';
import type { RefObject } from 'react';
import LinkaeForm from '@/components/linkae/LinkaeForm';

interface CTAFormSectionProps {
  formRef: RefObject<HTMLElement>;
}

const CTAFormSection: React.FC<CTAFormSectionProps> = ({ formRef }) => {
  return (
    <section ref={formRef} className="py-16 md:py-24 bg-white/60 dark:bg-white/5">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-indexa-purple">
            Vamos eliminar de vez o “não sei o que postar”
          </h2>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            Preencha o briefing rápido e receba seu primeiro calendário.
          </p>
        </div>

        <article className="rounded-2xl border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur p-6">
          <LinkaeForm formRef={formRef} />
        </article>
      </div>
    </section>
  );
};

export default CTAFormSection;
