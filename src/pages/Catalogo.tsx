import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import logoExa from '@/assets/logo-branca-exa.png';
import SeloAirbnb from '@/components/shared/SeloAirbnb';

type Predio = {
  id: string;
  nome: string;
  status: string;
  statusGroup: 'ativo' | 'instalacao' | 'interesse';
  endereco: string | null;
  bairro: string | null;
  unidades: number | null;
  andares: number | null;
  blocos: number | null;
  publico: number | null;
  tipo: string | null;
  fotosCount: number;
  fotoUrl: string | null;
  temAirbnb?: boolean;
};

type ApiResp = {
  counts: { ativo: number; instalacao: number; interesse: number; total: number };
  predios: Predio[];
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const STYLES = `
  .catalogo-root, .catalogo-root * { box-sizing: border-box; }
  .catalogo-root { background:#000; color:#fff; font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; min-height:100vh; overflow-x:hidden; user-select:text; }
  .catalogo-root::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:1; background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(232,0,13,0.018) 3px,rgba(232,0,13,0.018) 4px); }

  .cat-hero { position:relative; min-height:100vh; padding:60px 6vw 80px; display:flex; flex-direction:column; justify-content:space-between; background:radial-gradient(ellipse at top right,rgba(232,0,13,0.18) 0%,transparent 55%),radial-gradient(ellipse at bottom left,rgba(232,0,13,0.10) 0%,transparent 55%),#000; overflow:hidden; }
  .cat-hero::before { content:''; position:absolute; inset:0; background-image:radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 1px); background-size:24px 24px; pointer-events:none; }
  .cat-hero-top { display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:2; flex-wrap:wrap; gap:20px; }
  .cat-brand-logo { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:56px; color:#E8000D; letter-spacing:-3px; line-height:.85; }
  .cat-brand-sub { font-family:'Barlow Condensed',sans-serif; font-weight:300; font-size:14px; color:#fff; letter-spacing:8px; text-transform:uppercase; margin-top:4px; }
  .cat-meta { font-family:monospace; font-size:11px; color:rgba(255,255,255,0.35); letter-spacing:2px; text-transform:uppercase; text-align:right; line-height:1.8; }
  .cat-meta strong { color:#E8000D; }
  .cat-hero-main { position:relative; z-index:2; max-width:1100px; margin-top:80px; }
  .cat-hero-eye { font-family:'Barlow Condensed',sans-serif; font-weight:300; font-size:16px; color:#E8000D; letter-spacing:6px; text-transform:uppercase; margin-bottom:18px; display:inline-flex; align-items:center; gap:12px; }
  .cat-hero-eye::before { content:''; width:36px; height:2px; background:#E8000D; }
  .cat-hero-title { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:clamp(48px,8vw,132px); line-height:.88; letter-spacing:-3px; text-transform:uppercase; margin-bottom:28px; }
  .cat-hero-title .red { color:#E8000D; }
  .cat-hero-title .outline { color:transparent; -webkit-text-stroke:1.5px #fff; }
  .cat-hero-desc { font-weight:300; font-size:clamp(15px,1.4vw,19px); line-height:1.6; color:rgba(255,255,255,.75); max-width:720px; margin-bottom:40px; }

  .cat-kpis { position:relative; z-index:2; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1px; background:rgba(232,0,13,.25); margin-top:60px; border:1px solid rgba(232,0,13,.25); }
  .cat-kpi { background:#0A0A0A; padding:28px 24px; }
  .cat-kpi-num { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:56px; color:#E8000D; line-height:1; letter-spacing:-2px; }
  .cat-kpi-num.white { color:#fff; }
  .cat-kpi-label { font-family:'Barlow Condensed',sans-serif; font-weight:300; font-size:12px; color:#fff; letter-spacing:3px; text-transform:uppercase; margin-top:10px; }
  .cat-kpi-sub { font-size:11px; color:rgba(255,255,255,.35); margin-top:4px; font-family:monospace; }

  .cat-section { position:relative; padding:100px 6vw; z-index:2; }
  .cat-section-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:60px; flex-wrap:wrap; gap:24px; }
  .cat-section-eye { font-family:'Barlow Condensed',sans-serif; font-weight:300; font-size:13px; color:#E8000D; letter-spacing:5px; text-transform:uppercase; margin-bottom:12px; }
  .cat-section-title { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:clamp(38px,5vw,72px); line-height:.95; letter-spacing:-2px; text-transform:uppercase; max-width:900px; }
  .cat-section-title .red { color:#E8000D; }
  .cat-section-counter { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:clamp(56px,7vw,112px); color:#E8000D; line-height:1; letter-spacing:-3px; }
  .cat-section-counter span { display:block; font-size:13px; color:#fff; font-weight:300; letter-spacing:4px; text-transform:uppercase; margin-top:8px; }

  .cat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(310px,1fr)); gap:1px; background:rgba(232,0,13,.18); border:1px solid rgba(232,0,13,.18); }
  .cat-card { background:#0A0A0A; position:relative; min-height:280px; display:flex; flex-direction:column; overflow:hidden; }
  .cat-card::before { content:''; position:absolute; top:-1px; left:-1px; width:28px; height:28px; border-top:2px solid #E8000D; border-left:2px solid #E8000D; z-index:3; pointer-events:none; }
  .cat-card::after { content:''; position:absolute; bottom:-1px; right:-1px; width:28px; height:28px; border-bottom:2px solid #E8000D; border-right:2px solid #E8000D; z-index:3; pointer-events:none; }
  .cat-card-photo { position:relative; width:100%; aspect-ratio:16/10; background:#111 linear-gradient(135deg,#1a1a1a,#0a0a0a); overflow:hidden; }
  .cat-card-photo img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .4s ease; }
  .cat-card:hover .cat-card-photo img { transform:scale(1.05); }
  .cat-card-photo::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.85) 100%); pointer-events:none; }
  .cat-card-noimg { display:flex; align-items:center; justify-content:center; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:120px; color:rgba(232,0,13,.18); letter-spacing:-6px; line-height:1; }
  .cat-card-body { padding:24px 28px 28px; display:flex; flex-direction:column; gap:10px; flex:1; position:relative; z-index:2; }
  .cat-card-id { font-family:monospace; font-size:10px; color:rgba(255,255,255,.35); letter-spacing:2px; }
  .cat-card-nome { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:26px; color:#fff; line-height:1.05; text-transform:uppercase; letter-spacing:-.5px; }
  .cat-card-end { font-size:12px; color:rgba(255,255,255,.7); line-height:1.5; display:flex; gap:8px; }
  .cat-card-end::before { content:'▸'; color:#E8000D; font-weight:700; flex-shrink:0; }
  .cat-card-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding-top:14px; border-top:1px solid rgba(255,255,255,.08); margin-top:auto; }
  .cat-stat-num { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:24px; color:#E8000D; line-height:1; }
  .cat-stat-label { font-family:monospace; font-size:9px; color:rgba(255,255,255,.35); letter-spacing:1px; text-transform:uppercase; margin-top:4px; }
  .cat-status { position:absolute; top:14px; right:14px; z-index:4; display:inline-flex; align-items:center; gap:6px; padding:5px 10px; font-family:'Barlow Condensed',sans-serif; font-weight:600; font-size:10px; letter-spacing:2px; text-transform:uppercase; border:1px solid; backdrop-filter:blur(6px); background:rgba(0,0,0,.55); }
  .cat-st-ativo { color:#00FF88; border-color:#00FF88; }
  .cat-st-ativo::before { content:''; width:7px; height:7px; border-radius:50%; background:#00FF88; box-shadow:0 0 8px #00FF88; }
  .cat-st-instalacao { color:#FFB800; border-color:#FFB800; }
  .cat-st-instalacao::before { content:''; width:7px; height:7px; border-radius:50%; background:#FFB800; animation:catpulse 1.5s infinite; }
  .cat-st-interesse { color:#E8000D; border-color:#E8000D; }
  .cat-st-interesse::before { content:''; width:7px; height:7px; border-radius:50%; background:#E8000D; }
  @keyframes catpulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }

  .cat-divider { margin:60px 6vw; height:1px; background:linear-gradient(90deg,transparent,#E8000D,transparent); position:relative; }
  .cat-divider::before { content:''; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:12px; height:12px; background:#E8000D; border-radius:50%; box-shadow:0 0 20px #E8000D; }

  .cat-cta { padding:120px 6vw; text-align:center; position:relative; z-index:2; background:radial-gradient(ellipse at center,rgba(232,0,13,.15) 0%,transparent 60%); }
  .cat-cta-title { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:clamp(48px,8vw,120px); line-height:.9; letter-spacing:-3px; text-transform:uppercase; margin-bottom:28px; }
  .cat-cta-title .red { color:#E8000D; }
  .cat-cta-desc { font-weight:300; font-size:18px; color:rgba(255,255,255,.7); max-width:720px; margin:0 auto 50px; }
  .cat-cta-contacts { display:flex; justify-content:center; gap:30px; flex-wrap:wrap; }
  .cat-cta-contact { display:flex; flex-direction:column; align-items:center; gap:6px; color:#fff; text-decoration:none; padding:18px 28px; border:1px solid rgba(232,0,13,.4); transition:all .25s ease; }
  .cat-cta-contact:hover { border-color:#E8000D; background:rgba(232,0,13,.08); }
  .cat-cta-clabel { font-family:monospace; font-size:10px; color:#E8000D; letter-spacing:3px; text-transform:uppercase; }
  .cat-cta-cval { font-family:'Barlow Condensed',sans-serif; font-weight:600; font-size:18px; letter-spacing:1px; }

  .cat-footer { padding:40px 6vw; text-align:center; border-top:1px solid rgba(232,0,13,.25); font-family:monospace; font-size:11px; color:rgba(255,255,255,.35); letter-spacing:2px; text-transform:uppercase; position:relative; z-index:2; }

  .cat-loading { padding:120px 6vw; text-align:center; font-family:'Barlow Condensed',sans-serif; font-size:24px; letter-spacing:4px; text-transform:uppercase; color:rgba(255,255,255,.6); }
  .cat-loading::after { content:'_'; color:#E8000D; animation:catpulse 1s infinite; }

  @media (max-width: 768px) {
    .cat-hero { padding:40px 5vw 60px; }
    .cat-meta { text-align:left; }
    .cat-section { padding:60px 5vw; }
    .cat-section-header { flex-direction:column; align-items:flex-start; }
    .cat-grid { grid-template-columns:1fr; }
  }
`;

function StatusBadge({ g, label }: { g: string; label: string }) {
  return <div className={`cat-status cat-st-${g}`}>{label}</div>;
}

function Card({ p, idx }: { p: Predio; idx: number }) {
  const [imgErr, setImgErr] = useState(false);
  const labelByGroup: Record<string, string> = { ativo: 'Ativo', instalacao: 'Instalação', interesse: 'Interesse' };
  const prefix = p.statusGroup === 'ativo' ? 'ATV' : p.statusGroup === 'instalacao' ? 'INS' : 'INT';
  const id = `${prefix}.${String(idx + 1).padStart(3, '0')}`;
  const showImg = p.fotoUrl && !imgErr;
  return (
    <article className="cat-card">
      <StatusBadge g={p.statusGroup} label={labelByGroup[p.statusGroup]} />
      <div className="cat-card-photo">
        {showImg ? (
          <img src={p.fotoUrl!} alt={`Foto de ${p.nome}`} loading="lazy" onError={() => setImgErr(true)} />
        ) : (
          <div className="cat-card-noimg">{String(idx + 1).padStart(2, '0')}</div>
        )}
        {p.temAirbnb && (
          <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 4 }}>
            <SeloAirbnb size="xl" />
          </div>
        )}
      </div>
      <div className="cat-card-body">
        <div className="cat-card-id">{id} · {p.tipo || 'Residencial'}</div>
        <h3 className="cat-card-nome">{p.nome}</h3>
        {p.endereco && <div className="cat-card-end">{p.endereco}</div>}
        <div className="cat-card-stats">
          <div><div className="cat-stat-num">{p.unidades ?? '—'}</div><div className="cat-stat-label">UNID.</div></div>
          <div><div className="cat-stat-num">{p.andares ?? '—'}</div><div className="cat-stat-label">AND.</div></div>
          <div><div className="cat-stat-num">{p.publico ?? '—'}</div><div className="cat-stat-label">PESSOAS</div></div>
        </div>
      </div>
    </article>
  );
}

function Section({ title, eyebrow, desc, group, items }: { title: React.ReactNode; eyebrow: string; desc: string; group: string; items: Predio[] }) {
  if (items.length === 0) return null;
  return (
    <section className="cat-section">
      <div className="cat-section-header">
        <div>
          <div className="cat-section-eye">{eyebrow}</div>
          <h2 className="cat-section-title">{title}</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', marginTop: 16, maxWidth: 600 }}>{desc}</p>
        </div>
        <div className="cat-section-counter">{items.length}<span>{group}</span></div>
      </div>
      <div className="cat-grid">
        {items.map((p, i) => <Card key={p.id} p={p} idx={i} />)}
      </div>
    </section>
  );
}

export default function Catalogo() {
  const [data, setData] = useState<ApiResp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/catalogo-predios`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setData)
      .catch(e => setErr(String(e)));
  }, []);

  const ativos = data?.predios.filter(p => p.statusGroup === 'ativo') || [];
  const instalacao = data?.predios.filter(p => p.statusGroup === 'instalacao') || [];
  const interesse = data?.predios.filter(p => p.statusGroup === 'interesse') || [];
  const total = data?.counts.total || 0;
  const unidadesTotal = (data?.predios || []).reduce((s, p) => s + (p.unidades || 0), 0);
  const pessoasTotal = (data?.predios || []).reduce((s, p) => s + (p.publico || 0), 0);

  return (
    <>
      <Helmet>
        <title>{`Catálogo Rede EXA Mídia · ${total || '100+'} Prédios · Foz do Iguaçu`}</title>
        <meta name="description" content={`A maior rede DOOH residencial do Paraná. ${total || '100+'} condomínios em Foz do Iguaçu com painéis premium nos elevadores.`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;700;900&family=Inter:wght@300;400;600&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <style>{STYLES}</style>
      <div className="catalogo-root">
        <header className="cat-hero">
          <div className="cat-hero-top">
            <img src={logoExa} alt="EXA Mídia" style={{ height: 64, width: 'auto', display: 'block' }} />

            <div className="cat-meta">EXA.NET.001<br /><strong>FOZ DO IGUAÇU · PR</strong><br />ATUALIZADO {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}</div>
          </div>
          <div className="cat-hero-main">
            <div className="cat-hero-eye">A maior rede DOOH residencial do Paraná</div>
            <h1 className="cat-hero-title"><span className="outline">{total || '100+'} PRÉDIOS.</span><br />UMA <span className="red">CIDADE INTEIRA</span><br />ASSISTINDO.</h1>
            <p className="cat-hero-desc">A Rede EXA Mídia conecta os melhores condomínios residenciais de Foz do Iguaçu em uma única plataforma de mídia digital. Painéis full HD instalados nos elevadores, com 95% de taxa de atenção comprovada e impacto direto sobre milhares de pessoas todos os dias.</p>
          </div>
          <div className="cat-kpis">
            <div className="cat-kpi"><div className="cat-kpi-num">{total || '—'}</div><div className="cat-kpi-label">PRÉDIOS NA REDE</div><div className="cat-kpi-sub">3 fases de operação</div></div>
            <div className="cat-kpi"><div className="cat-kpi-num white">{unidadesTotal.toLocaleString('pt-BR') || '—'}</div><div className="cat-kpi-label">UNIDADES TOTAIS</div><div className="cat-kpi-sub">Apartamentos cobertos</div></div>
            <div className="cat-kpi"><div className="cat-kpi-num">{pessoasTotal.toLocaleString('pt-BR') || '—'}</div><div className="cat-kpi-label">PESSOAS ALCANÇADAS</div><div className="cat-kpi-sub">Estimativa 3,5/unidade</div></div>
            <div className="cat-kpi"><div className="cat-kpi-num white">95%</div><div className="cat-kpi-label">TAXA DE ATENÇÃO</div><div className="cat-kpi-sub">DOOH em elevador</div></div>
            <div className="cat-kpi"><div className="cat-kpi-num">60×</div><div className="cat-kpi-label">VISTAS / SEMANA</div><div className="cat-kpi-sub">Por morador</div></div>
          </div>
        </header>

        {err && <div className="cat-loading" style={{ color: '#E8000D' }}>Erro ao carregar catálogo: {err}</div>}
        {!data && !err && <div className="cat-loading">Carregando catálogo</div>}

        {data && (
          <>
            <div className="cat-divider" />
            <Section
              eyebrow="Status · Operacional"
              title={<>PRÉDIOS <span className="red">ATIVOS</span></>}
              desc="Painéis instalados, plataforma rodando, anunciantes ativos. Estes condomínios já entregam audiência todos os dias."
              group="ATIVOS"
              items={ativos}
            />
            <div className="cat-divider" />
            <Section
              eyebrow="Status · Em Instalação"
              title={<>EM <span className="red">INSTALAÇÃO</span></>}
              desc="Contratos assinados, equipe técnica em campo. Em poucos dias estarão veiculando."
              group="INSTALANDO"
              items={instalacao}
            />
            <div className="cat-divider" />
            <Section
              eyebrow="Status · Pré-Acordo"
              title={<>NA <span className="red">FILA</span></>}
              desc="Síndicos demonstraram interesse e estão em fase de aprovação. Próximos a entrar na rede."
              group="EM ACORDO"
              items={interesse}
            />
          </>
        )}

        <div className="cat-cta">
          <div className="cat-hero-eye" style={{ display: 'inline-flex' }}>A vitrine dentro da casa do seu cliente</div>
          <h2 className="cat-cta-title">QUER ESTAR EM <span className="red">{total || '100+'} PRÉDIOS?</span></h2>
          <p className="cat-cta-desc">A Rede EXA Mídia entrega presença real, audiência cativa e métricas em tempo real. Fale com nossa equipe e leve sua marca para dentro do dia a dia das famílias premium de Foz do Iguaçu.</p>
          <div className="cat-cta-contacts">
            <a className="cat-cta-contact" href="https://www.examidia.com.br" target="_blank" rel="noreferrer">
              <div className="cat-cta-clabel">SITE</div>
              <div className="cat-cta-cval">examidia.com.br</div>
            </a>
            <a className="cat-cta-contact" href="https://wa.me/554599141585" target="_blank" rel="noreferrer">
              <div className="cat-cta-clabel">WHATSAPP</div>
              <div className="cat-cta-cval">(45) 9 9141-5856</div>
            </a>
            <a className="cat-cta-contact" href="https://www.instagram.com/examidia/" target="_blank" rel="noreferrer">
              <div className="cat-cta-clabel">INSTAGRAM</div>
              <div className="cat-cta-cval">@examidia</div>
            </a>
          </div>
        </div>

        <footer className="cat-footer">© {new Date().getFullYear()} INDEXA MÍDIA LTDA · CNPJ 38.142.638/0001-30 · Av. Paraná 974 sala 301 · Foz do Iguaçu, PR</footer>
      </div>
    </>
  );
}
