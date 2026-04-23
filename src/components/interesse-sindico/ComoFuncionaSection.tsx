import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import Reveal from './Reveal';

const STEPS = [
  {
    n: 1,
    title: 'Preencha o formulário',
    desc: 'Conte sobre seu prédio: localização, número de unidades, elevadores e seu contato como síndico.',
  },
  {
    n: 2,
    title: 'Análise e avaliação pela EXA',
    desc: 'Nossa equipe avalia o perfil do condomínio, fluxo de moradores e viabilidade técnica. A EXA decide se aprova.',
  },
  {
    n: 3,
    title: 'Visita técnica e contrato',
    desc: 'Se aprovado, agendamos visita ao prédio, alinhamos detalhes e assinamos o contrato de comodato.',
  },
  {
    n: 4,
    title: 'Instalação e ativação',
    desc: 'Painéis instalados nos elevadores, Wi-Fi configurado e seu canal de avisos liberado para uso.',
  },
];

const ComoFuncionaSection: React.FC = () => {
  return (
    <section className="section-glow py-16 md:py-20 lg:py-28 px-5 md:px-8 lg:px-12 safe-bottom">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <div className="section-label mb-6">04 · Processo</div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight tracking-tight mb-12">
            O caminho até a <span className="gradient-text">instalação.</span>
          </h2>
        </Reveal>

        <div className="mb-12">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={0.15 + i * 0.08}>
              <div className="timeline-step">
                <div className="timeline-number">{s.n}</div>
                <h3 className="text-lg md:text-xl font-bold mb-2 text-white">{s.title}</h3>
                <p className="text-sm md:text-base text-white/65 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div className="warning-box flex gap-3 mb-12">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--exa-red)]" />
            <p>
              <strong className="text-white">Registro sujeito à aprovação da EXA.</strong> O preenchimento do formulário representa manifestação de interesse, não garantia de instalação.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="flex justify-center">
            <Link to="/interessesindico/formulario" className="cta-red">
              Registrar interesse do meu prédio
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ComoFuncionaSection;
