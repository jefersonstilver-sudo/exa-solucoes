import React from 'react';
import Reveal from './Reveal';
import DividerGlow from './DividerGlow';

const BENEFITS = [
  {
    icon: '🌐',
    title: 'Wi-Fi gratuito para os moradores',
    desc: 'Conexão liberada no hall e nos elevadores, cortesia do painel EXA.',
  },
  {
    icon: '📢',
    title: 'Canal oficial de avisos',
    desc: 'Comunicados do síndico publicados em segundos e vistos por todos.',
  },
  {
    icon: '💰',
    title: 'Zero custo para o condomínio',
    desc: 'Instalação, manutenção e operação por conta da EXA. Sem mensalidade.',
  },
  {
    icon: '🏢',
    title: 'Prédio visivelmente mais moderno',
    desc: 'Tecnologia que valoriza o imóvel e melhora a percepção da gestão.',
  },
];

const BeneficiosSection: React.FC = () => {
  return (
    <section className="section-glow py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="section-label mb-6">03 · Benefícios</div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-12">
            O que seu condomínio <span className="gradient-text">ganha.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={0.15 + i * 0.08}>
              <div className="benefit-card h-full">
                <div className="benefit-icon">{b.icon}</div>
                <h3 className="text-lg md:text-xl font-bold mb-2 text-white relative z-10">{b.title}</h3>
                <p className="text-sm md:text-base text-white/65 leading-relaxed relative z-10">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <DividerGlow className="mt-20" />
      </div>
    </section>
  );
};

export default BeneficiosSection;
