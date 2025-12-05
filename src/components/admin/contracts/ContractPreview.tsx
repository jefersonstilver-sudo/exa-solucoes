import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContractPreviewProps {
  data: {
    tipo_contrato: string;
    numero_contrato?: string;
    cliente_nome: string;
    cliente_sobrenome?: string;
    cliente_email?: string;
    cliente_cnpj?: string;
    cliente_cpf?: string;
    cliente_razao_social?: string;
    cliente_cargo?: string;
    cliente_endereco?: string;
    cliente_cidade?: string;
    cliente_segmento?: string;
    valor_mensal?: number;
    valor_total?: number;
    plano_meses?: number;
    dia_vencimento?: number;
    metodo_pagamento?: string;
    lista_predios?: any[];
    parcelas?: any[];
    clausulas_especiais?: string;
    data_inicio?: string;
    data_fim?: string;
    total_paineis?: number;
    tipo_produto?: string;
    status?: string;
    created_at?: string;
  };
  onEdit?: () => void;
}

const ContractPreview: React.FC<ContractPreviewProps> = ({ data, onEdit }) => {
  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDateShort = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
    } catch { return dateStr; }
  };

  const formatDateExtended = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch { return dateStr; }
  };

  const getNumeroExtenso = (num: number) => {
    const extenso: Record<number, string> = { 1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco', 6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez', 11: 'onze', 12: 'doze' };
    return extenso[num] || String(num);
  };

  const getMetodoPagamentoNome = (metodo: string | undefined) => {
    const methods: Record<string, string> = {
      'pix_avista': 'PIX à Vista', 'pix_fidelidade': 'PIX Fidelidade',
      'boleto_fidelidade': 'Boleto Fidelidade', 'cartao': 'Cartão de Crédito',
      'custom': 'Condição Personalizada'
    };
    return methods[metodo || ''] || metodo || 'Fidelidade';
  };

  const calcularDataFim = () => {
    if (!data.data_inicio) return '';
    try {
      const inicio = new Date(data.data_inicio + 'T00:00:00');
      inicio.setMonth(inicio.getMonth() + (data.plano_meses || 1));
      return format(inicio, "dd/MM/yyyy", { locale: ptBR });
    } catch { return ''; }
  };

  const listaPredios = Array.isArray(data.lista_predios) ? data.lista_predios : [];
  const totalPaineis = data.total_paineis || listaPredios.reduce((acc, p) => acc + (p.quantidade_telas || 1), 0);
  const isVerticalPremium = data.tipo_produto === 'vertical_premium';
  const isSindico = data.tipo_contrato === 'sindico';
  const dataAtual = format(new Date(), "dd/MM/yyyy • HH:mm", { locale: ptBR });
  const clienteNomeCompleto = data.cliente_sobrenome ? `${data.cliente_nome} ${data.cliente_sobrenome}` : data.cliente_nome;

  // Calcular impressões
  const totalImpMes = listaPredios.reduce((acc, p) => {
    const impDia = p.visualizacoes_mes ? Math.round(p.visualizacoes_mes / 30) : (p.impPerDayPanel || 3100);
    const telas = p.quantidade_telas || p.panels || 1;
    return acc + (impDia * 30 * telas);
  }, 0);
  const avgImpDia = listaPredios.length > 0 ? Math.round(totalImpMes / 30 / totalPaineis) : 3100;

  const getStatusClass = (status: string) => {
    if (status === 'assinado') return 'done';
    if (status === 'enviado' || status === 'visualizado') return 'current';
    return '';
  };

  return (
    <div id="contract-preview" style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", background: 'linear-gradient(180deg, #fbfcfd, #f4f6f8)', color: '#071127', WebkitFontSmoothing: 'antialiased', maxWidth: '1100px', margin: '0 auto', padding: '18px' }}>
      <style>{`
        .contract-section { page-break-inside: avoid; break-inside: avoid; }
        .clause { margin-top: 12px; border-left: 4px solid #f2f4f6; padding: 8px 12px; background: #fff; page-break-inside: avoid; }
        @media print {
          body { background: #fff !important; }
          .contract-section { page-break-inside: avoid !important; }
          .clause, .sign-block, .table { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════
          HEADER CORPORATIVO
      ════════════════════════════════════════════════════════════════ */}
      <header className="contract-section" style={{ background: 'linear-gradient(90deg, #4a0f0f, #7D1818)', color: '#fff', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: '0 14px 30px rgba(16,24,32,0.06)' }}>
        <div style={{ width: '96px', height: '56px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Exa%20sozinha.png" alt="EXA" style={{ maxWidth: '88%', maxHeight: '88%', objectFit: 'contain' }} crossOrigin="anonymous" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            {isSindico ? 'Contrato de Comodato — EXA Mídia' : 'Contrato de Prestação de Serviços — EXA Mídia'}
          </h1>
          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '13px' }}>
              Contrato nº <strong>{data.numero_contrato || 'EXA-CON-2025-0001'}</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '13px' }}>
              Cliente: <strong>{data.cliente_razao_social || clienteNomeCompleto}</strong>
            </span>
            <span style={{ background: data.status === 'assinado' ? '#10b981' : data.status === 'enviado' ? '#3b82f6' : '#f59e0b', padding: '8px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>
              {data.status || 'RASCUNHO'}
            </span>
            {!isSindico && (
              <span style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '13px' }}>
                Validade: <strong>72 horas</strong>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          RESUMO DO CONTRATO - Cards de métricas
      ════════════════════════════════════════════════════════════════ */}
      <section className="contract-section" style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 14px 30px rgba(16,24,32,0.06)', border: '1px solid rgba(16,24,32,0.03)', marginTop: '18px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Resumo do Contrato</h2>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Visão geral e parâmetros comerciais — modo <strong>{data.status?.toUpperCase() || 'RASCUNHO'}</strong></p>

        <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
          {!isSindico ? (
            <>
              <div style={{ flex: 1, minWidth: '120px', padding: '14px', borderRadius: '10px', background: 'linear-gradient(180deg, #fff, #fbfbfb)', textAlign: 'center', border: '1px solid #f1f3f5' }}>
                <div style={{ fontWeight: 800, color: '#7D1818', fontSize: '20px' }}>{listaPredios.length || 1}</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>Prédios contratados</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', padding: '14px', borderRadius: '10px', background: 'linear-gradient(180deg, #fff, #fbfbfb)', textAlign: 'center', border: '1px solid #f1f3f5' }}>
                <div style={{ fontWeight: 800, color: '#7D1818', fontSize: '20px' }}>{totalPaineis}</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>Telas ativadas</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', padding: '14px', borderRadius: '10px', background: 'linear-gradient(180deg, #fff, #fbfbfb)', textAlign: 'center', border: '1px solid #f1f3f5' }}>
                <div style={{ fontWeight: 800, color: '#7D1818', fontSize: '20px' }}>{avgImpDia.toLocaleString('pt-BR')}</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>Exibições/painel/dia</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', padding: '14px', borderRadius: '10px', background: 'linear-gradient(180deg, #fff, #fbfbfb)', textAlign: 'center', border: '1px solid #f1f3f5' }}>
                <div style={{ fontWeight: 800, color: '#7D1818', fontSize: '20px' }}>{formatCurrency(data.valor_mensal)}</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>Valor mensal</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ flex: 1, minWidth: '120px', padding: '14px', borderRadius: '10px', background: 'linear-gradient(180deg, #fff, #fbfbfb)', textAlign: 'center', border: '1px solid #f1f3f5' }}>
                <div style={{ fontWeight: 800, color: '#7D1818', fontSize: '20px' }}>{totalPaineis}</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>Telas instaladas</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', padding: '14px', borderRadius: '10px', background: 'linear-gradient(180deg, #fff, #fbfbfb)', textAlign: 'center', border: '1px solid #f1f3f5' }}>
                <div style={{ fontWeight: 800, color: '#10b981', fontSize: '20px' }}>Gratuito</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>Custo para condomínio</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', padding: '14px', borderRadius: '10px', background: 'linear-gradient(180deg, #fff, #fbfbfb)', textAlign: 'center', border: '1px solid #f1f3f5' }}>
                <div style={{ fontWeight: 800, color: '#7D1818', fontSize: '20px' }}>30 dias</div>
                <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>Aviso prévio</div>
              </div>
            </>
          )}
        </div>

        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px' }}>
          {!isSindico && <>Período contratado: <strong>{data.plano_meses || 6} meses</strong> • Modalidade: <strong>{getMetodoPagamentoNome(data.metodo_pagamento)}</strong></>}
        </div>

        {/* Timeline */}
        <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-end', marginTop: '18px' }}>
          {[
            { num: 1, label: 'Criado', sub: dataAtual, done: true },
            { num: 2, label: 'Enviado', sub: 'E-mail / WhatsApp', done: ['enviado', 'visualizado', 'assinado'].includes(data.status || '') },
            { num: 3, label: 'Visualizado', sub: '—', done: ['visualizado', 'assinado'].includes(data.status || '') },
            { num: 4, label: 'Assinado', sub: '—', done: data.status === 'assinado' }
          ].map((step, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, background: step.done ? '#7D1818' : '#fff', color: step.done ? '#fff' : '#7D1818', border: step.done ? 'none' : '3px solid #7D1818' }}>{step.num}</div>
              <div style={{ marginTop: '8px', fontWeight: 700, color: step.done ? '#7D1818' : '#6b7280' }}>{step.label}</div>
              <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>{step.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          LISTA DE PRÉDIOS
      ════════════════════════════════════════════════════════════════ */}
      {!isSindico && listaPredios.length > 0 && (
        <section className="contract-section" style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 14px 30px rgba(16,24,32,0.06)', border: '1px solid rgba(16,24,32,0.03)', marginTop: '18px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Localizações e Veiculação</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Lista de {listaPredios.length} prédios contratados</p>
          <div style={{ marginTop: '12px', maxHeight: '260px', overflow: 'auto', paddingRight: '6px' }}>
            {listaPredios.map((p, i) => {
              const impDia = p.visualizacoes_mes ? Math.round(p.visualizacoes_mes / 30) : (p.impPerDayPanel || 3100);
              const telas = p.quantidade_telas || p.panels || 1;
              const impMes = impDia * 30 * telas;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', border: '1px solid #f1f3f5', marginBottom: '8px', background: '#fff' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.nome || p.building_name || p.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '6px' }}>{telas} painel(is) • {impDia.toLocaleString('pt-BR')} imp./dia/painel • {p.bairro || p.neighborhood || 'Centro'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Imp./mês</div>
                    <div style={{ fontWeight: 800 }}>{impMes.toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════
          CONDIÇÕES COMERCIAIS E CORPO DO CONTRATO
      ════════════════════════════════════════════════════════════════ */}
      <section className="contract-section" style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 14px 30px rgba(16,24,32,0.06)', border: '1px solid rgba(16,24,32,0.03)', marginTop: '18px' }}>
        {!isSindico && (
          <>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Condições Comerciais e Pagamento</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>Plano escolhido: <strong>Fidelidade — {data.plano_meses || 6} meses</strong></p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Mensalidade (fidelidade)</div>
                <div style={{ fontWeight: 800, fontSize: '18px' }}>{formatCurrency(data.valor_mensal)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Forma</div>
                <div style={{ fontWeight: 800 }}>{getMetodoPagamentoNome(data.metodo_pagamento)} • vencimento dia {data.dia_vencimento || 10} • {data.plano_meses || 6} parcelas</div>
              </div>
            </div>
            <div style={{ height: '1px', background: '#f2f4f6', margin: '12px 0', borderRadius: '4px' }}></div>
          </>
        )}

        {/* CORPO DO CONTRATO */}
        <div style={{ lineHeight: 1.45, color: '#111', fontSize: '15px' }}>
          <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
            {isSindico ? 'CONTRATO DE COMODATO DE EQUIPAMENTOS' : 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PUBLICIDADE DIGITAL'}
          </h3>
          <p style={{ margin: '8px 0', textAlign: 'center' }}>Pelo presente instrumento particular, as partes abaixo identificadas têm entre si justo e contratado o que segue:</p>

          <div className="clause contract-section">
            <strong>CONTRATADA:</strong> EXA – Soluções Digitais LTDA, CNPJ nº 62.878.193/0001-35, com sede à Rua Sílvio Sotomaior, 187 — Bairro Três Bandeiras — Foz do Iguaçu/PR, doravante denominada <strong>CONTRATADA</strong>, neste ato representada por Jeferson Silver Rodrigues Encina, CPF 055.031.279-00, e Natália Krause Guimarães Dantas, CPF 116.228.359-99.
          </div>

          <div className="clause contract-section">
            <strong>CONTRATANTE:</strong> {data.cliente_razao_social || clienteNomeCompleto}{data.cliente_cnpj && <>, CNPJ {data.cliente_cnpj}</>}{data.cliente_cpf && !data.cliente_cnpj && <>, CPF {data.cliente_cpf}</>}, com sede à {data.cliente_endereco || data.cliente_cidade || 'Foz do Iguaçu - PR'}, neste ato representada por {clienteNomeCompleto}{data.cliente_cargo && ` (${data.cliente_cargo})`}.
          </div>

          {/* CLÁUSULA 1 - OBJETO */}
          <div className="contract-section">
            <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA 1 — OBJETO</h3>
            {isSindico ? (
              <><p style={{ margin: '8px 0' }}>1.1. O presente contrato tem por objeto o empréstimo gratuito (comodato) de equipamentos de mídia digital pela CONTRATADA à CONTRATANTE, para instalação em áreas comuns do edifício.</p><p style={{ margin: '8px 0' }}>1.2. Os equipamentos permanecerão de propriedade exclusiva da CONTRATADA, sendo cedidos em regime de comodato.</p></>
            ) : isVerticalPremium ? (
              <><p style={{ margin: '8px 0' }}>1.1. O presente contrato tem por objeto a veiculação de conteúdo publicitário vertical exclusivo (<strong>Vertical Premium</strong>) fornecido pela CONTRATANTE nas telas digitais operadas pela CONTRATADA.</p><p style={{ margin: '8px 0' }}>1.2. O formato Vertical Premium consiste em vídeo de 10 segundos, resolução 1080×1920 (vertical), exibido em tela cheia a cada 50 segundos de programação.</p><p style={{ margin: '8px 0' }}>1.3. A contratação inclui automaticamente <strong>todos os edifícios</strong> da rede EXA disponíveis.</p></>
            ) : (
              <><p style={{ margin: '8px 0' }}>1.1. O presente contrato tem por objeto a veiculação de conteúdos publicitários (vídeos e/ou imagens) fornecidos pela CONTRATANTE nas telas digitais operadas pela CONTRATADA, instaladas em elevadores e áreas internas dos edifícios listados no Anexo I.</p><p style={{ margin: '8px 0' }}>1.2. A veiculação obedecerá às características técnicas e à programação definida no sistema EXA Cloud, respeitando as quantidades de telas e frequência aqui contratadas.</p></>
            )}
          </div>

          {/* CLÁUSULA 2 - PRAZO */}
          <div className="contract-section">
            <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA 2 — PRAZO</h3>
            {isSindico ? (
              <p style={{ margin: '8px 0' }}>2.1. O presente contrato vigorará por prazo indeterminado, podendo ser rescindido por qualquer das partes mediante aviso prévio de <strong>30 (trinta) dias</strong>.</p>
            ) : (
              <><p style={{ margin: '8px 0' }}>2.1. Vigência: {data.plano_meses || 6} ({getNumeroExtenso(data.plano_meses || 6)}) meses, com início em <strong>{formatDateShort(data.data_inicio)}</strong> e término em <strong>{data.data_fim ? formatDateShort(data.data_fim) : calcularDataFim()}</strong>.</p><p style={{ margin: '8px 0' }}>2.2. Após o prazo há renovação automática por iguais períodos caso não haja manifestação por escrito com antecedência mínima de 30 dias.</p></>
            )}
          </div>

          {/* CLÁUSULA 3 - VALOR */}
          {!isSindico && (
            <div className="contract-section">
              <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA 3 — VALOR E CONDIÇÕES DE PAGAMENTO</h3>
              <p style={{ margin: '8px 0' }}>3.1. O CONTRATANTE pagará a título de remuneração <strong>{formatCurrency(data.valor_mensal)}</strong> mensais, totalizando <strong>{formatCurrency(data.valor_total)}</strong> pelo período de {data.plano_meses || 6} meses.</p>
              <p style={{ margin: '8px 0' }}>3.2. Forma de pagamento: {getMetodoPagamentoNome(data.metodo_pagamento)} — vencimento dia <strong>{data.dia_vencimento || 10}</strong> de cada mês.</p>
              <p style={{ margin: '8px 0' }}>3.3. Em caso de inadimplemento:</p>
              <ul style={{ marginLeft: '24px' }}>
                <li>a) Multa: 2% sobre o valor da parcela em atraso;</li>
                <li>b) Juros: 1% ao mês, pro rata die;</li>
                <li>c) Atraso superior a 10 dias autoriza a suspensão da veiculação.</li>
              </ul>
              <p style={{ margin: '8px 0' }}>3.4. Rescisão por iniciativa do CONTRATANTE antes do término implica multa de 20% (vinte por cento) sobre o saldo remanescente do contrato.</p>
            </div>
          )}

          {/* CLÁUSULAS 4-12 */}
          <div className="contract-section">
            <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA {isSindico ? '3' : '4'} — ESPECIFICAÇÕES TÉCNICAS</h3>
            {isSindico ? (
              <><p style={{ margin: '8px 0' }}>3.1. A CONTRATADA fornecerá equipamentos de mídia digital (telas LED/LCD) com resolução Full HD, conexão via internet, player integrado.</p><p style={{ margin: '8px 0' }}>3.2. A manutenção preventiva e corretiva é de responsabilidade exclusiva da CONTRATADA.</p></>
            ) : (
              <><p style={{ margin: '8px 0' }}>{isSindico ? '3' : '4'}.1. O CONTRATANTE enviará material em conformidade com as especificações técnicas da EXA (preferencial: MP4 H.264; {isVerticalPremium ? '1080x1920 vertical' : '1920x1080 horizontal'}; até {isVerticalPremium ? '10' : '15'} segundos; sem áudio ou com mixagem própria).</p><p style={{ margin: '8px 0' }}>{isSindico ? '3' : '4'}.2. A EXA poderá adaptar resolução e bitrate para compatibilidade técnica, sem alterar a mensagem comercial.</p><p style={{ margin: '8px 0' }}>{isSindico ? '3' : '4'}.3. O CONTRATANTE garante possuir todos os direitos de uso, imagem e autorais do material.</p></>
            )}
          </div>

          <div className="contract-section">
            <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA {isSindico ? '4' : '5'} — {isSindico ? 'OBRIGAÇÕES DAS PARTES' : 'ENTREGA E MODERAÇÃO'}</h3>
            {isSindico ? (
              <><p style={{ margin: '8px 0' }}>4.1. <strong>CONTRATADA:</strong> Fornecer/instalar equipamentos; realizar manutenção; garantir 95% de disponibilidade; veicular conteúdos do condomínio gratuitamente.</p><p style={{ margin: '8px 0' }}>4.2. <strong>CONTRATANTE:</strong> Zelar pelos equipamentos; comunicar danos; permitir acesso técnico.</p></>
            ) : (
              <><p style={{ margin: '8px 0' }}>5.1. Após o envio do material correto, a exibição ocorrerá em até 72 horas úteis. Em dias úteis e após aprovação do moderador, o vídeo pode entrar no ar em até 1 hora.</p><p style={{ margin: '8px 0' }}>5.2. O CONTRATANTE pode solicitar substituição de vídeos a qualquer momento; a veiculação do novo material dependerá da aprovação do moderador.</p></>
            )}
          </div>

          {!isSindico && (
            <div className="contract-section">
              <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA 6 — DISPONIBILIDADE E SLA</h3>
              <p style={{ margin: '8px 0' }}>6.1. A EXA assegura disponibilidade mínima de 90% (noventa por cento) da rede mensal.</p>
              <p style={{ margin: '8px 0' }}>6.2. Falhas técnicas atribuíveis à EXA serão tratadas dentro de 72 horas úteis, salvo eventos de força maior.</p>
            </div>
          )}

          <div className="contract-section">
            <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA {isSindico ? '5' : '7'} — {isSindico ? 'RESPONSABILIDADE PELOS EQUIPAMENTOS' : 'RESPONSABILIDADES'}</h3>
            {isSindico ? (
              <><p style={{ margin: '8px 0' }}>5.1. Os equipamentos permanecem de propriedade exclusiva da CONTRATADA.</p><p style={{ margin: '8px 0' }}>5.2. A CONTRATANTE responderá por danos causados por mau uso ou negligência.</p></>
            ) : (
              <><p style={{ margin: '8px 0' }}>7.1. A EXA será responsável pela operação, manutenção e reporte de exibições.</p><p style={{ margin: '8px 0' }}>7.2. O CONTRATANTE se responsabiliza pelo conteúdo, direitos autorais, e pagamentos.</p></>
            )}
          </div>

          <div className="contract-section">
            <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA {isSindico ? '6' : '8'} — RESCISÃO</h3>
            <p style={{ margin: '8px 0' }}>{isSindico ? '6' : '8'}.1. O contrato poderá ser rescindido por mútuo acordo ou descumprimento de qualquer cláusula.</p>
            <p style={{ margin: '8px 0' }}>{isSindico ? '6.2. Por qualquer das partes, mediante aviso prévio de 30 dias.' : '8.2. Rescisão antecipada pelo CONTRATANTE implicará multa de 20% sobre o saldo remanescente.'}</p>
          </div>

          {!isSindico && (
            <>
              <div className="contract-section">
                <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA 9 — PROPRIEDADE INTELECTUAL</h3>
                <p style={{ margin: '8px 0' }}>9.1. O CONTRATANTE declara e garante que possui todas as autorizações necessárias para veicular o material.</p>
                <p style={{ margin: '8px 0' }}>9.2. A EXA está autorizada a utilizar o material apenas para execução e divulgação de case.</p>
              </div>

              <div className="contract-section">
                <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA 10 — SIGILO E PROTEÇÃO DE DADOS</h3>
                <p style={{ margin: '8px 0' }}>10.1. As partes comprometem-se a manter sigilo sobre informações comerciais sensíveis, observando a LGPD.</p>
              </div>

              <div className="contract-section">
                <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA 11 — REAJUSTE</h3>
                <p style={{ margin: '8px 0' }}>11.1. Valores reajustáveis anualmente pelo IPCA ou índice que o substituir.</p>
              </div>
            </>
          )}

          {isSindico && (
            <div className="contract-section">
              <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA 7 — AUTORIZAÇÃO DE USO DE IMAGEM</h3>
              <p style={{ margin: '8px 0' }}>7.1. A CONTRATANTE autoriza a CONTRATADA a utilizar o nome e imagens externas do edifício para divulgação comercial.</p>
            </div>
          )}

          <div className="contract-section">
            <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>CLÁUSULA {isSindico ? '8' : '12'} — FORO</h3>
            <p style={{ margin: '8px 0' }}>{isSindico ? '8' : '12'}.1. As partes elegem o foro da comarca de Foz do Iguaçu — PR para solução de quaisquer controvérsias, com renúncia a qualquer outro foro.</p>
          </div>

          {data.clausulas_especiais && (
            <div className="contract-section" style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', marginTop: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>CLÁUSULA ADICIONAL — CONDIÇÕES ESPECIAIS</h3>
              <p style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{data.clausulas_especiais}</p>
            </div>
          )}

          {/* ANEXO I - PRÉDIOS */}
          {!isSindico && listaPredios.length > 0 && (
            <div className="contract-section">
              <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>ANEXO I — Prédios, telas e exibições</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}><th style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'left' }}>Edifício</th><th style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'left' }}>Bairro</th><th style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'center' }}>Telas</th><th style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'right' }}>Imp./dia</th><th style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'right' }}>Imp./mês</th></tr>
                </thead>
                <tbody>
                  {listaPredios.map((p, i) => {
                    const impDia = p.visualizacoes_mes ? Math.round(p.visualizacoes_mes / 30) : (p.impPerDayPanel || 3100);
                    const telas = p.quantidade_telas || p.panels || 1;
                    return (
                      <tr key={i}><td style={{ border: '1px solid #e8eef2', padding: '10px' }}>{p.nome || p.building_name || p.name}</td><td style={{ border: '1px solid #e8eef2', padding: '10px' }}>{p.bairro || p.neighborhood || 'Centro'}</td><td style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'center' }}>{telas}</td><td style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'right' }}>{impDia.toLocaleString('pt-BR')}</td><td style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'right' }}>{(impDia * 30 * telas).toLocaleString('pt-BR')}</td></tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8f9fa', fontWeight: 700 }}><td colSpan={2} style={{ border: '1px solid #e8eef2', padding: '10px' }}>TOTAL</td><td style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'center' }}>{totalPaineis}</td><td style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'right' }}>—</td><td style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'right' }}>{totalImpMes.toLocaleString('pt-BR')}</td></tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ANEXO II - PAGAMENTO */}
          {!isSindico && data.plano_meses && data.plano_meses > 1 && (
            <div className="contract-section">
              <h3 style={{ marginTop: '18px', fontSize: '16px', fontWeight: 700 }}>ANEXO II — Forma de Pagamento</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '14px' }}>
                <thead><tr style={{ background: '#f8f9fa' }}><th style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'left' }}>Parcela</th><th style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'center' }}>Vencimento</th><th style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'right' }}>Valor</th></tr></thead>
                <tbody>
                  {Array.from({ length: data.plano_meses }, (_, i) => {
                    let venc = '';
                    if (data.data_inicio) {
                      try {
                        const inicio = new Date(data.data_inicio + 'T00:00:00');
                        const dataVenc = new Date(inicio.getFullYear(), inicio.getMonth() + i, data.dia_vencimento || 10);
                        venc = format(dataVenc, 'dd/MM/yyyy', { locale: ptBR });
                      } catch { venc = '—'; }
                    }
                    return (
                      <tr key={i}><td style={{ border: '1px solid #e8eef2', padding: '10px' }}>{i + 1}ª parcela</td><td style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'center' }}>{venc}</td><td style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'right' }}>{formatCurrency(data.valor_mensal)}</td></tr>
                    );
                  })}
                </tbody>
                <tfoot><tr style={{ background: '#f8f9fa', fontWeight: 700 }}><td colSpan={2} style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'right' }}>TOTAL</td><td style={{ border: '1px solid #e8eef2', padding: '10px', textAlign: 'right' }}>{formatCurrency(data.valor_total)}</td></tr></tfoot>
              </table>
            </div>
          )}

          {/* ASSINATURAS */}
          <div className="contract-section" style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', textAlign: 'center', paddingTop: '30px' }}>
                <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', fontWeight: 700 }}>_______________________________</div>
                <div style={{ marginTop: '6px' }}>Pela CONTRATANTE</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{data.cliente_razao_social || clienteNomeCompleto}</div>
                {data.cliente_cnpj && <div style={{ fontSize: '13px', color: '#6b7280' }}>CNPJ: {data.cliente_cnpj}</div>}
              </div>
              <div style={{ flex: 1, minWidth: '200px', textAlign: 'center', paddingTop: '30px' }}>
                <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', fontWeight: 700 }}>_______________________________</div>
                <div style={{ marginTop: '6px' }}>Pela CONTRATADA</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>EXA — Soluções Digitais LTDA</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Ass: Jeferson Silver Rodrigues Encina</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>CPF: 055.031.279-00</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ marginTop: '18px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
        Documento gerado por EXA Mídia — Contrato {data.numero_contrato || 'EXA-CON-2025-0001'}
      </footer>

      {onEdit && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button onClick={onEdit} style={{ color: '#7D1818', cursor: 'pointer', background: 'none', border: 'none', fontSize: '14px' }}>
            ✏️ Editar dados do contrato
          </button>
        </div>
      )}
    </div>
  );
};

export default ContractPreview;
