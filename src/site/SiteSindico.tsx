import React from 'react';
import { Link } from 'react-router-dom';
import { RodapeSite, BarraCelular, IconeWhats, waNando, useFonteSite, useTituloPagina, videoSite } from './comum';
import { usePrediosPublicos } from './usePrediosPublicos';
import { useCorNavegador } from '@/lib/corNavegador';

/** Sou síndico (rota /sou-sindico) — Opção 2. Ação principal: conversar com o Nando no WhatsApp. */

const PASSOS = [
  ['Converse com o Nando', 'Ele explica tudo e anota os dados do prédio em poucos minutos.'],
  ['Análise e visita', 'A equipe confere internet, elevador e casa de máquinas.'],
  ['Instalação', 'Sem obra e sem custo, feita pela equipe técnica da EXA.'],
  ['Primeiro aviso', 'O Nando chama você e mostra como publicar.'],
];
const FAQ = [
  ['O condomínio paga alguma coisa?', 'Não. A tela é paga pelos anúncios de empresas da cidade que passam junto com os avisos.'],
  ['Que anúncios aparecem?', 'Só de empresas de Foz, sem som. Não entram política, apostas, bebida alcoólica, motéis nem conteúdo impróprio.'],
  ['E se a tela parar?', 'A EXA acompanha todas as telas à distância e faz a manutenção sem custo para o prédio.'],
  ['Administro vários prédios. Funciona?', 'Sim. Pelo mesmo WhatsApp você publica, troca e retira avisos em todos os prédios que administra.'],
];

export default function SiteSindico() {
  useFonteSite();
  useCorNavegador({ topo: '#FFFFFF' }); // cabeçalho claro
  useTituloPagina('Sou síndico · Tela no elevador sem custo · EXA Mídia', 'A EXA instala, mantém e paga a internet da tela no elevador do seu prédio. Os avisos você manda pelo WhatsApp, com o Nando.');
  const { predios } = usePrediosPublicos();
  const nomes = predios.map((p) => p.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return (
    <div className="exa-site com-barra" style={{ fontSize: 19, lineHeight: 1.6 }}>
      <header className="hdr hdr-claro">
        <div className="w in">
          <Link to="/" aria-label="EXA, início"><img src="/site/exa-preto.svg" alt="EXA" width={60} height={26} style={{ height: 26, width: 'auto', display: 'block' }} /></Link>
          <nav className="nav" aria-label="Principal">
            <Link className="nl" to="/">Para anunciantes</Link>
            <a className="nl sempre" href="/paineldosindico" style={{ color: '#0B0B0D', fontWeight: 800 }}>Entrar no Painel do Síndico</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ paddingBlock: '72px 88px' }}>
        <div className="w hero" style={{ gap: 64 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26, minWidth: 0 }}>
            <h1 className="t" style={{ fontSize: 'clamp(40px,5.4vw,64px)', lineHeight: 1.04 }}>Tela no elevador do seu prédio. Sem custo.</h1>
            <p className="sub" style={{ fontSize: 21 }}>A EXA instala, mantém e paga a internet. Os avisos você manda pelo WhatsApp, por texto ou áudio. Não precisa de computador nem de aplicativo.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
              <a className="b wa" href={waNando()} style={{ minHeight: 58, fontSize: 18 }}><IconeWhats />Falar com o Nando no WhatsApp</a>
              <p style={{ margin: 0, fontSize: 16, color: '#55545A', maxWidth: '30em' }}>O Nando é o assistente da EXA para síndicos. Ele tira as suas dúvidas e faz o cadastro do prédio ali mesmo, na conversa.</p>
              <Link className="lk" to="/interessesindico/formulario" style={{ fontSize: 16 }}>Prefiro preencher o cadastro no site</Link>
            </div>
          </div>
          <figure className="monw" style={{ margin: '0 auto', width: '100%', maxWidth: 320 }}>
            <div style={{ aspectRatio: '9/16', borderRadius: 22, background: '#000', padding: 9, boxShadow: '0 50px 90px -50px rgba(11,11,13,.6)' }}>
              <video src={videoSite('/site/tela-real.mp4')} poster="/site/tela-real.jpg" autoPlay muted loop playsInline preload="metadata" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} aria-label="Tela EXA real mostrando avisos do condomínio" />
            </div>
            <figcaption style={{ marginTop: 14, fontSize: 13, color: '#8E8C87', textAlign: 'center' }}>Tela real, com os avisos do prédio embaixo</figcaption>
          </figure>
        </div>
      </section>

      {/* PARCEIROS */}
      <section aria-label="Parceiros" style={{ background: '#0B0B0D', color: '#fff', paddingBlock: 36 }}>
        <div className="w" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px 48px' }}>
          <p style={{ margin: 0, fontSize: 17, color: '#C9C7C2', maxWidth: '26em' }}><strong style={{ color: '#fff' }}>Parceiros da EXA.</strong> Quem cuida de condomínio e quem informa Foz estão com a gente.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
            <img src="/site/parceiro-secovi.png" alt="Secovi-PR" loading="lazy" style={{ height: 64, width: 'auto', display: 'block' }} />
            <img src="/site/parceiro-portal-da-cidade.png" alt="Portal da Cidade Foz do Iguaçu" loading="lazy" style={{ height: 40, width: 'auto', display: 'block' }} />
          </div>
        </div>
      </section>

      {/* VÍDEO DO NANDO */}
      <section style={{ paddingBlock: 88 }}>
        <div className="w two">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            <h2 className="t" style={{ fontSize: 'clamp(32px,4vw,44px)' }}>Veja como funciona, em 3 minutos.</h2>
            <p className="sub">Do grupo do WhatsApp lotado ao aviso no elevador. O Nando mostra como o síndico publica, troca e tira avisos, sem computador.</p>
            <a className="b wa" href={waNando()} style={{ alignSelf: 'flex-start' }}>Falar com o Nando no WhatsApp</a>
          </div>
          <figure style={{ margin: '0 auto', width: '100%', maxWidth: 340 }}>
            <div style={{ borderRadius: 26, background: '#0B0B0D', padding: 8, boxShadow: '0 50px 90px -50px rgba(11,11,13,.6)' }}>
              <video src={videoSite('/site/nando-explica.mp4')} poster="/site/nando-explica.jpg" controls playsInline preload="none" style={{ display: 'block', width: '100%', aspectRatio: '9/16', borderRadius: 19, background: '#000' }} aria-label="Vídeo: o Nando, assistente dos síndicos, explica a nova EXA" />
            </div>
            <figcaption style={{ marginTop: 12, fontSize: 14, color: '#8E8C87', textAlign: 'center' }}>3 min 48 s · com som</figcaption>
          </figure>
        </div>
      </section>

      {/* 3 FATOS */}
      <section style={{ paddingBlock: 64, background: '#F5F4F1' }}>
        <div className="w steps" style={{ gap: 40 }}>
          {[['Sem custo', 'Equipamento, instalação, internet e manutenção ficam por conta da EXA.'],
            ['Tudo pelo WhatsApp', 'Você conversa com o Nando e ele monta o aviso com letra grande, pronto para a tela.'],
            ['Todo morador vê', 'O elevador é o único lugar por onde todos passam, todos os dias. Chega de papel no mural.']].map(([t, d]) => (
            <div key={t}><h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>{t}</h2><p style={{ margin: 0, color: '#55545A', fontSize: 17 }}>{d}</p></div>
          ))}
        </div>
      </section>

      {/* COMO ENTRA */}
      <section style={{ paddingBlock: 88 }}>
        <div className="w" style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <h2 className="t" style={{ fontSize: 'clamp(32px,4vw,44px)' }}>Como o seu prédio entra na rede</h2>
          <ol className="passos4" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {PASSOS.map(([t, d], i) => (
              <li key={t} style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '2px solid #0B0B0D', paddingTop: 16 }}>
                <span style={{ fontWeight: 800, color: '#EA251D' }}>{i + 1}</span><strong>{t}</strong><span style={{ color: '#55545A', fontSize: 16 }}>{d}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* REQUISITOS + QUEM USA */}
      <section style={{ paddingBlock: '24px 88px' }}>
        <div className="w two" style={{ alignItems: 'start', gap: 56 }}>
          <div style={{ borderRadius: 24, background: '#0B0B0D', color: '#fff', padding: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 className="t" style={{ fontSize: 30 }}>Quem pode ter a tela</h2>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, color: '#D8D6D2', fontSize: 17 }}>
              <li>Prédio residencial em Foz do Iguaçu</li>
              <li>Pelo menos 24 apartamentos em um bloco</li>
              <li>Aprovação do síndico, e do conselho ou da assembleia se a convenção pedir</li>
            </ul>
            <a className="b wa" href={waNando('Quero saber se o meu prédio pode ter a tela da EXA')} style={{ alignSelf: 'flex-start', minHeight: 52, fontSize: 16 }}>Ver se o meu prédio pode</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <h2 className="t" style={{ fontSize: 30 }}>Prédios de Foz que já usam</h2>
            <p style={{ margin: 0, color: '#55545A', fontSize: 16, lineHeight: 1.9 }}>{nomes.join(' · ')}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ paddingBlock: 80, background: '#F5F4F1' }}>
        <div className="w" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 860 }}>
          <h2 className="t" style={{ fontSize: 'clamp(30px,4vw,40px)', marginBottom: 16 }}>Dúvidas de síndico</h2>
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0} style={{ borderTop: '1px solid #E1DFDA', borderBottom: i === FAQ.length - 1 ? '1px solid #E1DFDA' : undefined, paddingBlock: 22 }}>
              <summary>{q}</summary>
              <p style={{ margin: '12px 0 0', color: '#55545A' }}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <RodapeSite />

      <BarraCelular>
        <a className="b wa" href={waNando()} style={{ width: '100%', minHeight: 52 }}><IconeWhats />Falar com o Nando</a>
      </BarraCelular>
    </div>
  );
}
