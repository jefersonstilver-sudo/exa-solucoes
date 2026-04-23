import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, Download } from 'lucide-react';
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
    <section className="section-glow pt-16 md:pt-20 lg:pt-28 pb-24 md:pb-32 lg:pb-40 px-5 md:px-8 lg:px-12">
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
          <div className="flex flex-col items-center gap-4">
            <Link to="/interessesindico/formulario" className="cta-red">
              Registrar interesse do meu prédio
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="/apresentacao-sindicos.pdf"
              download="Apresentacao-EXA-Sindicos.pdf"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/15 bg-white/[0.04] text-sm md:text-base font-semibold text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.08] transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar apresentação completa (PDF)
            </a>

            <p className="text-xs text-white/40 mt-1 text-center max-w-xs">
              Material detalhado para apresentar em assembleia ou ao conselho do condomínio.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ComoFuncionaSection;
