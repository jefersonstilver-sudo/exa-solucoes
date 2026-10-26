/**
 * EXA 2.0 — Réplica fiel da tela do elevador EM EXECUÇÃO (layout do painel v16, 1080×1920).
 *  - Player 1080×890 no topo tocando o vídeo do pedido que está no ar agora (motor winnerAt).
 *  - Grade 1080×1030: avisos do condomínio 510×990 (OCULTOS por privacidade) à esquerda;
 *    notícias 180 · câmera 290 · clima 280 · relógio 180 à direita.
 * A tela é desenhada em escala 1:1 (px reais) e reduzida para caber no container.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Lock, Snowflake, Sun } from 'lucide-react';
import type { WeatherData } from '@/services/weatherService';
import type { AgendaSlot } from '@/lib/agenda/agendaEngine';

const DS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const p2 = (n: number) => String(n).padStart(2, '0');

const IconeClima: React.FC<{ icon?: string; size: number }> = ({ icon, size }) => {
  const I = icon === 'clear' ? Sun : icon === 'partly-cloudy' ? CloudSun : icon === 'fog' ? CloudFog : icon === 'rain' ? CloudRain : icon === 'snow' ? Snowflake : icon === 'storm' ? CloudLightning : Cloud;
  return <I width={size} height={size} strokeWidth={1.6} />;
};

/** Player: vídeo mudo em loop, mostrado inteiro (sem cortar/esticar) sobre o fundo do player. */
const PlayerVideo: React.FC<{ slot: AgendaSlot | null }> = ({ slot }) => {
  const [erro, setErro] = useState(false);
  useEffect(() => setErro(false), [slot?.url]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%,#3a1420,#120a10 70%)' }} />
      {slot?.url && !erro ? (
        <video
          key={`${slot.id}-${slot.url}`}
          src={slot.url}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setErro(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.6)', fontSize: 40, fontWeight: 700 }}>
          {slot ? 'Carregando vídeo…' : 'Sem vídeo no ar'}
        </div>
      )}
      <span style={{ position: 'absolute', left: 28, top: 28, background: 'rgba(0,0,0,.45)', borderRadius: 14, padding: '10px 22px', fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>
        ▶ SEU ANÚNCIO
      </span>
      {slot?.nome && (
        <span style={{ position: 'absolute', left: 28, bottom: 26, right: 28, fontSize: 38, fontWeight: 800, textShadow: '0 2px 16px rgba(0,0,0,.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {slot.nome.replace(/_/g, ' ')}
        </span>
      )}
    </div>
  );
};

const card: React.CSSProperties = {
  background: 'linear-gradient(160deg,rgba(255,255,255,.10),rgba(255,255,255,.035) 40%,rgba(255,255,255,.02))',
  border: '1px solid rgba(255,255,255,.14)',
  borderTopColor: 'rgba(255,255,255,.28)',
  borderRadius: 20,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 14px 34px rgba(0,0,0,.4)',
};
const tit: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 700, letterSpacing: 2.2, textTransform: 'uppercase', color: 'rgba(255,255,255,.66)' };

interface Props {
  predioNome: string;
  slot: AgendaSlot | null;
  now: Date;
  clima?: WeatherData | null;
}

export const ReplicaPainel: React.FC<Props> = ({ predioNome, slot, now, clima }) => {
  const wrap = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0.3);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const medir = () => setEscala(el.clientWidth / 1080 || 0.3);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hoje = clima?.forecast?.[0];

  return (
    <div ref={wrap} className="relative w-full overflow-hidden rounded-[18px] shadow-[0_24px_60px_-20px_rgba(0,0,0,.55),0_0_0_6px_#18121a,0_0_0_7px_rgba(255,255,255,.08)]" style={{ height: 1920 * escala }}>
      <style>{`
        @keyframes rpM1{to{transform:translate(480px,-160px) scale(1.15)}}
        @keyframes rpM2{to{transform:translate(-420px,220px) scale(.9)}}
        @keyframes rpM3{to{transform:translate(260px,-380px) scale(1.2)}}
        @keyframes rpPisca{50%{opacity:.25}}
        @keyframes rpProg{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @media (prefers-reduced-motion:reduce){.rp-anim{animation:none!important}}
      `}</style>
      <div
        aria-label={`Réplica da tela do elevador do ${predioNome}`}
        style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${escala})`, transformOrigin: '0 0', background: '#0c0610', color: '#fff', overflow: 'hidden', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
      >
        {/* fundo vivo */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <i className="rp-anim" style={{ position: 'absolute', borderRadius: '50%', width: 900, height: 900, left: -280, top: 820, background: 'radial-gradient(circle,rgba(230,30,60,.55),rgba(230,30,60,0) 65%)', animation: 'rpM1 14s ease-in-out infinite alternate' }} />
          <i className="rp-anim" style={{ position: 'absolute', borderRadius: '50%', width: 800, height: 800, right: -300, top: 1120, background: 'radial-gradient(circle,rgba(150,20,90,.55),rgba(150,20,90,0) 65%)', animation: 'rpM2 17s ease-in-out infinite alternate' }} />
          <i className="rp-anim" style={{ position: 'absolute', borderRadius: '50%', width: 700, height: 700, left: 200, top: 1420, background: 'radial-gradient(circle,rgba(255,90,60,.36),rgba(255,90,60,0) 65%)', animation: 'rpM3 12s ease-in-out infinite alternate' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* PLAYER 1080×890 */}
          <div style={{ flex: '0 0 890px', height: 890, position: 'relative', overflow: 'hidden', background: '#000', borderBottom: '4px solid #fff' }}>
            <PlayerVideo slot={slot} />
          </div>

          {/* GRADE 1080×1030 */}
          <div style={{ flex: '0 0 1030px', height: 1030, display: 'flex', gap: 20, padding: 20 }}>
            {/* Avisos do condomínio — OCULTOS */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...card, height: 990, display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'center', padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,.10)', background: 'radial-gradient(ellipse at 50% 0%,rgba(230,40,70,.30),rgba(230,40,70,0) 75%)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,.66)' }}>Avisos do</div>
                  <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Condomínio {predioNome}</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    margin: 4,
                    borderRadius: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 28,
                    textAlign: 'center',
                    padding: 40,
                    border: '3px dashed rgba(255,255,255,.3)',
                    background: 'repeating-linear-gradient(45deg,rgba(255,255,255,.08),rgba(255,255,255,.08) 26px,rgba(255,255,255,.035) 26px,rgba(255,255,255,.035) 52px)',
                  }}
                >
                  <div style={{ width: 150, height: 150, borderRadius: '50%', background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock width={72} height={72} strokeWidth={1.8} />
                  </div>
                  <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>Área do condomínio</div>
                  <div style={{ fontSize: 34, fontWeight: 500, opacity: 0.85, lineHeight: 1.3 }}>visível só para moradores</div>
                  <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', background: 'rgba(0,0,0,.4)', borderRadius: 999, padding: '10px 24px' }}>Tarja de privacidade</div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Notícias 180 */}
              <div style={{ ...card, height: 180, padding: '16px 18px', display: 'flex', gap: 14 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
                  <div style={tit}><i style={{ width: 8, height: 8, borderRadius: '50%', background: '#5aa9ff', boxShadow: '0 0 10px #5aa9ff' }} />Notícias · Portal da Cidade</div>
                  <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: '#1a0a0d', background: '#ffc35a', padding: '3px 9px', borderRadius: 20 }}>FOZ DO IGUAÇU</span>
                  <div style={{ height: 16, width: '92%', borderRadius: 8, background: 'rgba(255,255,255,.22)' }} />
                  <div style={{ height: 16, width: '70%', borderRadius: 8, background: 'rgba(255,255,255,.16)' }} />
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.44)', marginTop: 'auto' }}>Manchetes da cidade em tempo real</div>
                </div>
                <div style={{ width: 96, height: 96, alignSelf: 'center', background: '#fff', borderRadius: 10, padding: 6 }}>
                  <div style={{ width: '100%', height: '100%', background: 'repeating-conic-gradient(#111 0 25%,#fff 0 50%) 0 0/14px 14px' }} />
                </div>
              </div>

              {/* Câmera 290 */}
              <div style={{ ...card, height: 290 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#141a28 0%,#1d2638 40%,#2b2b2b 58%,#1b1d22 100%)' }} />
                <div style={{ position: 'absolute', left: '-10%', right: '-10%', top: '58%', height: 10, background: 'repeating-linear-gradient(90deg,#f5d36b 0 40px,transparent 40px 90px)', transform: 'perspective(300px) rotateX(60deg)', opacity: 0.6 }} />
                <div style={{ position: 'absolute', left: 14, right: 14, top: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="rp-anim" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d5e', boxShadow: '0 0 10px #ff4d5e', animation: 'rpPisca 1.6s ease-in-out infinite' }} />AO VIVO
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,.55)', border: '1px solid rgba(255,255,255,.12)' }}>ADUANA · PONTE DA AMIZADE</span>
                </div>
                <i className="rp-anim" style={{ position: 'absolute', left: 0, bottom: 0, height: 4, width: '100%', background: 'linear-gradient(90deg,#ff4d5e,#ffc35a)', transformOrigin: 'left', animation: 'rpProg 14s linear infinite' }} />
              </div>

              {/* Clima 280 (dados reais de Foz do Iguaçu) */}
              <div style={{ ...card, height: 280, padding: '16px 18px' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(155deg,#2b3566,#1f2546 60%,#191b33)' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ ...tit, color: 'rgba(255,255,255,.88)' }}>Foz do Iguaçu · agora</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 4 }}>
                    <div style={{ fontSize: 86, fontWeight: 200, letterSpacing: -4, lineHeight: 1 }}>
                      {clima ? clima.current.temperature : '--'}
                      <sup style={{ fontSize: 26, fontWeight: 300, letterSpacing: 0, verticalAlign: 'top', marginLeft: 3 }}>°C</sup>
                    </div>
                    <div style={{ paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 700 }}>
                      <IconeClima icon={clima?.current.icon} size={34} />
                      {clima?.current.description || 'Carregando…'}
                    </div>
                  </div>
                  {hoje?.rainChance != null && (
                    <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'rgba(255,255,255,.85)' }}>
                      <span>Chuva <b>{hoje.rainChance}%</b></span>
                      <span>Máx <b>{hoje.maxTemp}°</b></span>
                      <span>Mín <b>{hoje.minTemp}°</b></span>
                    </div>
                  )}
                </div>
                <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {(clima?.forecast || []).slice(0, 3).map((f) => (
                    <div key={f.date} style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 14, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                        {new Date(f.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                      </span>
                      <span style={{ fontSize: 18, fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.15 }}>
                        <span style={{ color: '#ffe08a' }}>{f.maxTemp}°</span>
                        <span style={{ color: '#9fd6ff' }}>{f.minTemp}°</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relógio 180 (ao vivo) */}
              <div style={{ ...card, height: 180, display: 'flex', padding: '12px 14px 12px 22px', gap: 14 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', color: '#ff6b7a' }}>{DS[now.getDay()]}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginTop: 2 }}>{now.getDate()} de {MS[now.getMonth()]}</div>
                  <div style={{ fontSize: 80, fontWeight: 200, letterSpacing: -4, lineHeight: 0.95, marginTop: 4, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'flex-start' }}>
                    {p2(now.getHours())}:{p2(now.getMinutes())}
                    <span style={{ fontSize: 24, letterSpacing: 0, color: 'rgba(255,255,255,.44)', fontWeight: 400, margin: '10px 0 0 6px' }}>{p2(now.getSeconds())}</span>
                  </div>
                </div>
                <div style={{ width: 150, flex: '0 0 150px', borderLeft: '1px solid rgba(37,211,102,.3)', paddingLeft: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap' }}>ANUNCIE <em style={{ fontStyle: 'normal', color: '#25D366' }}>COM A EXA</em></div>
                  <div style={{ width: 94, height: 94, background: '#fff', borderRadius: 10, padding: 6, boxShadow: '0 0 0 2px rgba(37,211,102,.6),0 0 22px rgba(37,211,102,.35)' }}>
                    <div style={{ width: '100%', height: '100%', background: 'repeating-conic-gradient(#111 0 25%,#fff 0 50%) 0 0/14px 14px' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#06210f', background: '#25D366', borderRadius: 20, padding: '3px 10px' }}>Fale com a Sofia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplicaPainel;
