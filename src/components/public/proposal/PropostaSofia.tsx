import React, { useEffect, useState } from 'react';
import { Building2, CalendarDays, CheckCircle2, Clock, FileDown, MapPin, MessageCircle, Monitor, Receipt, Sparkles } from 'lucide-react';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import ReplicaPainel from '@/components/pedido-v2/ReplicaPainel';
import { useWeatherData } from '@/hooks/useWeatherData';
import mockupVertical from '@/assets/mockups/mockup-vertical.png';

/**
 * EXA 2.0 — Proposta comercial enviada pela Sofia (layout 2026-10).
 * Enxuta e oficial: resumo, onde aparece, especificação do vídeo e próximos passos.
 * Sem total do contrato (só a mensalidade), sem CPF completo, com a forma de pagamento real
 * (metadata.forma_pagamento: boleto | pix_automatico | pix_unico). O PDF é a mesma página em A4 (impressão).
 */

const SOFIA_WA = 'https://wa.me/5545991415920';
const SAMPLE_VIDEO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/videos/de96cfa9-9dbe-4ead-be94-3647e345d2de/1793020345896_DELFUEGO_V1-fermentacao_10s_horizontal.mp4';

const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '');
const mascaraDoc = (doc?: string | null) => {
  const d = String(doc || '').replace(/\D/g, '');
  if (d.length === 11) return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return doc || '';
};

interface Props {
  proposal: any;
  buildings: any[];
  isExpired?: boolean;
}

const Linha: React.FC<{ rotulo: string; children: React.ReactNode; destaque?: boolean }> = ({ rotulo, children, destaque }) => (
  <div className="flex items-start justify-between gap-4 py-3 print:py-2">
    <span className="text-[13px] text-[#8b8285] print:text-[11px]">{rotulo}</span>
    <span className={`text-right ${destaque ? 'text-[22px] font-extrabold tracking-tight text-[#1b1719] print:text-[18px]' : 'text-[14.5px] font-semibold text-[#1b1719] print:text-[12px]'}`}>{children}</span>
  </div>
);

const Secao: React.FC<{ titulo: string; icone: React.ElementType; children: React.ReactNode; className?: string }> = ({ titulo, icone: Icone, children, className = '' }) => (
  <section className={`rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(30,15,18,.05),0_10px_30px_-18px_rgba(30,15,18,.25)] sm:p-6 print:break-inside-avoid print:rounded-none print:border-t print:border-[#e8e2e3] print:p-0 print:pt-4 print:shadow-none ${className}`}>
    <div role="heading" aria-level={2} className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[.14em] text-[#9C1E1E] print:mb-2 print:text-[10px]">
      <Icone className="h-4 w-4 print:h-3 print:w-3" /> {titulo}
    </div>
    {children}
  </section>
);

export const PropostaSofia: React.FC<Props> = ({ proposal, buildings, isExpired }) => {
  const { weatherData } = useWeatherData();
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setAgora(new Date()), 1000); return () => clearInterval(i); }, []);

  const meta = (proposal?.metadata || {}) as any;
  const vertical = proposal?.tipo_produto === 'vertical_premium';
  const forma: string = meta.forma_pagamento || 'pix_automatico';
  const dia = meta.dia_vencimento || 10;
  const meses = Number(proposal?.duration_months || 6);
  const mensal = Number(proposal?.fidel_monthly_value || 0);
  const unico = forma === 'pix_unico';
  const telas = buildings.reduce((s, b) => s + Number(b?.quantidade_telas || 1), 0);
  const nome = proposal?.client_company_name || proposal?.client_name || '';
  const aceita = proposal?.status === 'aceita';

  const pagamento = forma === 'boleto'
    ? `Boleto mensal com Pix · vence todo dia ${dia}`
    : unico ? 'Pix · pagamento único' : 'Pix Automático mensal';

  const passos = [
    'Responda "concordo" para a Sofia no WhatsApp.',
    'Confirme o código de 6 dígitos que chega no seu e-mail.',
    forma === 'boleto'
      ? 'Receba o 1º boleto no WhatsApp e no e-mail. Pelo Pix do próprio boleto, a confirmação é na hora.'
      : unico ? 'Pague o Pix que a Sofia envia.' : 'Autorize o Pix Automático uma única vez; as próximas mensalidades ficam agendadas.',
    'Assine o contrato digital (ClickSign) que chega no seu e-mail.',
    'Envie o seu vídeo ou peça para a EXA criar. Aprovado, ele entra no ar.',
  ];

  const baixarPdf = () => {
    const t = document.title;
    document.title = `Proposta ${proposal?.number || ''} - ${nome}`.trim();
    window.print();
    setTimeout(() => { document.title = t; }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f6f2f3] text-[#1b1719] print:bg-white">
      <style>{`@media print { @page { size: A4; margin: 14mm 14mm 16mm; } html, body { background: #fff !important; } .no-print { display: none !important; } }`}</style>

      {/* Cabeçalho */}
      <header className="bg-[linear-gradient(135deg,#5a0f12_0%,#8a1a1e_55%,#9C1E1E_100%)] px-4 pb-16 pt-6 text-white sm:px-6 print:border-b-2 print:border-[#9C1E1E] print:bg-none print:px-0 print:pb-4 print:pt-0 print:text-[#1b1719]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div className="print:hidden"><UnifiedLogo size="custom" variant="light" className="h-12 w-12" /></div>
          <div className="hidden print:block"><UnifiedLogo size="custom" variant="dark" className="h-10 w-10" /></div>
          <div className="text-right text-[12px] leading-tight text-white/75 print:text-[10px] print:text-[#6f6669]">
            <div className="font-semibold text-white print:text-[#1b1719]">{proposal?.number}</div>
            <div>Emitida em {dataBR(proposal?.sent_at || proposal?.created_at)}</div>
            {proposal?.expires_at && <div>Válida até {dataBR(proposal.expires_at)}</div>}
          </div>
        </div>
        <div className="mx-auto mt-7 max-w-2xl print:mt-4">
          <p className="text-[12px] font-semibold uppercase tracking-[.18em] text-white/70 print:text-[10px] print:text-[#9C1E1E]">Proposta comercial</p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight sm:text-[34px] print:text-[22px]">{nome}</h1>
          <p className="mt-1 text-[14px] text-white/80 print:text-[11px] print:text-[#6f6669]">
            Publicidade em elevadores de condomínios residenciais · Foz do Iguaçu
            {proposal?.client_cnpj ? <> · {mascaraDoc(proposal.client_cnpj)}</> : null}
          </p>
          {(isExpired || aceita) && (
            <span className={`mt-3 inline-block rounded-full px-3 py-1 text-[12px] font-bold ${aceita ? 'bg-white/15 text-white' : 'bg-white text-[#9C1E1E]'} print:border print:border-[#e8e2e3] print:bg-white print:text-[#1b1719]`}>
              {aceita ? 'Proposta aceita' : 'Proposta vencida · peça uma nova para a Sofia'}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-2xl space-y-4 px-4 pb-16 sm:px-6 print:mt-0 print:space-y-4 print:px-0 print:pb-0">
        {/* Resumo */}
        <Secao titulo="Resumo" icone={Receipt}>
          <div className="divide-y divide-[#f1edee] print:divide-[#eee]">
            <Linha rotulo="Formato">{vertical ? 'Vertical Premium · 15 segundos, tela cheia' : 'Horizontal · 10 segundos'}</Linha>
            <Linha rotulo="Locais">{buildings.length} {buildings.length === 1 ? 'prédio' : 'prédios'} · {telas} {telas === 1 ? 'tela' : 'telas'}</Linha>
            <Linha rotulo="Prazo">{unico ? `${meses} meses` : `Plano de ${meses} meses`}</Linha>
            <Linha rotulo="Pagamento">{pagamento}</Linha>
            {unico
              ? <Linha rotulo="Valor" destaque>{brl(Number(proposal?.cash_total_value || 0))}</Linha>
              : <Linha rotulo="Mensalidade" destaque>{brl(mensal)}<span className="text-[13px] font-semibold text-[#8b8285]">/mês</span></Linha>}
          </div>
        </Secao>

        {/* Onde aparece */}
        <Secao titulo="Onde sua marca aparece" icone={MapPin}>
          <ul className="divide-y divide-[#f1edee]">
            {buildings.map((b, i) => (
              <li key={b.building_id || i} className="flex items-center gap-3 py-3 print:py-2">
                {b.imagem_principal || b.imageurl
                  ? <img src={b.imagem_principal || b.imageurl} alt="" className="h-12 w-12 flex-none rounded-xl object-cover print:h-9 print:w-9 print:rounded-md" />
                  : <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[#f6f2f3] print:h-9 print:w-9"><Building2 className="h-5 w-5 text-[#8b8285]" /></span>}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold print:text-[12px]">{b.nome || b.building_name}</div>
                  <div className="truncate text-[12.5px] text-[#8b8285] print:text-[10px]">{(b.endereco ? (b.bairro && !String(b.endereco).toLowerCase().includes(String(b.bairro).toLowerCase()) ? `${b.endereco} · ${b.bairro}` : b.endereco) : b.bairro) || 'Foz do Iguaçu'}</div>
                </div>
                <span className="flex-none rounded-full bg-[#f6f2f3] px-2.5 py-1 text-[12px] font-semibold text-[#554e50] print:text-[10px]">{Number(b.quantidade_telas || 1)} {Number(b.quantidade_telas || 1) === 1 ? 'tela' : 'telas'}</span>
              </li>
            ))}
          </ul>
        </Secao>

        {/* Como fica na tela + especificação */}
        <Secao titulo="Como fica na tela" icone={Monitor}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="mx-auto w-full max-w-[200px] flex-none print:hidden">
              {vertical
                ? <img src={mockupVertical} alt="Painel vertical" className="w-full rounded-lg shadow-lg" />
                : <ReplicaPainel predioNome="Seu prédio" now={agora} slot={{ id: 'amostra', url: SAMPLE_VIDEO_URL } as any} clima={weatherData} preencher />}
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-3 text-[13.5px] print:text-[11px]">
              <div className="rounded-2xl bg-[#faf7f8] p-3 print:bg-white print:p-0">
                <dt className="flex items-center gap-1.5 text-[12px] text-[#8b8285] print:text-[10px]"><Clock className="h-3.5 w-3.5" /> Duração</dt>
                <dd className="mt-0.5 font-bold">{vertical ? '15 segundos' : '10 segundos'}</dd>
              </div>
              <div className="rounded-2xl bg-[#faf7f8] p-3 print:bg-white print:p-0">
                <dt className="flex items-center gap-1.5 text-[12px] text-[#8b8285] print:text-[10px]"><Monitor className="h-3.5 w-3.5" /> Tamanho do vídeo</dt>
                <dd className="mt-0.5 font-bold">{vertical ? '1080 × 1920 px' : '1080 × 890 px'}</dd>
              </div>
              <div className="col-span-2 rounded-2xl bg-[#faf7f8] p-3 print:bg-white print:p-0">
                <dt className="flex items-center gap-1.5 text-[12px] text-[#8b8285] print:text-[10px]"><Sparkles className="h-3.5 w-3.5" /> Seus vídeos</dt>
                <dd className="mt-0.5 font-semibold leading-snug">Até 10 vídeos no pedido, programados por dia da semana e horário. Sem áudio. A EXA pode criar o vídeo para você.</dd>
              </div>
              {vertical && (
                <div className="col-span-2 rounded-2xl bg-[#faf7f8] p-3 print:bg-white print:p-0">
                  <dt className="text-[12px] text-[#8b8285] print:text-[10px]">Tela cheia</dt>
                  <dd className="mt-0.5 font-semibold leading-snug">O painel inteiro é seu enquanto o vídeo toca, em todos os prédios da rede.</dd>
                </div>
              )}
            </dl>
          </div>
        </Secao>

        {/* Próximos passos */}
        <Secao titulo="Próximos passos" icone={CalendarDays}>
          <ol className="space-y-3 print:space-y-1.5">
            {passos.map((p, i) => (
              <li key={i} className="flex gap-3 text-[14.5px] leading-snug print:text-[11px]">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#f8e9ec] text-[12px] font-extrabold text-[#9C1E1E] print:h-4 print:w-4 print:text-[9px]">{i + 1}</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-[#faf7f8] p-3 text-[12.5px] text-[#6f6669] print:bg-white print:p-0 print:text-[10px]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#13a24a]" />
            As condições completas estão no contrato, que você recebe para assinar depois do pagamento.
          </p>
        </Secao>

        {/* Ações */}
        <div className="no-print grid gap-2 sm:grid-cols-2">
          <a href={SOFIA_WA} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 text-[15px] font-bold text-white">
            <MessageCircle className="h-5 w-5" /> Responder para a Sofia
          </a>
          <button type="button" onClick={baixarPdf} className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-[#e6dfe1] bg-white px-5 text-[15px] font-bold text-[#1b1719]">
            <FileDown className="h-5 w-5" /> Baixar PDF
          </button>
        </div>

        <footer className="pt-2 text-center text-[11.5px] leading-relaxed text-[#8b8285] print:pt-6 print:text-left print:text-[9px]">
          <div className="font-semibold text-[#554e50]">Sofia · Consultora EXA Mídia · (45) 99141-5920</div>
          <div>EXA Mídia · Indexa Mídia LTDA · CNPJ 38.142.638/0001-30</div>
          <div>Av. Paraná, 974, sala 301 · Foz do Iguaçu/PR · examidia.com.br</div>
        </footer>
      </main>
    </div>
  );
};

export default PropostaSofia;
