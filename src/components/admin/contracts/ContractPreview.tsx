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
    cliente_telefone?: string;
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
    predio_nome?: string;
    predio_endereco?: string;
    numero_telas_instaladas?: number;
    requer_internet?: boolean;
    prazo_aviso_rescisao?: number;
  };
  signatarios?: {
    cliente?: { nome: string; sobrenome?: string; email: string; cpf?: string; cargo?: string; };
    exa?: Array<{ nome: string; email: string; cpf?: string; cargo?: string; }>;
    testemunhas?: Array<{ nome: string; email: string; cpf?: string; }>;
  };
  onEdit?: () => void;
}

const EXA_LOGO_URL = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Exa%20sozinha.png";

const ContractPreview: React.FC<ContractPreviewProps> = ({ data, signatarios, onEdit }) => {
  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDateExtended = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch { return dateStr; }
  };

  const formatDateShort = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
    } catch { return dateStr; }
  };

  const getNumeroExtenso = (num: number) => {
    const extenso: Record<number, string> = { 1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco', 6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez', 11: 'onze', 12: 'doze' };
    return extenso[num] || String(num);
  };

  const listaPredios = Array.isArray(data.lista_predios) ? data.lista_predios : [];
  const totalPaineis = data.total_paineis || listaPredios.reduce((acc, p) => acc + (p.quantidade_telas || 1), 0);
  const isVerticalPremium = data.tipo_produto === 'vertical_premium';
  const isSindico = data.tipo_contrato === 'sindico' || data.tipo_contrato === 'comodato';
  const clienteNomeCompleto = data.cliente_sobrenome ? `${data.cliente_nome} ${data.cliente_sobrenome}` : data.cliente_nome;

  const totalImpMes = listaPredios.reduce((acc, p) => {
    const impMes = p.visualizacoes_mes || (p.quantidade_telas || 1) * 93000;
    return acc + impMes;
  }, 0);

  const getTituloContrato = () => {
    if (isSindico) return 'CONTRATO DE COMODATO DE EQUIPAMENTOS';
    if (isVerticalPremium) return 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PUBLICIDADE DIGITAL — VERTICAL PREMIUM';
    return 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PUBLICIDADE DIGITAL';
  };

  return (
    <div 
      id="contract-preview"
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        fontSize: '13px',
        lineHeight: '1.65',
        color: '#1a1a1a',
        backgroundColor: '#ffffff',
        maxWidth: '210mm',
        margin: '0 auto',
        padding: '18mm 22mm',
      }}
    >
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm; }
          .contract-section { page-break-inside: avoid !important; }
        }
        .contract-section { page-break-inside: avoid; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════
          CABEÇALHO COM LOGO
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="contract-section" style={{ textAlign: 'center', marginBottom: '28px', borderBottom: '3px solid #8B1A1A', paddingBottom: '18px' }}>
        <img 
          src={EXA_LOGO_URL} 
          alt="EXA Mídia" 
          style={{ height: '55px', marginBottom: '14px' }}
          crossOrigin="anonymous"
        />
        <h1 style={{ 
          fontSize: '16px', 
          fontWeight: '700', 
          color: '#8B1A1A', 
          margin: '0 0 6px 0',
          letterSpacing: '0.8px',
          textTransform: 'uppercase'
        }}>
          {getTituloContrato()}
        </h1>
        <p style={{ fontSize: '13px', color: '#444', margin: 0, fontWeight: '600' }}>
          Contrato nº {data.numero_contrato || 'CTR-2025-0001'}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          IDENTIFICAÇÃO DAS PARTES
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="contract-section" style={{ marginBottom: '22px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#222', marginBottom: '10px', textTransform: 'uppercase', borderBottom: '1px solid #e0e0e0', paddingBottom: '4px' }}>
          Identificação das Partes
        </h2>
        
        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          <strong style={{ color: '#8B1A1A' }}>{isSindico ? 'COMODANTE' : 'CONTRATADA'}:</strong>{' '}
          <strong>EXA – Soluções Digitais LTDA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>51.925.922/0001-50</strong>, 
          com sede na Rua Pernambuco, nº 1.618, Centro, Cascavel/PR, CEP 85.810-021, neste ato representada por seus sócios administradores.
        </p>

        <p style={{ margin: 0, textAlign: 'justify' }}>
          <strong style={{ color: '#8B1A1A' }}>{isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}:</strong>{' '}
          <strong>{data.cliente_razao_social || clienteNomeCompleto}</strong>
          {data.cliente_cnpj && <>, inscrita no CNPJ sob o nº <strong>{data.cliente_cnpj}</strong></>}
          {data.cliente_cpf && !data.cliente_cnpj && <>, inscrita no CPF sob o nº <strong>{data.cliente_cpf}</strong></>}
          {data.cliente_endereco && <>, com sede em {data.cliente_endereco}</>}
          {data.cliente_cidade && !data.cliente_endereco && <>, em {data.cliente_cidade}</>}
          , neste ato representada por <strong>{clienteNomeCompleto}</strong>
          {data.cliente_cargo && <>, {data.cliente_cargo}</>}
          {data.cliente_email && <>, e-mail: {data.cliente_email}</>}
          {data.cliente_telefone && <>, telefone: {data.cliente_telefone}</>}.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CLÁUSULAS DO CONTRATO
      ═══════════════════════════════════════════════════════════════════ */}
      {!isSindico ? (
        <>
          {/* CLÁUSULA 1 - OBJETO */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 1ª — DO OBJETO</h3>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              <strong>1.1.</strong> O presente contrato tem por objeto a prestação de serviços de veiculação de publicidade 
              {isVerticalPremium ? ' em formato vertical premium (1080×1920 pixels)' : ' em formato horizontal (1920×1080 pixels)'} em 
              painéis digitais instalados em elevadores dos edifícios relacionados no <strong>Anexo I</strong>.
            </p>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>1.2.</strong> A CONTRATADA disponibilizará espaço publicitário de {isVerticalPremium ? '10 (dez)' : '15 (quinze)'} segundos, 
              exibido em ciclos de {isVerticalPremium ? '50 (cinquenta)' : '60 (sessenta)'} segundos, conforme especificações técnicas acordadas.
            </p>
          </div>

          {/* CLÁUSULA 2 - PRAZO */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 2ª — DO PRAZO</h3>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              <strong>2.1.</strong> O presente contrato terá vigência de <strong>{data.plano_meses || 1} ({getNumeroExtenso(data.plano_meses || 1)}) {(data.plano_meses || 1) === 1 ? 'mês' : 'meses'}</strong>, 
              com início em <strong>{data.data_inicio ? formatDateExtended(data.data_inicio) : '[DATA INÍCIO]'}</strong> e 
              término em <strong>{data.data_fim ? formatDateExtended(data.data_fim) : '[DATA FIM]'}</strong>.
            </p>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>2.2.</strong> O contrato poderá ser renovado mediante acordo entre as partes, formalizado por escrito com antecedência mínima de 30 (trinta) dias do término.
            </p>
          </div>

          {/* CLÁUSULA 3 - VALOR E PAGAMENTO */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 3ª — DO VALOR E FORMA DE PAGAMENTO</h3>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              <strong>3.1.</strong> Pelo serviço objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor mensal de <strong>{formatCurrency(data.valor_mensal)}</strong>, 
              totalizando <strong>{formatCurrency(data.valor_total)}</strong> pelo período contratado.
            </p>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              <strong>3.2.</strong> O pagamento será realizado via <strong>{data.metodo_pagamento === 'pix_avista' ? 'PIX à Vista' : data.metodo_pagamento === 'pix_fidelidade' ? 'PIX Fidelidade' : data.metodo_pagamento === 'boleto_fidelidade' ? 'Boleto Bancário' : data.metodo_pagamento || 'PIX/Boleto'}</strong>, 
              com vencimento todo dia <strong>{data.dia_vencimento || 10}</strong> de cada mês, conforme cronograma constante no <strong>Anexo II</strong>.
            </p>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>3.3.</strong> O atraso no pagamento implicará multa de 2% (dois por cento) sobre o valor devido, acrescido de juros de mora de 1% (um por cento) ao mês.
            </p>
          </div>

          {/* CLÁUSULA 4 - OBRIGAÇÕES DA CONTRATADA */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 4ª — DAS OBRIGAÇÕES DA CONTRATADA</h3>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>4.1.</strong> Manter os equipamentos em perfeito funcionamento;</p>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>4.2.</strong> Garantir a exibição do conteúdo conforme especificações acordadas;</p>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>4.3.</strong> Prestar suporte técnico em caso de falhas;</p>
            <p style={{ margin: 0, textAlign: 'justify' }}><strong>4.4.</strong> Fornecer relatórios de exibição quando solicitado.</p>
          </div>

          {/* CLÁUSULA 5 - OBRIGAÇÕES DO CONTRATANTE */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 5ª — DAS OBRIGAÇÕES DA CONTRATANTE</h3>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>5.1.</strong> Efetuar os pagamentos nas datas acordadas;</p>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>5.2.</strong> Fornecer o material publicitário em formato compatível ({isVerticalPremium ? '1080×1920 pixels, 10 segundos' : '1920×1080 pixels, 15 segundos'});</p>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>5.3.</strong> Garantir que o conteúdo não viole legislação vigente;</p>
            <p style={{ margin: 0, textAlign: 'justify' }}><strong>5.4.</strong> Comunicar alterações no conteúdo com antecedência mínima de 48 horas.</p>
          </div>

          {/* CLÁUSULA 6 - CONTEÚDO */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 6ª — DO CONTEÚDO PUBLICITÁRIO</h3>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              <strong>6.1.</strong> O conteúdo publicitário deverá ser fornecido em formato {isVerticalPremium ? 'vertical (1080×1920 pixels)' : 'horizontal (1920×1080 pixels)'}, 
              com duração máxima de {isVerticalPremium ? '10' : '15'} segundos, sem áudio.
            </p>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>6.2.</strong> A CONTRATADA reserva-se o direito de recusar conteúdo que viole a legislação ou os bons costumes, comunicando a CONTRATANTE para substituição.
            </p>
          </div>

          {/* CLÁUSULA 7 - RESCISÃO */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 7ª — DA RESCISÃO</h3>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              <strong>7.1.</strong> O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.
            </p>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>7.2.</strong> Em caso de rescisão antecipada pela CONTRATANTE, será devida multa de 20% (vinte por cento) sobre o valor remanescente do contrato.
            </p>
          </div>

          {/* CLÁUSULA 8 - DIREITO DE IMAGEM */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 8ª — DO DIREITO DE IMAGEM</h3>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>8.1.</strong> A CONTRATANTE autoriza expressamente a CONTRATADA a utilizar imagens dos painéis em funcionamento, 
              incluindo o conteúdo publicitário veiculado, para fins de divulgação institucional, portfólio e marketing, em qualquer meio ou veículo de comunicação.
            </p>
          </div>

          {/* CLÁUSULA 9 - CONFIDENCIALIDADE */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 9ª — DA CONFIDENCIALIDADE</h3>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>9.1.</strong> As partes comprometem-se a manter sigilo sobre todas as informações comerciais e técnicas 
              obtidas em razão deste contrato, não podendo divulgá-las a terceiros sem prévia autorização por escrito.
            </p>
          </div>

          {/* CLÁUSULA 10 - DISPOSIÇÕES GERAIS */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 10ª — DAS DISPOSIÇÕES GERAIS</h3>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              <strong>10.1.</strong> Este contrato representa o acordo integral entre as partes, substituindo quaisquer tratativas anteriores.
            </p>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>10.2.</strong> Alterações neste instrumento somente serão válidas se formalizadas por escrito e assinadas por ambas as partes.
            </p>
          </div>

          {/* CLÁUSULA 11 - FORO */}
          <div className="contract-section" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 11ª — DO FORO</h3>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>11.1.</strong> As partes elegem o foro da Comarca de <strong>Cascavel/PR</strong> para dirimir quaisquer controvérsias 
              oriundas deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.
            </p>
          </div>
        </>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           CLÁUSULAS PARA CONTRATO DE COMODATO (SÍNDICO)
        ═══════════════════════════════════════════════════════════════════ */
        <>
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 1ª — DO OBJETO</h3>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>1.1.</strong> O presente contrato tem por objeto o empréstimo gratuito (comodato) de {data.numero_telas_instaladas || totalPaineis || 1} ({getNumeroExtenso(data.numero_telas_instaladas || totalPaineis || 1)}) painel(éis) 
              digital(is) para instalação no(s) elevador(es) do edifício <strong>{data.predio_nome || '[NOME DO PRÉDIO]'}</strong>, 
              localizado em {data.predio_endereco || data.cliente_endereco || '[ENDEREÇO]'}.
            </p>
          </div>

          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 2ª — DA VIGÊNCIA</h3>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>2.1.</strong> O presente contrato vigorará por prazo indeterminado, podendo ser rescindido por qualquer das partes 
              mediante aviso prévio de <strong>{data.prazo_aviso_rescisao || 30}</strong> ({getNumeroExtenso(data.prazo_aviso_rescisao || 30)}) dias.
            </p>
          </div>

          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 3ª — DAS OBRIGAÇÕES DA COMODANTE (EXA)</h3>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>3.1.</strong> Fornecer os equipamentos em perfeito estado de funcionamento;</p>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>3.2.</strong> Realizar a instalação e manutenção dos equipamentos;</p>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>3.3.</strong> Prestar suporte técnico durante toda a vigência do contrato;</p>
            <p style={{ margin: 0, textAlign: 'justify' }}><strong>3.4.</strong> Substituir equipamentos defeituosos sem custo para o COMODATÁRIO.</p>
          </div>

          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 4ª — DAS OBRIGAÇÕES DO COMODATÁRIO</h3>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>4.1.</strong> Permitir o acesso da equipe técnica para instalação e manutenção;</p>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>4.2.</strong> Comunicar imediatamente qualquer dano ou mau funcionamento;</p>
            <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>4.3.</strong> Não remover ou alterar os equipamentos sem autorização;</p>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>4.4.</strong> {data.requer_internet ? 'Fornecer ponto de internet para funcionamento dos equipamentos' : 'Permitir a instalação de conexão de internet pela COMODANTE, se necessário'}.
            </p>
          </div>

          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 5ª — DA PROPRIEDADE</h3>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>5.1.</strong> Os equipamentos objeto deste comodato permanecem de propriedade exclusiva da COMODANTE (EXA), 
              devendo ser restituídos ao término do contrato em perfeito estado de conservação, ressalvado o desgaste natural pelo uso.
            </p>
          </div>

          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 6ª — DO DIREITO DE IMAGEM</h3>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>6.1.</strong> O COMODATÁRIO autoriza expressamente a COMODANTE a utilizar imagens dos painéis instalados 
              para fins de divulgação institucional e comercialização de espaço publicitário a terceiros.
            </p>
          </div>

          <div className="contract-section" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 7ª — DO FORO</h3>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>7.1.</strong> As partes elegem o foro da Comarca de <strong>Cascavel/PR</strong> para dirimir quaisquer controvérsias oriundas deste contrato.
            </p>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CLÁUSULAS ESPECIAIS
      ═══════════════════════════════════════════════════════════════════ */}
      {data.clausulas_especiais && (
        <div className="contract-section" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>
            CLÁUSULA {isSindico ? '8ª' : '12ª'} — CONDIÇÕES ESPECIAIS
          </h3>
          <p style={{ margin: 0, textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
            {data.clausulas_especiais}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ANEXO I - PRÉDIOS (apenas para contratos de publicidade)
      ═══════════════════════════════════════════════════════════════════ */}
      {!isSindico && listaPredios.length > 0 && (
        <div className="contract-section" style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#222', marginBottom: '10px', textTransform: 'uppercase', borderBottom: '1px solid #e0e0e0', paddingBottom: '4px' }}>
            Anexo I — Prédios, Telas e Exibições
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'left', fontWeight: '600' }}>Edifício</th>
                <th style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'left', fontWeight: '600' }}>Bairro</th>
                <th style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'center', fontWeight: '600' }}>Telas</th>
                <th style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'right', fontWeight: '600' }}>Impressões/Mês</th>
              </tr>
            </thead>
            <tbody>
              {listaPredios.map((predio, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '7px 8px' }}>{predio.nome || predio.building_name || predio.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 8px' }}>{predio.bairro || predio.neighborhood || '—'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'center' }}>{predio.quantidade_telas || predio.panels || 1}</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'right' }}>{(predio.visualizacoes_mes || 93000).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#f5f5f5', fontWeight: '600' }}>
                <td style={{ border: '1px solid #ddd', padding: '7px 8px' }} colSpan={2}>TOTAL</td>
                <td style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'center' }}>{totalPaineis}</td>
                <td style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'right' }}>{totalImpMes.toLocaleString('pt-BR')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ANEXO II - CRONOGRAMA DE PAGAMENTO
      ═══════════════════════════════════════════════════════════════════ */}
      {!isSindico && data.parcelas && data.parcelas.length > 0 && (
        <div className="contract-section" style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#222', marginBottom: '10px', textTransform: 'uppercase', borderBottom: '1px solid #e0e0e0', paddingBottom: '4px' }}>
            Anexo II — Cronograma de Pagamento
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'center', fontWeight: '600' }}>Parcela</th>
                <th style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'center', fontWeight: '600' }}>Vencimento</th>
                <th style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'right', fontWeight: '600' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.parcelas.map((parcela: any, index: number) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'center' }}>{parcela.numero || index + 1}ª</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'center' }}>{parcela.vencimento ? formatDateShort(parcela.vencimento) : '—'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'right' }}>{formatCurrency(parcela.valor || data.valor_mensal)}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#f5f5f5', fontWeight: '600' }}>
                <td style={{ border: '1px solid #ddd', padding: '7px 8px' }} colSpan={2}>TOTAL</td>
                <td style={{ border: '1px solid #ddd', padding: '7px 8px', textAlign: 'right' }}>{formatCurrency(data.valor_total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          DATA E LOCAL
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="contract-section" style={{ marginBottom: '28px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontStyle: 'italic', fontSize: '12px' }}>
          Cascavel/PR, {data.data_inicio ? formatDateExtended(data.data_inicio) : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BLOCO DE ASSINATURAS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="contract-section" style={{ marginTop: '35px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#222', marginBottom: '22px', textTransform: 'uppercase', borderBottom: '1px solid #e0e0e0', paddingBottom: '4px', textAlign: 'center' }}>
          Assinaturas
        </h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '35px' }}>
          {/* CONTRATANTE */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #333', marginBottom: '8px', height: '45px' }}></div>
            <p style={{ margin: '0 0 2px 0', fontWeight: '700', fontSize: '11px', color: '#8B1A1A' }}>
              {isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}
            </p>
            <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: '600' }}>
              {data.cliente_razao_social || clienteNomeCompleto}
            </p>
            {data.cliente_cnpj && (
              <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>CNPJ: {data.cliente_cnpj}</p>
            )}
            {signatarios?.cliente && (
              <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#555' }}>
                Representado por: {signatarios.cliente.nome} {signatarios.cliente.sobrenome || ''}
                {signatarios.cliente.cpf && <><br />CPF: {signatarios.cliente.cpf}</>}
              </p>
            )}
          </div>

          {/* CONTRATADA / EXA */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #333', marginBottom: '8px', height: '45px' }}></div>
            <p style={{ margin: '0 0 2px 0', fontWeight: '700', fontSize: '11px', color: '#8B1A1A' }}>
              {isSindico ? 'COMODANTE' : 'CONTRATADA'}
            </p>
            <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: '600' }}>
              EXA – Soluções Digitais LTDA
            </p>
            <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>CNPJ: 51.925.922/0001-50</p>
            
            {signatarios?.exa && signatarios.exa.length > 0 ? (
              signatarios.exa.map((sig, idx) => (
                <p key={idx} style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#555' }}>
                  {sig.nome}
                  {sig.cargo && <><br />{sig.cargo}</>}
                  {sig.cpf && <><br />CPF: {sig.cpf}</>}
                </p>
              ))
            ) : (
              <>
                <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#555' }}>
                  Jeferson S. R. Encina<br />Sócio Administrador<br />CPF: 055.031.279-00
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#555' }}>
                  Natália K. G. Dantas<br />Sócia Administradora<br />CPF: 116.228.359-99
                </p>
              </>
            )}
          </div>
        </div>

        {/* TESTEMUNHAS */}
        {signatarios?.testemunhas && signatarios.testemunhas.length > 0 && (
          <div style={{ marginTop: '35px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', marginBottom: '18px', textAlign: 'center', color: '#222' }}>TESTEMUNHAS:</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '35px' }}>
              {signatarios.testemunhas.map((testemunha, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid #333', marginBottom: '8px', height: '35px' }}></div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '10px' }}>{testemunha.nome}</p>
                  {testemunha.cpf && <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>CPF: {testemunha.cpf}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RODAPÉ
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: '35px', paddingTop: '12px', borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>
          Documento gerado eletronicamente por EXA Mídia — {data.numero_contrato || 'CTR-2025-0001'}
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#888' }}>
          www.examidia.com.br • contato@examidia.com.br • (45) 99809-0000
        </p>
      </div>
    </div>
  );
};

export default ContractPreview;
