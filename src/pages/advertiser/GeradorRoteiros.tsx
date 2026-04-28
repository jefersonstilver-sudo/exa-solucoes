import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Sparkles, ChevronLeft, Monitor, Smartphone,
  Search, Check, Loader2, History, Trash2, Copy, QrCode,
  TrendingUp, Zap, Star, Target, BookOpen, Users,
  Play, ArrowRight, Tv, Clock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import exaLogo from '@/assets/exa-logo.png';

const SEGMENTS = [
  { label: 'Restaurante / Lanchonete', cat: 'Alimentação' },
  { label: 'Pizzaria', cat: 'Alimentação' },
  { label: 'Hamburgueria', cat: 'Alimentação' },
  { label: 'Sushi / Japonês', cat: 'Alimentação' },
  { label: 'Cafeteria / Café', cat: 'Alimentação' },
  { label: 'Padaria / Confeitaria', cat: 'Alimentação' },
  { label: 'Delivery de Comida', cat: 'Alimentação' },
  { label: 'Marmitex / Fit', cat: 'Alimentação' },
  { label: 'Açaí / Sorveteria', cat: 'Alimentação' },
  { label: 'Bar / Pub', cat: 'Alimentação' },
  { label: 'Academia / Musculação', cat: 'Saúde' },
  { label: 'Clínica Médica', cat: 'Saúde' },
  { label: 'Odontologia / Dentista', cat: 'Saúde' },
  { label: 'Psicologia / Terapia', cat: 'Saúde' },
  { label: 'Fisioterapia', cat: 'Saúde' },
  { label: 'Farmácia / Drogaria', cat: 'Saúde' },
  { label: 'Nutrição / Nutrólogo', cat: 'Saúde' },
  { label: 'Estética / Clínica de Beleza', cat: 'Saúde' },
  { label: 'Pilates / Yoga', cat: 'Saúde' },
  { label: 'Clínica Veterinária', cat: 'Saúde' },
  { label: 'Salão de Beleza', cat: 'Beleza' },
  { label: 'Barbearia', cat: 'Beleza' },
  { label: 'Loja de Roupas / Boutique', cat: 'Beleza' },
  { label: 'Manicure / Esmalteria', cat: 'Beleza' },
  { label: 'Depilação / Laser', cat: 'Beleza' },
  { label: 'Maquiagem / Micropigmentação', cat: 'Beleza' },
  { label: 'Escola / Colégio', cat: 'Educação' },
  { label: 'Curso de Idiomas', cat: 'Educação' },
  { label: 'Cursinho / Pré-vestibular', cat: 'Educação' },
  { label: 'Escola de Música / Arte', cat: 'Educação' },
  { label: 'Faculdade / Universidade', cat: 'Educação' },
  { label: 'Cursos Online / EAD', cat: 'Educação' },
  { label: 'Banco / Fintech', cat: 'Financeiro' },
  { label: 'Corretora de Seguros', cat: 'Financeiro' },
  { label: 'Contabilidade', cat: 'Financeiro' },
  { label: 'Consórcio / Financiamento', cat: 'Financeiro' },
  { label: 'Crédito / Empréstimo', cat: 'Financeiro' },
  { label: 'Câmbio / Turismo Financeiro', cat: 'Financeiro' },
  { label: 'Imobiliária', cat: 'Imóveis' },
  { label: 'Construtora / Incorporadora', cat: 'Imóveis' },
  { label: 'Administração de Condomínios', cat: 'Imóveis' },
  { label: 'Reformas / Construção Civil', cat: 'Imóveis' },
  { label: 'Arquitetura / Design de Interiores', cat: 'Imóveis' },
  { label: 'Assistência Técnica', cat: 'Tecnologia' },
  { label: 'Loja de Eletrônicos', cat: 'Tecnologia' },
  { label: 'Software / Aplicativo', cat: 'Tecnologia' },
  { label: 'Segurança Eletrônica', cat: 'Tecnologia' },
  { label: 'Concessionária / Revendedora', cat: 'Automotivo' },
  { label: 'Oficina Mecânica', cat: 'Automotivo' },
  { label: 'Loja de Pneus', cat: 'Automotivo' },
  { label: 'Estética Automotiva', cat: 'Automotivo' },
  { label: 'Locadora de Veículos', cat: 'Automotivo' },
  { label: 'Supermercado / Mercado', cat: 'Varejo' },
  { label: 'Pet Shop', cat: 'Varejo' },
  { label: 'Loja de Móveis / Decoração', cat: 'Varejo' },
  { label: 'Ótica', cat: 'Varejo' },
  { label: 'Joalheria / Bijuteria', cat: 'Varejo' },
  { label: 'Floricultura', cat: 'Varejo' },
  { label: 'Hotel / Pousada', cat: 'Turismo' },
  { label: 'Agência de Turismo', cat: 'Turismo' },
  { label: 'Parque / Atração Turística', cat: 'Turismo' },
  { label: 'Eventos / Buffet', cat: 'Turismo' },
  { label: 'Advocacia', cat: 'Jurídico' },
  { label: 'Despachante / Documentação', cat: 'Jurídico' },
  { label: 'Serviços de Limpeza', cat: 'Serviços' },
  { label: 'Lavanderia', cat: 'Serviços' },
  { label: 'Gráfica / Comunicação Visual', cat: 'Serviços' },
  { label: 'Fotografia / Filmagem', cat: 'Serviços' },
  { label: 'Igreja / Organização Religiosa', cat: 'Outros' },
  { label: 'ONG / Instituição Social', cat: 'Outros' },
  { label: 'Outro segmento', cat: 'Outros' },
];

const CATEGORIES = ['Todos', ...Array.from(new Set(SEGMENTS.map(s => s.cat)))];

const VIDEO_TYPES = [
  { id: 'institucional', label: 'Institucional', icon: Users, desc: 'Apresentação de marca' },
  { id: 'oferta', label: 'Oferta', icon: Zap, desc: 'Promoção + CTA direto' },
  { id: 'awareness', label: 'Awareness', icon: TrendingUp, desc: 'Topo de funil' },
  { id: 'prova_social', label: 'Prova Social', icon: Star, desc: 'Depoimento / autoridade' },
  { id: 'cta_direto', label: 'CTA Direto', icon: Target, desc: 'Urgência / conversão' },
  { id: 'filler', label: 'Filler', icon: BookOpen, desc: 'Conteúdo educativo' },
];

const TONES = [
  { id: 'impactante', label: 'Impactante', emoji: '⚡', desc: 'Direto ao ponto' },
  { id: 'emocional', label: 'Emocional', emoji: '❤️', desc: 'Conecta com o coração' },
  { id: 'urgente', label: 'Urgente', emoji: '🔥', desc: 'Escassez e ação' },
  { id: 'educativo', label: 'Educativo', emoji: '💡', desc: 'Informa e convence' },
  { id: 'divertido', label: 'Divertido', emoji: '😄', desc: 'Leve e memorável' },
  { id: 'profissional', label: 'Profissional', emoji: '💼', desc: 'Credibilidade' },
];

const COUNT_TIPS: Record<number, string> = {
  1: 'Teste rápido. Foque no institucional ou oferta principal.',
  2: 'Combine institucional + oferta. Duas abordagens em teste.',
  3: 'Tríade completa: awareness → oferta → CTA.',
  4: 'Adicione prova social. Frequência reforça a mensagem.',
  5: 'Campanha robusta. Cobre diferentes horários e objetivos.',
  6: 'Rotação mantém atenção alta. Diversifique os tipos.',
  7: 'Estratégia de funil completa.',
  8: 'Cobre manhã, almoço e noite com mensagens distintas.',
  9: 'Campanha profissional. Máxima presença de marca.',
  10: 'Presença total — domínio do condomínio.',
};

function buildPrompt(f: FData): string {
  const fmt = f.format === 'vertical' ? 'Vertical 9:16 (1080×1920px, 15s)' : 'Horizontal 16:9 (1440×1080px, 10s)';
  const bp = f.format === 'vertical'
    ? '0s–2s CAPTURA | 2s–5s PROBLEMA/DESEJO | 5s–10s SOLUÇÃO+PROVA | 10s–13s OFERTA+URGÊNCIA | 13s–15s ANCORAGEM'
    : '0s–2s CAPTURA | 2s–6s MENSAGEM ÚNICA | 6s–8s CREDENCIAL | 8s–10s ANCORAGEM';
  const types = f.videoTypes.length > 0 ? f.videoTypes.join(', ') : 'institucional, oferta, awareness';
  return `Especialista em roteiros DOOH — elevadores residenciais Examidia, Foz do Iguaçu.
PLATAFORMA: 95% atenção | 40-60 exibições/semana | FORMATO: ${fmt}
BLUEPRINT: ${bp}
REGRAS: 60pt mín | máx 3 cores | 5-7 palavras/linha | frame estático final | sem logo inicial${f.hasQrCode ? ' | QR Code mín 5s + CTA' : ''}
EMPRESA: ${f.companyName} | SEGMENTO: ${f.segment} | TOM: ${f.tone}${f.extraInfo ? `\nDETALHES: ${f.extraInfo}` : ''}
CRIE ${f.videoCount} ROTEIRO(S) — tipos: ${types}
Para cada roteiro:
---
## ROTEIRO [N]: [TIPO]
**Objetivo:** ...
| Tempo | Cena | VISUAL | TEXTO NA TELA | ÁUDIO |
|-------|------|--------|---------------|-------|
[blueprint linha por linha]
**Produção:** [1 dica específica]
---`;
}

interface FData {
  companyName: string; segment: string; format: 'vertical' | 'horizontal';
  videoCount: number; videoTypes: string[]; tone: string; hasQrCode: boolean; extraInfo: string;
}
interface RoteiroRecord {
  id: string; company_name: string; segment: string; format: string;
  video_count: number; tone: string | null; roteiro_content: string; created_at: string;
}
type Phase = 'welcome' | 'wizard' | 'loading' | 'result' | 'history';

// ── CSS global ────────────────────────────────────────────────────────────────
const CSS = `
@keyframes orbF1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,30px) scale(1.05)}66%{transform:translate(-20px,50px) scale(.95)}}
@keyframes orbF2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-50px,-30px) scale(1.08)}66%{transform:translate(30px,-20px) scale(.92)}}
@keyframes orbF3{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.3)}}
@keyframes fsu{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes sh{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes dp{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
.g-fsu{animation:fsu .4s ease both}
.g-fi{animation:fi .5s ease both}
.g-sh{background:linear-gradient(90deg,#7A1515,#E8001D,#9C1E1E,#E8001D,#7A1515);background-size:300% auto;animation:sh 3s linear infinite}
`;

const Bg = () => (
  <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
    <div style={{ position:'absolute', inset:0, background:'#060810' }} />
    <style>{CSS}</style>
    <div style={{ position:'absolute', width:600, height:600, top:'-10%', left:'-10%', opacity:.2,
      background:'radial-gradient(circle,#9C1E1E 0%,transparent 70%)', borderRadius:'50%',
      animation:'orbF1 12s ease-in-out infinite' }} />
    <div style={{ position:'absolute', width:500, height:500, bottom:'-5%', right:'-5%', opacity:.15,
      background:'radial-gradient(circle,#E8001D 0%,transparent 70%)', borderRadius:'50%',
      animation:'orbF2 15s ease-in-out infinite' }} />
    <div style={{ position:'absolute', width:300, height:300, top:'40%', left:'50%', opacity:.1,
      background:'radial-gradient(circle,#C8001A 0%,transparent 70%)', borderRadius:'50%',
      animation:'orbF3 10s ease-in-out infinite' }} />
  </div>
);

const PBar = ({ step, total }: { step: number; total: number }) => (
  <div style={{ position:'fixed', top:0, left:0, right:0, height:2, background:'rgba(255,255,255,.06)', zIndex:50 }}>
    <div style={{ height:'100%', width:`${(step/total)*100}%`, background:'linear-gradient(90deg,#9C1E1E,#E8001D)', transition:'width .5s ease' }} />
  </div>
);

const Wrap = ({ children, k }: { children: React.ReactNode; k: number }) => (
  <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 16px', position:'relative', zIndex:10 }}>
    <div key={k} className="g-fsu" style={{ width:'100%', maxWidth:680 }}>{children}</div>
  </div>
);

const Title = ({ t, s }: { t: string; s?: string }) => (
  <div style={{ textAlign:'center', marginBottom:40 }}>
    <h2 style={{ fontSize:36, fontWeight:900, color:'white', marginBottom:12, lineHeight:1.2 }}>{t}</h2>
    {s && <p style={{ color:'rgba(255,255,255,.35)', fontSize:16 }}>{s}</p>}
  </div>
);

const Meta = ({ step, total }: { step: number; total: number }) => (
  <p style={{ textAlign:'center', marginBottom:32, fontSize:11, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,.2)' }}>
    Etapa {step} de {total}
  </p>
);

const cOff: React.CSSProperties = { background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', color:'rgba(255,255,255,.6)', cursor:'pointer', transition:'all .2s' };
const cOn: React.CSSProperties = { background:'rgba(156,30,30,.25)', border:'1px solid rgba(232,0,29,.6)', color:'white', cursor:'pointer', boxShadow:'0 0 20px rgba(232,0,29,.3)', transition:'all .2s' };

const Nav = ({ onBack, onNext, label='Continuar', disabled=false, isLast=false, loading=false }: {
  onBack?:()=>void; onNext?:()=>void; label?:string; disabled?:boolean; isLast?:boolean; loading?:boolean;
}) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:48 }}>
    <button onClick={onBack} disabled={!onBack} style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:14, cursor:onBack?'pointer':'default', opacity:onBack?1:0 }}>
      <ChevronLeft size={16} /> Voltar
    </button>
    <button
      onClick={onNext} disabled={disabled||loading}
      className={isLast && !disabled && !loading ? 'g-sh' : ''}
      style={{
        display:'flex', alignItems:'center', gap:10, padding:'14px 32px', borderRadius:16,
        fontWeight:700, color:'white', fontSize:16, border:'none', cursor:disabled||loading?'not-allowed':'pointer',
        transition:'all .2s', transform:'scale(1)',
        ...(disabled||loading
          ? { background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.25)' }
          : isLast ? { boxShadow:'0 0 30px rgba(232,0,29,.5)' }
          : { background:'#9C1E1E', boxShadow:'0 0 20px rgba(220,38,38,.3)' }
        )
      }}
    >
      {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Gerando...</> : <>{label} <ArrowRight size={16} /></>}
    </button>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
const GeradorRoteiros: React.FC = () => {
  const { userProfile } = useAuth();
  const [phase, setPhase] = useState<Phase>('welcome');
  const [step, setStep] = useState(1);
  const TOTAL = 6;
  const [result, setResult] = useState<string|null>(null);
  const [history, setHistory] = useState<RoteiroRecord[]>([]);
  const [histLoad, setHistLoad] = useState(false);
  const [segQ, setSegQ] = useState('');
  const [segCat, setSegCat] = useState('Todos');
  const resultRef = useRef<HTMLDivElement>(null);

  const pc = (userProfile as any)?.company_name || (userProfile as any)?.nome || (userProfile as any)?.name || '';

  const [form, setForm] = useState<FData>({
    companyName: pc, segment: '', format: 'vertical', videoCount: 3,
    videoTypes: [], tone: 'impactante', hasQrCode: false, extraInfo: '',
  });

  useEffect(() => { if (pc && !form.companyName) setForm(f=>({...f,companyName:pc})); }, [pc]);
  useEffect(() => { if (phase==='history') loadHist(); }, [phase]);

  const loadHist = async () => {
    setHistLoad(true);
    const { data } = await supabase.from('roteiros_gerados' as any).select('*').order('created_at',{ascending:false});
    if (data) setHistory(data as RoteiroRecord[]);
    setHistLoad(false);
  };

  const generate = async () => {
    setPhase('loading');
    try {
      const { data, error } = await supabase.functions.invoke('generate-roteiro', {
        body: { model:'claude-3-5-sonnet-20241022', max_tokens:4096, messages:[{role:'user',content:buildPrompt(form)}] },
      });
      if (error) throw new Error(error.message);
      const content = data?.content?.[0]?.text;
      if (!content) throw new Error(data?.error?.message || 'Resposta vazia da IA');
      setResult(content);
      const { data:{ user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('roteiros_gerados' as any).insert({
          user_id:user.id, company_name:form.companyName, segment:form.segment,
          format:form.format, video_count:form.videoCount, tone:form.tone,
          has_qr_code:form.hasQrCode, blueprint_types:form.videoTypes, roteiro_content:content,
        });
      }
      setPhase('result');
      setTimeout(()=>resultRef.current?.scrollIntoView({behavior:'smooth'}),100);
    } catch(err:any) {
      toast.error(err.message||'Erro ao gerar. Tente novamente.');
      setPhase('wizard'); setStep(6);
    }
  };

  const reset = () => { setForm({companyName:pc,segment:'',format:'vertical',videoCount:3,videoTypes:[],tone:'impactante',hasQrCode:false,extraInfo:''}); setStep(1); setResult(null); setPhase('wizard'); };
  const copy = (t:string) => { navigator.clipboard.writeText(t); toast.success('Copiado!'); };
  const del = async (id:string) => { await supabase.from('roteiros_gerados' as any).delete().eq('id',id); setHistory(h=>h.filter(r=>r.id!==id)); toast.success('Excluído'); };
  const segs = SEGMENTS.filter(s=>(segCat==='Todos'||s.cat===segCat)&&s.label.toLowerCase().includes(segQ.toLowerCase()));
  const tog = (id:string) => setForm(f=>({...f,videoTypes:f.videoTypes.includes(id)?f.videoTypes.filter(v=>v!==id):[...f.videoTypes,id]}));

  // ── WELCOME ──────────────────────────────────────────────────────────────
  if (phase==='welcome') return (
    <div style={{ position:'relative' }}>
      <Bg />
      <div className="g-fi" style={{ position:'relative', zIndex:10, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 16px', textAlign:'center' }}>
        <img src={exaLogo} alt="EXA" style={{ width:72, height:72, marginBottom:24, filter:'drop-shadow(0 4px 24px rgba(232,0,29,.4))' }} />
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:24, padding:'6px 16px', borderRadius:999, background:'rgba(156,30,30,.3)', border:'1px solid rgba(232,0,29,.3)', color:'#FCA5A5', fontSize:13, fontWeight:600 }}>
          <Sparkles size={14} /> Powered by Inteligência Artificial
        </div>
        <h1 style={{ fontSize:54, fontWeight:900, color:'white', marginBottom:16, lineHeight:1.05, letterSpacing:'-1px' }}>
          Gerador de<br />
          <span style={{ background:'linear-gradient(135deg,#FC8181,#E8001D)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Roteiros EXA</span>
        </h1>
        <p style={{ fontSize:18, color:'rgba(255,255,255,.4)', maxWidth:440, marginBottom:16, lineHeight:1.7 }}>
          Crie roteiros profissionais e assertivos para os painéis digitais dos elevadores. Cada vídeo pensado para converter dentro da sua campanha.
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:24, marginBottom:48, fontSize:13, color:'rgba(255,255,255,.3)' }}>
          {[{I:Tv,t:'DOOH em elevadores'},{I:Clock,t:'15s vertical / 10s horizontal'},{I:Star,t:'95% de atenção garantida'}].map(({I,t})=>(
            <div key={t} style={{ display:'flex', alignItems:'center', gap:8 }}><I size={16} color="#E8001D" />{t}</div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>
          <button onClick={()=>{setPhase('wizard');setStep(1);}} className="g-sh"
            style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 40px', borderRadius:20, fontWeight:800, color:'white', fontSize:18, border:'none', cursor:'pointer', boxShadow:'0 0 40px rgba(232,0,29,.5)' }}>
            <Play size={20} /> Criar Roteiro Agora
          </button>
          <button onClick={()=>setPhase('history')}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 32px', borderRadius:20, fontWeight:600, color:'rgba(255,255,255,.5)', fontSize:16, background:'none', border:'1px solid rgba(255,255,255,.12)', cursor:'pointer' }}>
            <History size={16} /> Meus Roteiros
          </button>
        </div>
        <p style={{ marginTop:40, fontSize:11, color:'rgba(255,255,255,.15)' }}>Blueprints neuromarketing · PNL aplicada · Formatação profissional DOOH</p>
      </div>
    </div>
  );

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase==='loading') return (
    <div style={{ position:'relative' }}>
      <Bg />
      <div className="g-fi" style={{ position:'relative', zIndex:10, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, textAlign:'center' }}>
        <div style={{ position:'relative', marginBottom:32 }}>
          <div style={{ width:112, height:112, borderRadius:'50%', border:'1px solid rgba(156,30,30,.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', border:'1px solid rgba(232,0,29,.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sparkles size={36} color="#FCA5A5" style={{ animation:'spin 3s linear infinite' }} />
            </div>
          </div>
        </div>
        <h2 style={{ fontSize:26, fontWeight:800, color:'white', marginBottom:12 }}>Criando seus roteiros...</h2>
        <p style={{ fontSize:14, color:'rgba(255,255,255,.4)', maxWidth:320 }}>
          Analisando <span style={{color:'#FCA5A5'}}>{form.segment}</span> e montando roteiros para <span style={{color:'rgba(255,255,255,.7)'}}>{form.companyName}</span>
        </p>
        <div style={{ display:'flex', gap:10, marginTop:32 }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#E8001D', animation:`dp 1.2s ease-in-out ${i*.25}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (phase==='result'&&result) return (
    <div style={{ position:'relative' }}>
      <Bg />
      <div ref={resultRef} className="g-fi" style={{ position:'relative', zIndex:10, padding:'64px 16px' }}>
        <div style={{ maxWidth:720, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:20, padding:'6px 16px', borderRadius:999, background:'rgba(20,83,45,.4)', border:'1px solid rgba(34,197,94,.3)', color:'#86EFAC', fontSize:13, fontWeight:600 }}>
              <Check size={14} /> {form.videoCount} roteiro{form.videoCount>1?'s':''} gerado{form.videoCount>1?'s':''} com sucesso
            </div>
            <h2 style={{ fontSize:28, fontWeight:800, color:'white', marginBottom:8 }}>{form.companyName}</h2>
            <p style={{ color:'rgba(255,255,255,.35)', fontSize:14 }}>{form.segment} · {form.format==='vertical'?'Vertical 15s':'Horizontal 10s'}</p>
          </div>
          <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:24, padding:32, marginBottom:24, overflowX:'auto' }}>
            <pre style={{ color:'rgba(255,255,255,.8)', fontSize:13, lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'monospace' }}>{result}</pre>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center' }}>
            {[
              { icon:Copy, label:'Copiar roteiros', onClick:()=>copy(result), primary:false },
              { icon:Sparkles, label:'Criar novos roteiros', onClick:reset, primary:true },
              { icon:History, label:'Ver histórico', onClick:()=>{loadHist();setPhase('history');}, primary:false },
            ].map(({icon:I,label,onClick,primary})=>(
              <button key={label} onClick={onClick}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:14, fontWeight:600, fontSize:14, border:'none', cursor:'pointer', color:'white', transition:'all .2s',
                  ...(primary?{background:'#9C1E1E',boxShadow:'0 0 20px rgba(220,38,38,.3)'}:{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)'}) }}>
                <I size={16} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── HISTORY ───────────────────────────────────────────────────────────────
  if (phase==='history') return (
    <div style={{ position:'relative' }}>
      <Bg />
      <div className="g-fi" style={{ position:'relative', zIndex:10, padding:'64px 16px' }}>
        <div style={{ maxWidth:640, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:40 }}>
            <div>
              <h2 style={{ fontSize:24, fontWeight:800, color:'white' }}>Meus Roteiros</h2>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.3)', marginTop:4 }}>Histórico de roteiros gerados</p>
            </div>
            <button onClick={()=>setPhase('welcome')} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:14, background:'#9C1E1E', color:'white', fontWeight:600, fontSize:14, border:'none', cursor:'pointer' }}>
              <Sparkles size={14} /> Novo roteiro
            </button>
          </div>
          {histLoad ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><Loader2 size={32} color="#E8001D" style={{ animation:'spin 1s linear infinite' }} /></div>
          ) : history.length===0 ? (
            <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(255,255,255,.25)' }}><History size={48} style={{ margin:'0 auto 16px', opacity:.3 }} /><p>Nenhum roteiro gerado ainda.</p></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {history.map(r=>(
                <div key={r.id} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:20, padding:20 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
                    <div>
                      <div style={{ fontWeight:700, color:'white', fontSize:15 }}>{r.company_name}</div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,.35)', marginTop:2 }}>{r.segment}</div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      <span style={{ fontSize:11, padding:'4px 10px', borderRadius:8, background:'rgba(156,30,30,.3)', color:'#FCA5A5', border:'1px solid rgba(232,0,29,.2)' }}>
                        {r.format==='vertical'?'9:16 · 15s':'16:9 · 10s'}
                      </span>
                      <span style={{ fontSize:11, padding:'4px 10px', borderRadius:8, background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.4)', border:'1px solid rgba(255,255,255,.1)' }}>
                        {r.video_count} vídeo{r.video_count>1?'s':''}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.25)', background:'rgba(0,0,0,.2)', borderRadius:12, padding:'10px 12px', maxHeight:72, overflow:'hidden', fontFamily:'monospace', marginBottom:12 }}>
                    {r.roteiro_content.substring(0,200)}...
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,.2)' }}>{new Date(r.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}</span>
                    <div style={{ display:'flex', gap:4 }}>
                      {[{I:Copy,l:'Copiar',fn:()=>copy(r.roteiro_content),c:'rgba(255,255,255,.35)'},{I:Trash2,l:'Excluir',fn:()=>del(r.id),c:'rgba(252,129,129,.5)'}].map(({I,l,fn,c})=>(
                        <button key={l} onClick={fn} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, padding:'6px 12px', borderRadius:10, background:'none', border:'none', color:c, cursor:'pointer' }}><I size={12} />{l}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── WIZARD ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:'relative' }}>
      <Bg />
      <PBar step={step} total={TOTAL} />

      {step===1 && (
        <Wrap k={1}>
          <Meta step={1} total={TOTAL} />
          <Title t="Para qual empresa?" s="Pode ser a sua ou outra que você representa" />
          <Input value={form.companyName} onChange={e=>setForm(f=>({...f,companyName:e.target.value}))}
            placeholder="Ex: Salão da Marcia, Dr. João Odontologia, Pizzaria Bella..."
            className="h-16 text-center text-lg text-white placeholder:text-white/20 rounded-2xl"
            style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.12)' }} />
          <Nav onBack={()=>setPhase('welcome')} onNext={()=>setStep(2)} disabled={!form.companyName.trim()} />
        </Wrap>
      )}

      {step===2 && (
        <Wrap k={2}>
          <Meta step={2} total={TOTAL} />
          <Title t="Qual o segmento?" s="Escolha com precisão — nunca chutamos" />
          <div style={{ position:'relative', marginBottom:16 }}>
            <Search size={16} style={{ position:'absolute', left:16, top:14, color:'rgba(255,255,255,.3)' }} />
            <input value={segQ} onChange={e=>setSegQ(e.target.value)} placeholder="Buscar segmento..."
              style={{ width:'100%', height:48, paddingLeft:44, paddingRight:16, borderRadius:16, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'white', fontSize:14, outline:'none' }} />
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {CATEGORIES.map(c=>(
              <button key={c} onClick={()=>setSegCat(c)}
                style={{ padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:600, border:'none', cursor:'pointer',
                  ...(segCat===c?{background:'#9C1E1E',color:'white'}:{background:'rgba(255,255,255,.05)',color:'rgba(255,255,255,.4)',border:'1px solid rgba(255,255,255,.08)'}) }}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, maxHeight:256, overflowY:'auto', paddingRight:4 }}>
            {segs.map(seg=>(
              <button key={seg.label} onClick={()=>setForm(f=>({...f,segment:seg.label}))}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:14, fontSize:13, textAlign:'left', ...(form.segment===seg.label?cOn:cOff) }}>
                {form.segment===seg.label&&<Check size={12} color="#FCA5A5" style={{flexShrink:0}} />}
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{seg.label}</span>
              </button>
            ))}
          </div>
          {form.segment&&(
            <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:14, background:'rgba(156,30,30,.2)', border:'1px solid rgba(232,0,29,.3)', color:'#FCA5A5', fontSize:14 }}>
              <Check size={14} />{form.segment}
            </div>
          )}
          <Nav onBack={()=>setStep(1)} onNext={()=>setStep(3)} disabled={!form.segment} />
        </Wrap>
      )}

      {step===3 && (
        <Wrap k={3}>
          <Meta step={3} total={TOTAL} />
          <Title t="Formato do vídeo" s="Escolha o painel onde seu vídeo vai rodar" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            {[
              { id:'vertical', label:'Vertical', dim:'1080 × 1920px', dur:'15 segundos', badge:'3 empresas / ciclo', W:52, H:88, I:Smartphone },
              { id:'horizontal', label:'Horizontal', dim:'1440 × 1080px', dur:'10 segundos', badge:'15 empresas / ciclo', W:88, H:52, I:Monitor },
            ].map(o=>(
              <button key={o.id} onClick={()=>setForm(f=>({...f,format:o.id as 'vertical'|'horizontal'}))}
                style={{ position:'relative', padding:24, borderRadius:20, textAlign:'left', ...(form.format===o.id?cOn:cOff) }}>
                {form.format===o.id&&<div style={{ position:'absolute', top:12, right:12, width:20, height:20, borderRadius:'50%', background:'#E8001D', display:'flex', alignItems:'center', justifyContent:'center' }}><Check size={11} color="white" /></div>}
                <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                  <div style={{ width:o.W, height:o.H, background:'linear-gradient(135deg,#9C1E1E,#3D0A0A)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <o.I size={22} color="white" />
                  </div>
                </div>
                <div style={{ fontWeight:700, color:'white', fontSize:15, marginBottom:4 }}>{o.label}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:2 }}>{o.dim}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:12 }}>Duração: {o.dur}</div>
                <div style={{ fontSize:12, color:'#FCA5A5', fontWeight:600 }}>{o.badge}</div>
              </button>
            ))}
          </div>
          <button onClick={()=>setForm(f=>({...f,hasQrCode:!f.hasQrCode}))}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:16, padding:16, borderRadius:20, ...(form.hasQrCode?cOn:cOff) }}>
            <QrCode size={20} color={form.hasQrCode?'#FCA5A5':'rgba(255,255,255,.3)'} style={{flexShrink:0}} />
            <div style={{ flex:1, textAlign:'left' }}>
              <div style={{ fontSize:14, fontWeight:600, color:'white' }}>Incluir QR Code</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginTop:2 }}>Aparece mínimo 5s + CTA de escaneamento</div>
            </div>
            <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${form.hasQrCode?'#E8001D':'rgba(255,255,255,.2)'}`, background:form.hasQrCode?'#E8001D':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {form.hasQrCode&&<Check size={11} color="white" />}
            </div>
          </button>
          <Nav onBack={()=>setStep(2)} onNext={()=>setStep(4)} />
        </Wrap>
      )}

      {step===4 && (
        <Wrap k={4}>
          <Meta step={4} total={TOTAL} />
          <Title t="Quantos vídeos?" s="Você tem até 10 slots por campanha" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
            {Array.from({length:10},(_,i)=>i+1).map(n=>(
              <button key={n} onClick={()=>setForm(f=>({...f,videoCount:n}))}
                style={{ height:56, borderRadius:16, fontWeight:800, fontSize:20, border:'none', cursor:'pointer', transition:'all .15s',
                  ...(form.videoCount===n
                    ?{background:'#9C1E1E',color:'white',boxShadow:'0 0 20px rgba(220,38,38,.4)',transform:'scale(1.1)',border:'1px solid rgba(232,0,29,.6)'}
                    :{background:'rgba(255,255,255,.05)',color:'rgba(255,255,255,.45)',border:'1px solid rgba(255,255,255,.08)'}) }}>
                {n}
              </button>
            ))}
          </div>
          <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:20, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:40, fontWeight:900, color:'white', marginBottom:6 }}>{form.videoCount}</div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#FCA5A5', marginBottom:8 }}>
              {form.videoCount===10?'Presença Total':form.videoCount>=7?'Campanha Profissional':form.videoCount>=4?'Estratégia Completa':'Campanha Inicial'}
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.4)' }}>{COUNT_TIPS[form.videoCount]}</p>
          </div>
          <Nav onBack={()=>setStep(3)} onNext={()=>setStep(5)} />
        </Wrap>
      )}

      {step===5 && (
        <Wrap k={5}>
          <Meta step={5} total={TOTAL} />
          <Title t="Tipos de vídeo" s="Selecione — a IA distribui estrategicamente nos slots" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {VIDEO_TYPES.map(t=>(
              <button key={t.id} onClick={()=>tog(t.id)}
                style={{ display:'flex', alignItems:'flex-start', gap:12, padding:16, borderRadius:18, textAlign:'left', ...(form.videoTypes.includes(t.id)?cOn:cOff) }}>
                <t.icon size={16} color={form.videoTypes.includes(t.id)?'#FCA5A5':'rgba(255,255,255,.3)'} style={{marginTop:2,flexShrink:0}} />
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:form.videoTypes.includes(t.id)?'white':'rgba(255,255,255,.65)' }}>{t.label}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.25)', marginTop:2 }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.25)' }}>
            {form.videoTypes.length===0?'Nenhum selecionado — a IA escolhe automaticamente':`${form.videoTypes.length} tipo${form.videoTypes.length>1?'s':''} selecionado${form.videoTypes.length>1?'s':''}`}
          </p>
          <Nav onBack={()=>setStep(4)} onNext={()=>setStep(6)} />
        </Wrap>
      )}

      {step===6 && (
        <Wrap k={6}>
          <Meta step={6} total={TOTAL} />
          <Title t="Tom e detalhes finais" s="Como sua mensagem deve soar?" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
            {TONES.map(t=>(
              <button key={t.id} onClick={()=>setForm(f=>({...f,tone:t.id}))}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 12px', borderRadius:18, ...(form.tone===t.id?cOn:cOff) }}>
                <span style={{ fontSize:24 }}>{t.emoji}</span>
                <span style={{ fontSize:12, fontWeight:700, color:form.tone===t.id?'white':'rgba(255,255,255,.55)' }}>{t.label}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,.25)', textAlign:'center', lineHeight:1.3 }}>{t.desc}</span>
              </button>
            ))}
          </div>
          <textarea value={form.extraInfo} onChange={e=>setForm(f=>({...f,extraInfo:e.target.value}))} rows={4}
            placeholder="Informações extras: promoção, datas, diferenciais, produto específico, telefone, anos de experiência..."
            style={{ width:'100%', resize:'none', borderRadius:20, padding:'16px', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'white', fontSize:14, lineHeight:1.6, outline:'none', fontFamily:'inherit' }} />
          <Nav onBack={()=>setStep(5)} onNext={generate} label={`Gerar ${form.videoCount} roteiro${form.videoCount>1?'s':''}`} isLast loading={phase==='loading'} />
        </Wrap>
      )}
    </div>
  );
};

export default GeradorRoteiros;
