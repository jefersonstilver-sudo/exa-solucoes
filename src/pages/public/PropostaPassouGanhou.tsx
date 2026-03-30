import React, { useEffect, useRef, useCallback } from 'react';
import passouGanhouLogo from '@/assets/passou-ganhou-logo.png';
import { Helmet } from 'react-helmet-async';

/* ── animate-on-scroll helper ── */
const useScrollReveal = () => {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const setRef = useCallback((el: HTMLElement | null) => {
    if (el && !refs.current.includes(el)) refs.current.push(el);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
        }
      }),
      { threshold: 0.12 }
    );
    refs.current.forEach((r) => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);

  return setRef;
};

/* ── colour constants ── */
const C = {
  purple: '#5B2D91',
  purpleLight: '#7B3DBB',
  teal: '#3BBFA0',
  tealDark: '#2A9A82',
  bg: '#080808',
  card: '#111111',
  cardAlt: '#161616',
  border: '#222222',
  text: '#e0e0e0',
  muted: '#888888',
  white: '#ffffff',
} as const;

const hidden: React.CSSProperties = { opacity: 0, transform: 'translateY(32px)', transition: 'opacity .7s ease, transform .7s ease' };

/* ── tiny reusable pieces ── */
const Badge = ({ children, color = C.purple }: { children: React.ReactNode; color?: string }) => (
  <span style={{ background: color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, letterSpacing: 1, textTransform: 'uppercase' }}>{children}</span>
);

const SectionTag = ({ num, label }: { num: string; label: string }) => (
  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 48, fontWeight: 800, background: `linear-gradient(135deg,${C.purple},${C.teal})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{num}</span>
    <Badge>{label}</Badge>
  </div>
);

const StatBox = ({ value, label }: { value: string; label: string }) => (
  <div style={{ textAlign: 'center', padding: 16 }}>
    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 36, fontWeight: 800, background: `linear-gradient(135deg,${C.teal},${C.purpleLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</div>
    <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{label}</div>
  </div>
);

const ActionTag = ({ children }: { children: React.ReactNode }) => (
  <span style={{ display: 'inline-block', background: C.cardAlt, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, padding: '4px 12px', borderRadius: 8, margin: '3px 4px 3px 0' }}>{children}</span>
);

/* ── main page ── */
const PropostaPassouGanhou: React.FC = () => {
  const reveal = useScrollReveal();

  const sectionStyle: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '80px 24px' };
  const h2Style: React.CSSProperties = { fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: C.white, lineHeight: 1.15, marginBottom: 16 };
  const cardStyle: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, marginBottom: 16 };
  const gridTwo: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 };

  return (
    <>
      <Helmet>
        <title>Proposta Estratégica — Linkaê × Passou Ganhou — FESPOP 2026</title>
        <meta name="robots" content="noindex, nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      <div style={{ background: C.bg, color: C.text, fontFamily: '"DM Sans", sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* ═══ NAV ═══ */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,8,.75)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={passouGanhouLogo} alt="Passou Ganhou" style={{ height: 36, objectFit: 'contain' }} />
            <span style={{ color: C.muted, fontSize: 14 }}>×</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: C.teal }}>linkaê</span>
          </div>
          <Badge color={C.tealDark}>FESPOP 2026</Badge>
        </nav>

        {/* ═══ HERO ═══ */}
        <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px', background: `radial-gradient(ellipse at 30% 20%, ${C.purple}33 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${C.teal}22 0%, transparent 60%), ${C.bg}` }}>
          <div style={{ maxWidth: 900 }}>
            <Badge>PROPOSTA ESTRATÉGICA 2026</Badge>
            <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(36px,6vw,72px)', fontWeight: 800, color: C.white, lineHeight: 1.05, margin: '24px 0 20px' }}>
              O Oeste do Paraná<br />não paga mais.
            </h1>
            <p style={{ color: C.muted, fontSize: 18, maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.7 }}>
              Estratégia de crescimento e dominação regional da Passou Ganhou no Oeste do Paraná, com ativação âncora na FESPOP 2026 — elaborada pela Linkaê Marketing.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              <a href="#decisao" style={{ display: 'inline-block', padding: '14px 32px', background: `linear-gradient(135deg,${C.purple},${C.purpleLight})`, color: '#fff', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>Ver decisão estratégica →</a>
              <a href="#frentes" style={{ display: 'inline-block', padding: '14px 32px', border: `1px solid ${C.border}`, color: C.text, borderRadius: 12, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>As 2 frentes</a>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0, marginTop: 56, background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <StatBox value="240 k" label="Pessoas na FESPOP" />
              <StatBox value="R$18 M" label="Volume transacionado estimado" />
              <StatBox value="R$648 k" label="MDR estimado no evento" />
              <StatBox value="90 Dias" label="Até a FESPOP" />
            </div>
          </div>
        </section>

        {/* ═══ CONTEXTO OPERACIONAL ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, ...hidden } as any}>
          <SectionTag num="00" label="CONTEXTO OPERACIONAL" />
          <h2 style={h2Style}>Onde estamos agora</h2>
          <p style={{ color: C.muted, maxWidth: 750, lineHeight: 1.8, marginBottom: 32 }}>Antes de planejar, é preciso enxergar com clareza o ponto de partida. Esses são os fatos hoje — sem filtro.</p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: C.muted, fontWeight: 600 }}>ITEM</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: C.muted, fontWeight: 600 }}>STATUS ATUAL</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', color: C.muted, fontWeight: 600, width: 90 }}>SITUAÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Estabelecimentos credenciados em Foz', 'Zero — início do zero', '🔴'],
                  ['App disponível para download', 'Sim (iOS e Android)', '🟢'],
                  ['Dias até a FESPOP', '60 a 90 dias', '🟡'],
                  ['Parceria com Abrasel', 'Em negociação', '🟡'],
                  ['Stand na FESPOP', 'Em negociação', '🟡'],
                  ['Canais digitais ativos', 'Apenas Instagram', '🟡'],
                  ['Verba Linkaê aprovada', 'Em negociação', '🟡'],
                ].map(([item, status, sit], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 8px', color: C.white, fontWeight: 500 }}>{item}</td>
                    <td style={{ padding: '12px 8px', color: C.text }}>{status}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: 16 }}>{sit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ 01 — DECISÃO ═══ */}
        <section id="decisao" style={{ ...sectionStyle }} ref={reveal} {...{ style: { ...sectionStyle, ...hidden } } as any}>
          <SectionTag num="01" label="DECISÃO PRIORITÁRIA" />
          <h2 style={h2Style}>A decisão que define<br />tudo o que vem depois</h2>
          <p style={{ color: C.muted, maxWidth: 700, lineHeight: 1.8, marginBottom: 32 }}>Antes de qualquer ação de campo, existe uma decisão financeira que o Magno precisa tomar com base em dados — não em feeling.</p>

          <div style={gridTwo}>
            {/* Opção A */}
            <div style={{ ...cardStyle, borderColor: C.border }}>
              <Badge color={C.border}>OPÇÃO A</Badge>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 28, fontWeight: 800, color: C.white, margin: '12px 0 8px' }}>R$ 350.000</h3>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>Patrocínio sem maquininha. Exposição de marca sólida — mas sem capturar o MDR do evento. O retorno fica 100% em brand equity, sem receita direta.</p>
            </div>
            {/* Opção B */}
            <div style={{ ...cardStyle, border: `2px solid ${C.teal}`, position: 'relative' }}>
              <Badge color={C.tealDark}>RECOMENDADA</Badge>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 28, fontWeight: 800, color: C.white, margin: '12px 0 8px' }}>R$ 500.000</h3>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>Patrocínio com maquininha operando no evento. Exposição de marca + R$648k em MDR estimado. O patrocínio se paga com R$148k de lucro — fora downloads e leads.</p>
            </div>
          </div>

          {/* Math box */}
          <div ref={reveal} style={{ ...cardStyle, marginTop: 32, ...hidden } as any}>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 16 }}>A matemática do patrocínio de R$500k</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {[
                  ['Volume total estimado (240k × R$75)', 'R$ 18.000.000'],
                  ['60% PIX/Débito × 2% MDR', 'R$ 216.000'],
                  ['40% Crédito × 6% MDR', 'R$ 432.000'],
                  ['Total MDR estimado no evento', 'R$ 648.000'],
                  ['Investimento no patrocínio', '− R$ 500.000'],
                ].map(([l, v], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 0', color: C.text }}>{l}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: C.white }}>{v}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '14px 0', fontWeight: 700, color: C.teal, fontSize: 16 }}>Lucro líquido do evento</td>
                  <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 800, color: C.teal, fontSize: 20 }}>+ R$ 148.000</td>
                </tr>
              </tbody>
            </table>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 16, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <strong style={{ color: C.white }}>Conclusão:</strong> O patrocínio de R$500k não é um custo de marketing. É um investimento que se paga dentro do evento com R$148.000 de sobra — fora o valor de marca, os 400+ downloads qualificados e os leads de lojistas gerados.
            </p>
          </div>

          {/* Tabela de itens incluídos */}
          <div ref={reveal} style={{ ...cardStyle, marginTop: 24, overflowX: 'auto', ...hidden } as any}>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 16 }}>O que inclui o patrocínio</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: C.muted, fontWeight: 600 }}>ITEM INCLUÍDO</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: C.muted, fontWeight: 600 }}>APLICAÇÃO ESTRATÉGICA</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', color: C.muted, fontWeight: 600, width: 70 }}>R$350K</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', color: C.muted, fontWeight: 600, width: 70 }}>R$500K</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Logo no LED do palco principal', 'Autoridade de marca — mesma altura dos artistas', true, true],
                  ['Logo em toda estrutura da feira', 'Onipresença visual — consumidor vê', true, true],
                  ['Stand na entrada do evento', '100% do público passa pela entrada — posição máxima', true, true],
                  ['Sorteios e brindes', 'Gamificação + coleta de cadastros', true, true],
                  ['Mascote no evento', 'Geração de conteúdo + interação física', true, true],
                  ['Rádio interna + TV interna', 'Menções ao longo de todos os dias + entrevistas', true, true],
                  ['Redes sociais, outdoors, jornais, TV', 'Reconhecimento pré-evento na região', true, true],
                  ['Maquininha operando no evento', 'R$648k em MDR estimado — patrocínio se paga com lucro', false, true],
                ].map(([item, app, a, b], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 8px', color: C.white, fontWeight: 500 }}>{item as string}</td>
                    <td style={{ padding: '10px 8px', color: C.muted }}>{app as string}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 16 }}>{a ? '✓' : '✗'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 16, color: C.teal }}>{b ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ 02 — 2 FRENTES ═══ */}
        <section id="frentes" ref={reveal} style={{ ...sectionStyle, ...hidden } as any}>
          <SectionTag num="02" label="ESTRUTURA ESTRATÉGICA" />
          <h2 style={h2Style}>As 2 frentes de atuação</h2>
          <p style={{ color: C.muted, maxWidth: 750, lineHeight: 1.8, marginBottom: 32 }}>A Linkaê opera em duas frentes simultâneas e interdependentes: construção de base antes da FESPOP e ativação massiva durante o evento. Nenhuma funciona sem a outra.</p>

          <div style={gridTwo}>
            <div style={cardStyle}>
              <Badge color={C.purple}>01 · PRÉ-FESPOP</Badge>
              <h4 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: '12px 0 8px' }}>Semanas 1 a 10 · Construção de Base</h4>
              <ul style={{ color: C.muted, fontSize: 14, lineHeight: 2, paddingLeft: 18 }}>
                <li>10 Estabelecimentos Fundadores (fluxo + visibilidade)</li>
                <li>Parceria Abrasel formalizada</li>
                <li>30-40 credenciamentos nos corredores dominantes</li>
                <li>TikTok + WhatsApp + conceito "Foz não paga mais"</li>
                <li>Kit PDV + ativação assistida</li>
                <li>5-10 embaixadores informais</li>
              </ul>
            </div>
            <div style={{ ...cardStyle, border: `1px solid ${C.teal}40` }}>
              <Badge color={C.tealDark}>02 · FESPOP ATIVAÇÃO</Badge>
              <h4 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: '12px 0 8px' }}>Semanas 11 a 13 · 240 mil pessoas · 4 dias</h4>
              <ul style={{ color: C.muted, fontSize: 14, lineHeight: 2, paddingLeft: 18 }}>
                <li>Stand em 3 zonas (Atração, Engajamento, Ancoragem)</li>
                <li>400 downloads assistidos com script comportamental</li>
                <li>50-80 leads de lojistas</li>
                <li>Maquininha operando → R$648k MDR</li>
                <li>Gamificação ao vivo + sorteios</li>
                <li>Cobertura total mídia regional</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══ 03 — CRONOGRAMA ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, ...hidden } as any}>
          <SectionTag num="03" label="CRONOGRAMA" />
          <h2 style={h2Style}>90 dias. Do zero à dominação.</h2>
          <p style={{ color: C.muted, maxWidth: 750, lineHeight: 1.8, marginBottom: 40 }}>A FESPOP não pode ser o ponto de partida da marca em Foz. Precisa ser a consolidação de algo que já começou.</p>

          {/* Phases */}
          {[
            { phase: 'FASE 1 · URGENTE', title: 'Decisão + Base', period: 'Semanas 1 a 3 · Primeiros 21 dias', color: '#ef4444', items: ['Fechar o patrocínio de R$500k com uso da maquininha.', 'Abrir TikTok e WhatsApp.', 'Mapear e abordar os 10 Estabelecimentos Fundadores.', 'Publicar primeiros conteúdos com o conceito "Foz não paga mais".'], tags: ['Fechar patrocínio FESPOP R$500k', 'Abrir TikTok + WhatsApp', '10 Fundadores abordados', 'Conceito criativo validado'] },
            { phase: 'FASE 2 · CONSTRUÇÃO', title: 'Densidade + Orgânico', period: 'Semanas 4 a 7 · Dias 22 ao 49', color: '#f59e0b', items: ['Fechar Abrasel até semana 5.', 'Concentrar 30 novos credenciamentos nos 2 corredores dominantes.', 'Iniciar ativação assistida no PDV.', 'Lançar série "Quem já passou, ganhou" no TikTok e Reels.'], tags: ['Abrasel formalizada', '30-40 estabelecimentos', 'Série de vídeos no ar', 'Kit PDV distribuído'] },
            { phase: 'FASE 3 · AUTORIDADE', title: 'Movimento + Preparação', period: 'Semanas 8 a 10 · Dias 50 ao 70', color: C.purple, items: ['Ativar 5-10 embaixadores informais.', 'Lançar série "Meus pontos, meu desconto".', 'Treinar ativadores da FESPOP com script comportamental.', 'Preparar estrutura de stand e materiais.'], tags: ['5-10 embaixadores ativados', 'Ativadores treinados', 'Estrutura do stand', 'Materiais finalizados'] },
            { phase: 'EVENTO ÂNCORA', title: 'FESPOP 2026', period: 'Semanas 11 a 13 · 4 dias · 240k pessoas', color: C.teal, items: ['Ativação completa com maquininha operando, stand em 3 zonas, gamificação ao vivo, captação de leads, entrevistas na TV interna e cobertura total de mídia regional.'], tags: ['400 downloads qualificados', '50-80 leads lojistas', 'R$648k MDR estimado'] },
            { phase: 'FASE 5 · CONSOLIDAÇÃO', title: 'Pós-FESPOP', period: 'Semanas 14 a 16 · D+1 ao D+30', color: '#6366f1', items: ['Nurturing estruturado dos downloads: push imediata, indicação viral D+3, expansão D+7, lembrete D+14, marco 30 dias.', 'Conversão dos leads de lojistas com follow-up individual.'], tags: ['Nurturing D+0 ao D+30', 'Conversão de leads', '15-25 novos credenciamentos'] },
          ].map((p, i) => (
            <div key={i} ref={reveal} style={{ ...cardStyle, borderLeft: `4px solid ${p.color}`, marginBottom: 20, ...hidden } as any}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Badge color={p.color}>{p.phase}</Badge>
                <span style={{ color: C.muted, fontSize: 13 }}>{p.period}</span>
              </div>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 10 }}>{p.title}</h3>
              <ul style={{ color: C.muted, fontSize: 14, lineHeight: 1.9, paddingLeft: 18, marginBottom: 12 }}>
                {p.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
              <div>{p.tags.map((t, j) => <ActionTag key={j}>{t}</ActionTag>)}</div>
            </div>
          ))}
        </section>

        {/* ═══ 04 — STAND ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, ...hidden } as any}>
          <SectionTag num="04" label="ARQUITETURA DO STAND" />
          <h2 style={h2Style}>O stand não é um balcão.<br />É um funil.</h2>
          <p style={{ color: C.muted, maxWidth: 750, lineHeight: 1.8, marginBottom: 32 }}>Download assistido com script comportamental = 60-70% de retenção D7. Download por QR Code passivo = 10-15%. Cada zona do stand tem uma função psicológica específica.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {[
              { zone: 'ZONA 1', title: 'Atração', color: '#f59e0b', desc: 'Painel LED com números em tempo real, mascote interativo e brindes visuais. Objetivo: parar o fluxo e gerar curiosidade.' },
              { zone: 'ZONA 2', title: 'Engajamento', color: C.teal, desc: '"Você costuma pagar no cartão ou no PIX?" — microcompromisso antes de mostrar qualquer produto. Script comportamental que eleva conversão de 12% para 67%.' },
              { zone: 'ZONA 3', title: 'Ancoragem', color: C.purple, desc: 'Download assistido 1:1, primeiro resgate de cashback ao vivo e cadastro. O participante sai com o app funcionando e benefício já usado.' },
            ].map((z, i) => (
              <div key={i} style={{ ...cardStyle, borderTop: `3px solid ${z.color}` }}>
                <Badge color={z.color}>{z.zone}</Badge>
                <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 20, fontWeight: 700, color: C.white, margin: '10px 0 8px' }}>{z.title}</h4>
                <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>{z.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 04b — SCRIPTS PRONTOS ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, ...hidden } as any}>
          <SectionTag num="04b" label="SCRIPTS DE ATIVAÇÃO" />
          <h2 style={h2Style}>Scripts prontos para uso</h2>
          <p style={{ color: C.muted, maxWidth: 750, lineHeight: 1.8, marginBottom: 32 }}>Cada abordagem tem um script específico testado para maximizar conversão. Nada é improvisado — tudo é treinável e replicável.</p>

          {[
            {
              title: '🎯 Pitch dos 10 Fundadores',
              badge: 'PRÉ-FESPOP · FUNDADORES',
              color: '#ef4444',
              script: '"Magno, o que tô te propondo é diferente de qualquer proposta que você já recebeu. Não é um app pedindo pra você aceitar. É uma sociedade estratégica. Você vai ser um dos 10 primeiros. E quando a cidade inteira estiver usando, todo mundo vai saber quem foram os 10 que começaram. Posso te mostrar como funciona em 2 minutos?"',
              note: 'Foco em escassez e status. O lojista não está "aceitando um app" — está sendo convidado para um grupo restrito.',
            },
            {
              title: '🔥 Pitch de FOMO (Vizinhos dos Fundadores)',
              badge: 'PRÉ-FESPOP · EXPANSÃO',
              color: '#f59e0b',
              script: '"Você viu que o [Nome do Fundador] do [Restaurante Fundador] já tá usando? Ele foi um dos primeiros. Agora a galera da rua já tá perguntando por que aqui ainda não aceita. Quer que eu te mostre como funciona? Leva 2 minutos."',
              note: 'Prova social direta. O lojista vê o vizinho usando e sente que está ficando para trás.',
            },
            {
              title: '🏪 Ativação no PDV (Atendentes)',
              badge: 'PRÉ-FESPOP · PDV',
              color: C.teal,
              script: '"Oi! Você já conhece o app que dá cashback em tudo que você compra aqui em Foz? Funciona assim: você baixa, compra normal, e o dinheiro volta. Quer ver? Posso te mostrar agora."',
              note: 'Script simples e direto para ativadores de rua e atendentes treinados nos estabelecimentos.',
            },
            {
              title: '🎪 Ativador FESPOP (Zona 2)',
              badge: 'FESPOP · ZONA 2',
              color: C.purple,
              script: '"Ei! Você costuma pagar no cartão ou no PIX? [Resposta] Então olha só — imagina se toda vez que você pagasse, uma parte voltasse pra você. Aqui na FESPOP, quem baixar o app agora já ganha cashback na primeira compra. Posso te ajudar a baixar? Leva 30 segundos."',
              note: 'Microcompromisso antes de mostrar o produto. A pergunta inicial cria engajamento antes do pitch.',
            },
            {
              title: '📱 Ancoragem Pós-Download (Zona 3)',
              badge: 'FESPOP · ZONA 3',
              color: '#6366f1',
              script: '"Show, tá baixado! Agora vou te mostrar a melhor parte. Vê esses pontos? Eles já são seus. Agora, quando você for comer em qualquer lugar que aceita Passou Ganhou, é só pagar pelo app e o cashback cai automatico. Quer ver a lista de lugares? Tá tudo aqui."',
              note: 'Ancoragem imediata — o usuário sai do stand já sabendo usar e já tendo experimentado o benefício.',
            },
          ].map((s, i) => (
            <div key={i} ref={reveal} style={{ ...cardStyle, borderLeft: `4px solid ${s.color}`, marginBottom: 20, ...hidden } as any}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Badge color={s.color}>{s.badge}</Badge>
              </div>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 12 }}>{s.title}</h3>
              <div style={{ background: C.cardAlt, borderRadius: 12, padding: 20, marginBottom: 12, borderLeft: `3px solid ${s.color}` }}>
                <p style={{ color: C.text, fontSize: 14, lineHeight: 1.8, fontStyle: 'italic' }}>{s.script}</p>
              </div>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>💡 {s.note}</p>
            </div>
          ))}
        </section>

        {/* ═══ 05 — NURTURING ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, ...hidden } as any}>
          <SectionTag num="05" label="RETENÇÃO" />
          <h2 style={h2Style}>O app não morre em 72 horas.</h2>
          <p style={{ color: C.muted, maxWidth: 750, lineHeight: 1.8, marginBottom: 32 }}>As primeiras 72h após o download são a janela de maior risco. Sem comunicação estruturada, 85% dos downloads de evento viram desinstalação. Com o fluxo abaixo, a retenção D30 supera 40%.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            {[
              { day: 'D+0', title: 'Push imediata', desc: '"Bem-vindo! Seu primeiro cashback já está disponível."', color: C.teal },
              { day: 'D+3', title: 'Indicação viral', desc: '"Convide um amigo e ganhe pontos extras."', color: '#f59e0b' },
              { day: 'D+7', title: 'Expansão de rede', desc: '"Novos estabelecimentos aceitando Passou Ganhou perto de você."', color: C.purple },
              { day: 'D+14', title: 'Lembrete de pontos', desc: '"Seus pontos estão esperando. Use antes que expirem!"', color: '#ef4444' },
              { day: 'D+30', title: 'Marco de 30 dias', desc: '"Parabéns! Você já economizou R$XX com a Passou Ganhou."', color: '#6366f1' },
            ].map((f, i) => (
              <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${f.color}`, padding: 20 }}>
                <Badge color={f.color}>{f.day}</Badge>
                <h4 style={{ color: C.white, fontSize: 15, fontWeight: 700, margin: '8px 0 4px' }}>{f.title}</h4>
                <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Conversão pós-FESPOP — Leads de Lojistas */}
          <div ref={reveal} style={{ ...cardStyle, marginTop: 40, ...hidden } as any}>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 8 }}>Conversão de leads de lojistas pós-FESPOP</h3>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Os 50-80 leads captados no evento precisam de follow-up estruturado para virar credenciamentos reais.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: C.muted, fontWeight: 600, width: 80 }}>TIMING</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: C.muted, fontWeight: 600 }}>AÇÃO</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: C.muted, fontWeight: 600 }}>OBJETIVO</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['D+1', 'WhatsApp personalizado: "Foi um prazer na FESPOP! Vou te mandar o material que conversamos."', 'Manter o lead aquecido enquanto o evento está fresco'],
                  ['D+3', 'Envio de caso de sucesso de um Fundador + proposta simplificada', 'Prova social + facilitar a decisão com dados reais'],
                  ['D+7', 'Ligação direta para agendar visita ou ativação assistida no estabelecimento', 'Converter o lead em credenciamento efetivo'],
                ].map(([t, a, o], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 8px', color: C.teal, fontWeight: 700 }}>{t}</td>
                    <td style={{ padding: '12px 8px', color: C.text }}>{a}</td>
                    <td style={{ padding: '12px 8px', color: C.muted }}>{o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ 06 — KPIs ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, ...hidden } as any}>
          <SectionTag num="06" label="METAS E KPIS" />
          <h2 style={h2Style}>O que medimos. O que entregamos.</h2>
          <p style={{ color: C.muted, maxWidth: 750, lineHeight: 1.8, marginBottom: 32 }}>A Linkaê não reporta alcance de post. Reporta comportamento real de usuário e crescimento da rede.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {[
              { value: '400', label: 'Downloads qualificados', sub: 'Assistidos no evento' },
              { value: '60%', label: 'Retenção D7', sub: 'Script comportamental' },
              { value: '40%', label: 'Retenção D30', sub: 'Nurturing estruturado' },
              { value: '50-80', label: 'Leads de lojistas', sub: 'Captados na FESPOP' },
              { value: '20/mês', label: 'Credenciamentos', sub: 'Meta mensal contínua' },
              { value: 'R$648k', label: 'MDR estimado', sub: 'No evento com maquininha' },
              { value: '35', label: 'Estabelecimentos pré-FESPOP', sub: 'Base sólida antes do evento' },
              { value: '15-25', label: 'Novos pós-FESPOP', sub: 'Conversão de leads' },
            ].map((k, i) => (
              <div key={i} style={{ ...cardStyle, textAlign: 'center', padding: 24 }}>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 32, fontWeight: 800, background: `linear-gradient(135deg,${C.teal},${C.purpleLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{k.value}</div>
                <div style={{ color: C.white, fontSize: 14, fontWeight: 600, marginTop: 6 }}>{k.label}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 06b — POSICIONAMENTO DA MARCA ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, ...hidden } as any}>
          <SectionTag num="06b" label="POSICIONAMENTO" />
          <h2 style={h2Style}>Comunicação que constrói.<br />Comunicação que destrói.</h2>
          <p style={{ color: C.muted, maxWidth: 750, lineHeight: 1.8, marginBottom: 32 }}>A marca Passou Ganhou precisa comunicar de uma forma específica. Qualquer desvio dilui o posicionamento e confunde o público.</p>

          <div style={gridTwo}>
            {/* O que NÃO comunicar */}
            <div style={{ ...cardStyle, borderTop: `3px solid #ef4444` }}>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 20, fontWeight: 700, color: '#ef4444', marginBottom: 16 }}>✗ O que NÃO comunicar</h3>
              {[
                '"Somos um app de cashback" — reduz a marca a uma commodity',
                '"Desconto" ou "promoção" — posiciona como descartável',
                'Linguagem técnica de fintech — afasta o público regional',
                'Comparação direta com concorrentes — demonstra insegurança',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <span style={{ color: '#ef4444', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>✗</span>
                  <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>

            {/* O que comunicar */}
            <div style={{ ...cardStyle, borderTop: `3px solid ${C.teal}` }}>
              <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 20, fontWeight: 700, color: C.teal, marginBottom: 16 }}>✓ O que comunicar</h3>
              {[
                '"Passou, ganhou" — a marca É a ação. Simples e memorável.',
                '"Seu dinheiro volta" — benefício direto, sem jargão.',
                '"Foz não paga mais" — conceito territorial e aspiracional.',
                '"Os primeiros 10 já estão usando" — prova social e escassez.',
                '"Compre onde você já compra e ganhe de volta" — sem mudança de hábito.',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <span style={{ color: C.teal, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hierarquia da comunicação */}
          <div ref={reveal} style={{ ...cardStyle, marginTop: 24, ...hidden } as any}>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 20 }}>Hierarquia da comunicação</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
              {[
                { level: '1º', title: 'Benefício direto', desc: '"Seu dinheiro volta"', color: C.teal },
                { level: '2º', title: 'Prova social', desc: '"Os primeiros já estão usando"', color: '#f59e0b' },
                { level: '3º', title: 'Território', desc: '"Foz não paga mais"', color: C.purple },
                { level: '4º', title: 'Marca', desc: '"Passou Ganhou"', color: '#6366f1' },
              ].map((h, i) => (
                <div key={i} style={{ background: C.cardAlt, borderRadius: 12, padding: 20, borderLeft: `4px solid ${h.color}`, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 32, fontWeight: 800, color: h.color }}>{h.level}</span>
                  <h4 style={{ color: C.white, fontSize: 15, fontWeight: 700, marginTop: 4 }}>{h.title}</h4>
                  <p style={{ color: C.muted, fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 07 — ESCOPO ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, ...hidden } as any}>
          <SectionTag num="07" label="ESCOPO MENSAL" />
          <h2 style={h2Style}>O que a Linkaê entrega todo mês.</h2>
          <p style={{ color: C.muted, maxWidth: 750, lineHeight: 1.8, marginBottom: 32 }}>A Linkaê não é agência de post. É Arquiteta de Expansão Regional.</p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: C.muted, fontWeight: 600 }}>FRENTE</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: C.muted, fontWeight: 600 }}>ENTREGAS MENSAIS</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: C.muted, fontWeight: 600 }}>RESULTADO ESPERADO</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Planejamento Estratégico', 'Calendário mensal, posicionamento, narrativa, reuniões de alinhamento e otimização', 'Direção coerente e mensagens consistentes'],
                  ['Conteúdo Base', '14 posts mensais (Instagram, Facebook, TikTok) + Stories diários', 'Presença constante + engajamento regional'],
                  ['Audiovisual', '2 vídeos YouTube + 1 campanha principal + 1 live + captação profissional', 'Prova social e autoridade de marca'],
                  ['Mídia e Tráfego Pago', 'Gestão Meta Ads + Google Ads + GAMA + Globo DAI (verba separada)', 'Escala de aquisição de lojistas e consumidores'],
                  ['Ao Vivo e Físico', '1 live mensal + planejamento Rádio/TV + cobertura de eventos', 'Presença local ativa e autoridade presencial'],
                  ['Expansão Comercial', 'Abordagem comercial, materiais de apoio, suporte Abrasel, estratégia de ativação', '20 novos credenciamentos/mês'],
                  ['Gestão e Relatórios', 'Relatório mensal de performance (até dia 25), otimização contínua', 'Transparência total de resultados'],
                ].map(([f, e, r], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 8px', color: C.teal, fontWeight: 600 }}>{f}</td>
                    <td style={{ padding: '12px 8px', color: C.text }}>{e}</td>
                    <td style={{ padding: '12px 8px', color: C.muted }}>{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ 08 — INVESTIMENTO ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, textAlign: 'center', ...hidden } as any}>
          <SectionTag num="08" label="INVESTIMENTO" />
          <h2 style={{ ...h2Style, textAlign: 'center' }}>Estrutura de remuneração<br />por resultado.</h2>
          <p style={{ color: C.muted, maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.8 }}>A Linkaê acredita nos próprios resultados — por isso parte da remuneração é atrelada ao atingimento de metas reais.</p>

          <div style={{ ...cardStyle, maxWidth: 520, margin: '0 auto', padding: 40, border: `2px solid ${C.purple}`, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(40px,6vw,56px)', fontWeight: 800, background: `linear-gradient(135deg,${C.purple},${C.teal})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>R$ 35.000</div>
            <p style={{ color: C.muted, fontSize: 15, marginTop: 8 }}>por mês · contrato mínimo de 6 meses</p>
            <p style={{ color: C.text, fontSize: 14, marginTop: 8 }}>Modelo variável atrelado a metas de performance e crescimento</p>

            <div style={{ textAlign: 'left', background: C.cardAlt, borderRadius: 12, padding: 20, marginTop: 24 }}>
              <p style={{ color: C.white, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>📋 Modelo variável — como funciona</p>
              <ul style={{ color: C.muted, fontSize: 13, lineHeight: 2, paddingLeft: 18 }}>
                <li><span style={{ color: C.teal }}>+R$3.000</span> se atingir 20 credenciamentos no mês</li>
                <li><span style={{ color: C.teal }}>+R$3.000</span> se retenção D30 dos downloads ≥ 40%</li>
                <li><span style={{ color: C.teal }}>+R$4.000</span> se gerar ≥ 30 leads de lojistas qualificados</li>
              </ul>
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              <ActionTag>Verba de mídia separada</ActionTag>
              <ActionTag>Equipe dedicada à Passou Ganhou</ActionTag>
            </div>
          </div>
        </section>

        {/* ═══ 09 — PRÓXIMOS PASSOS ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, ...hidden } as any}>
          <SectionTag num="09" label="PRÓXIMOS PASSOS" />
          <h2 style={h2Style}>Os próximos 7 dias mais importantes.</h2>
          <p style={{ color: C.muted, maxWidth: 750, lineHeight: 1.8, marginBottom: 32 }}>Todo dia sem os fundadores credenciados é um dia que não volta. A janela de 60-90 dias até a FESPOP não espera.</p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 650 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: C.muted, fontWeight: 600, width: 60 }}>DIA</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: C.muted, fontWeight: 600 }}>AÇÃO</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: C.muted, fontWeight: 600 }}>RESPONSÁVEL</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', color: C.muted, fontWeight: 600, width: 100 }}>URGÊNCIA</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Dia 1', 'Reunião Magno + Jeferson: validar conceito "Foz não paga mais" e aprovar R$500k', 'Jeferson + Magno', '🔴 Máxima'],
                  ['Dia 1', 'Assinar contrato de patrocínio FESPOP R$500k com uso da maquininha', 'Magno', '🔴 Máxima'],
                  ['Dia 2', 'Mapear os 10 estabelecimentos Fundadores (fluxo + visibilidade)', 'Equipe de campo', '🟠 Alta'],
                  ['Dia 3', 'Abrir canal WhatsApp oficial Passou Ganhou em Foz', 'Linkaê', '🟠 Alta'],
                  ['Dia 3', 'Criar perfil TikTok com geotag de Foz do Iguaçu', 'Linkaê', '🟠 Alta'],
                  ['Dia 4-5', 'Equipe de campo inicia abordagem dos 10 Fundadores com pitch de status', 'Equipe de campo', '🟠 Alta'],
                  ['Dia 5', 'Contato formal com Abrasel de Foz para formalização da parceria', 'Jeferson + Magno', '🟡 Importante'],
                  ['Dia 7', 'Kick-off oficial Linkaê + EBW — início do plano de 90 dias', 'Jeferson + Magno', '🟡 Importante'],
                ].map(([d, a, r, u], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 8px', color: C.white, fontWeight: 700 }}>{d}</td>
                    <td style={{ padding: '10px 8px', color: C.text }}>{a}</td>
                    <td style={{ padding: '10px 8px', color: C.muted }}>{r}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12 }}>{u}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══ ASSINATURA ═══ */}
        <section ref={reveal} style={{ ...sectionStyle, textAlign: 'center', ...hidden } as any}>
          <h2 style={{ ...h2Style, textAlign: 'center', marginBottom: 8 }}>Estratégia de Crescimento e Dominação Regional</h2>
          <p style={{ color: C.muted, fontSize: 16, marginBottom: 40 }}>Oeste do Paraná — FESPOP 2026</p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 56, flexWrap: 'wrap', marginBottom: 40 }}>
            <div>
              <Badge>ELABORADO POR</Badge>
              <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 22, fontWeight: 700, color: C.teal, marginTop: 12 }}>Linkaê Marketing</h4>
              <p style={{ color: C.text, fontSize: 14, marginTop: 8 }}>Jeferson Encina — <strong style={{ color: C.white }}>Head de Estratégia</strong></p>
              <p style={{ color: C.text, fontSize: 14, marginTop: 4 }}>Beatriz Almeida — <strong style={{ color: C.white }}>Head de Marketing</strong></p>
            </div>
            <div>
              <Badge color={C.tealDark}>APRESENTADO PARA</Badge>
              <img src={passouGanhouLogo} alt="Passou Ganhou" style={{ height: 48, objectFit: 'contain', marginTop: 12 }} />
              <p style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>Magno Sipaúba — Fundador & CEO</p>
            </div>
          </div>

          <p style={{ color: C.muted, fontSize: 13 }}>FOZ DO IGUAÇU, PARANÁ · MARÇO 2026</p>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ color: '#555', fontSize: 12, lineHeight: 1.8 }}>
            Este documento é confidencial e foi elaborado exclusivamente para apresentação à EBW Bank / Passou Ganhou.<br />
            Proposta válida por 30 dias a partir da data de envio.<br />
            © 2026 Linkaê Marketing · Proposta Confidencial · Passou Ganhou × FESPOP
          </p>
          <p style={{ color: C.muted, fontSize: 11, marginTop: 12 }}>linkaê × passouganhou</p>
        </footer>
      </div>
    </>
  );
};

export default PropostaPassouGanhou;
