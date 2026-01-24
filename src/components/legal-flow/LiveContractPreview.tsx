import React, { useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LegalFlowData, ClausulaGerada, GatilhoCondicional } from '@/hooks/useLegalFlow';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Logo EXA branca para header vermelho
const EXA_LOGO_WHITE = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/examidia-white-logo.png";
const EXA_LOGO_URL = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Exa%20sozinha.png";

interface LiveContractPreviewProps {
  data: LegalFlowData;
  onUpdate: (updates: Partial<LegalFlowData>) => void;
  isEditable?: boolean;
  onManualEdit?: (field: string, value: string) => void;
}

const getTituloContrato = (tipo: string) => {
  const titulos: Record<string, string> = {
    'termo_aceite': 'TERMO DE ACEITE PARA INSTALAÇÃO DE EQUIPAMENTOS',
    'comodato': 'CONTRATO DE COMODATO DE EQUIPAMENTOS',
    'anunciante': 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PUBLICIDADE DIGITAL',
    'parceria_clt': 'CONTRATO DE TRABALHO — CLT',
    'parceria_pj': 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS — PJ',
    'permuta': 'CONTRATO DE PERMUTA DE SERVIÇOS',
  };
  return titulos[tipo] || 'CONTRATO';
};

const formatDateExtended = (dateStr?: string) => {
  if (!dateStr) return format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  try {
    return format(new Date(dateStr + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch { return dateStr; }
};

const formatCurrency = (value: number | null) => {
  if (!value) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getNumeroExtenso = (num: number) => {
  const extenso: Record<number, string> = { 1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco', 6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez', 11: 'onze', 12: 'doze', 20: 'vinte', 30: 'trinta' };
  return extenso[num] || String(num);
};

export function LiveContractPreview({ 
  data, 
  onUpdate, 
  isEditable = true,
  onManualEdit 
}: LiveContractPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings: companySettings } = useCompanySettings();

  const handleContentEdit = useCallback((field: keyof LegalFlowData, value: string) => {
    onUpdate({ [field]: value } as Partial<LegalFlowData>);
    onManualEdit?.(field, value);
  }, [onUpdate, onManualEdit]);

  const EditableField = ({ 
    field, 
    value, 
    placeholder,
    style = {}
  }: { 
    field: keyof LegalFlowData; 
    value: string; 
    placeholder: string;
    style?: React.CSSProperties;
  }) => (
    <span
      contentEditable={isEditable}
      suppressContentEditableWarning
      onBlur={(e) => handleContentEdit(field, e.currentTarget.textContent || '')}
      style={{
        outline: 'none',
        transition: 'all 0.2s',
        borderRadius: '2px',
        padding: '0 2px',
        backgroundColor: isEditable && !value ? '#fff9e6' : 'transparent',
        cursor: isEditable ? 'text' : 'default',
        color: !value ? '#999' : 'inherit',
        fontStyle: !value ? 'italic' : 'normal',
        ...style
      }}
    >
      {value || placeholder}
    </span>
  );

  const hasMinimalContent = data.parceiro_nome || data.tipo_contrato || data.objeto;
  const isSindico = data.tipo_contrato === 'termo_aceite' || data.tipo_contrato === 'comodato';
  const isParceria = data.tipo_contrato === 'parceria_clt' || data.tipo_contrato === 'parceria_pj';
  const isPermuta = data.tipo_contrato === 'permuta';
  const numeroContrato = `CTR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  // Estilos de tabela conforme PDF oficial
  const tableHeaderStyle: React.CSSProperties = {
    backgroundColor: '#374151',
    color: 'white',
    padding: '10px 12px',
    textAlign: 'left',
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: '10px',
    borderBottom: '2px solid #C8102E'
  };

  const tableCellStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '11px',
    verticalAlign: 'top'
  };

  const clauseTitleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 700,
    color: '#C8102E',
    textTransform: 'uppercase',
    marginBottom: '8px',
    letterSpacing: '0.3px'
  };

  return (
    <ScrollArea className="h-full">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px', backgroundColor: '#e5e7eb', minHeight: '100%' }}>
        <div 
          ref={containerRef}
          id="contract-preview"
          style={{
            fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            fontSize: '11px',
            lineHeight: '1.6',
            color: '#1f2937',
            backgroundColor: '#ffffff',
            maxWidth: '210mm',
            width: '100%',
            minHeight: '297mm',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #d1d5db',
            position: 'relative'
          }}
        >
          <style>{`
            @media print {
              @page { size: A4; margin: 0; }
              .contract-section { page-break-inside: avoid !important; }
            }
            .contract-section { page-break-inside: avoid; }
          `}</style>

          {/* ═══════════════════════════════════════════════════════════════════
              HEADER VERMELHO EXA — CLONE EXATO DO PDF OFICIAL
          ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ 
            backgroundColor: '#C8102E',
            padding: '18px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0'
          }}>
            <img 
              src={EXA_LOGO_WHITE} 
              alt="EXA" 
              style={{ height: '38px' }}
              crossOrigin="anonymous"
              onError={(e) => { 
                e.currentTarget.src = EXA_LOGO_URL;
                e.currentTarget.style.filter = 'brightness(0) invert(1)';
              }}
            />
            <span style={{ 
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}>
              PUBLICIDADE EM ELEVADORES
            </span>
          </div>

          {/* Conteúdo com padding */}
          <div style={{ padding: '24px 28px' }}>

            {/* ═══════════════════════════════════════════════════════════════════
                TÍTULO DO CONTRATO
            ═══════════════════════════════════════════════════════════════════ */}
            <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <h1 style={{ 
                fontSize: '15px', 
                fontWeight: 700, 
                color: '#1f2937', 
                margin: '0 0 6px 0',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                {getTituloContrato(data.tipo_contrato)}
              </h1>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                Contrato nº <strong>{numeroContrato}</strong>
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                CLÁUSULA 1ª — DAS PARTES (TABELA LADO A LADO)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="contract-section" style={{ marginBottom: '20px' }}>
              <h3 style={clauseTitleStyle}>
                CLÁUSULA 1ª — DAS PARTES
              </h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th style={{ ...tableHeaderStyle, width: '50%' }}>
                      {isSindico ? 'COMODANTE' : 'CONTRATADA'}
                    </th>
                    <th style={{ ...tableHeaderStyle, width: '50%' }}>
                      {isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <td style={tableCellStyle}>
                      <strong>Razão Social:</strong><br />
                      {companySettings.razao_social}
                    </td>
                    <td style={tableCellStyle}>
                      <strong>Razão Social:</strong><br />
                      <EditableField 
                        field="parceiro_nome" 
                        value={data.parceiro_nome} 
                        placeholder="[PREENCHER]"
                      />
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: 'white' }}>
                    <td style={tableCellStyle}>
                      <strong>CNPJ:</strong><br />
                      {companySettings.cnpj}
                    </td>
                    <td style={tableCellStyle}>
                      <strong>{data.parceiro_tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}:</strong><br />
                      <EditableField 
                        field="parceiro_documento" 
                        value={data.parceiro_documento} 
                        placeholder="[PREENCHER]"
                      />
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <td style={tableCellStyle}>
                      <strong>Endereço:</strong><br />
                      {companySettings.endereco_completo}
                    </td>
                    <td style={tableCellStyle}>
                      <strong>E-mail:</strong><br />
                      {data.parceiro_email || <span style={{ color: '#999', fontStyle: 'italic' }}>[E-mail]</span>}
                      <br /><br />
                      <strong>Telefone:</strong><br />
                      {data.parceiro_telefone || <span style={{ color: '#999', fontStyle: 'italic' }}>[Telefone]</span>}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: 'white' }}>
                    <td style={tableCellStyle}>
                      <strong>Representante Legal:</strong><br />
                      {companySettings.representante_nome}<br />
                      <span style={{ fontSize: '10px', color: '#6b7280' }}>
                        {companySettings.representante_cargo} | CPF: {companySettings.representante_cpf}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <strong>Representante Legal:</strong><br />
                      <span style={{ color: '#999', fontStyle: 'italic' }}>[Nome do Representante]</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                CLÁUSULA 2ª — DO OBJETO
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="contract-section" style={{ marginBottom: '16px' }}>
              <h3 style={clauseTitleStyle}>CLÁUSULA 2ª — DO OBJETO</h3>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                <strong>2.1.</strong> O presente instrumento tem por objeto:{' '}
                <EditableField 
                  field="objeto" 
                  value={data.objeto} 
                  placeholder="[Descreva o objeto do contrato]"
                />
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                CLÁUSULA 3ª — DO PRAZO
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="contract-section" style={{ marginBottom: '16px' }}>
              <h3 style={clauseTitleStyle}>CLÁUSULA 3ª — DO PRAZO</h3>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                <strong>3.1.</strong> O presente contrato terá vigência de <strong>{data.prazo_meses || 12} ({getNumeroExtenso(data.prazo_meses || 12)}) {(data.prazo_meses || 12) === 1 ? 'mês' : 'meses'}</strong>, 
                a partir de <strong>{formatDateExtended(data.data_inicio)}</strong>, podendo ser renovado mediante termo aditivo assinado pelas partes.
              </p>
              <p style={{ margin: 0, textAlign: 'justify' }}>
                <strong>3.2.</strong> O contrato poderá ser renovado mediante acordo entre as partes, formalizado por escrito com antecedência mínima de 30 (trinta) dias do término.
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                CLÁUSULA 4ª — DO VALOR (se houver)
            ═══════════════════════════════════════════════════════════════════ */}
            {data.valor_financeiro && (
              <div className="contract-section" style={{ marginBottom: '16px' }}>
                <h3 style={clauseTitleStyle}>CLÁUSULA 4ª — DO VALOR E FORMA DE PAGAMENTO</h3>
                <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                  <strong>4.1.</strong> Pelo serviço objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor de{' '}
                  <strong style={{ color: '#C8102E', fontSize: '12px' }}>{formatCurrency(data.valor_financeiro)}</strong>.
                </p>
                <p style={{ margin: 0, textAlign: 'justify' }}>
                  <strong>4.2.</strong> O atraso no pagamento implicará multa de 2% (dois por cento) sobre o valor devido, acrescido de juros de mora de 1% (um por cento) ao mês.
                </p>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TABELA DE LOCAIS CONTRATADOS (para anunciantes)
            ═══════════════════════════════════════════════════════════════════ */}
            {data.tipo_contrato === 'anunciante' && (
              <div className="contract-section" style={{ marginBottom: '16px' }}>
                <h3 style={clauseTitleStyle}>CLÁUSULA 5ª — DOS LOCAIS CONTRATADOS</h3>
                <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
                  <strong>5.1.</strong> A veiculação será realizada nos seguintes edifícios:
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...tableHeaderStyle, fontSize: '9px' }}>Edifício</th>
                      <th style={{ ...tableHeaderStyle, fontSize: '9px' }}>Endereço</th>
                      <th style={{ ...tableHeaderStyle, fontSize: '9px', textAlign: 'center' }}>Telas</th>
                      <th style={{ ...tableHeaderStyle, fontSize: '9px', textAlign: 'center' }}>Exib./Dia</th>
                      <th style={{ ...tableHeaderStyle, fontSize: '9px', textAlign: 'center' }}>Exib./Mês</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <td style={{ ...tableCellStyle, fontSize: '10px', color: '#999', fontStyle: 'italic' }} colSpan={5}>
                        [Locais serão preenchidos conforme definido na proposta comercial]
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                OBRIGAÇÕES DAS PARTES
            ═══════════════════════════════════════════════════════════════════ */}
            {(data.obrigacoes_indexa.length > 0 || data.obrigacoes_parceiro.length > 0) && (
              <div className="contract-section" style={{ marginBottom: '16px' }}>
                <h3 style={clauseTitleStyle}>
                  CLÁUSULA {data.valor_financeiro ? '6ª' : (data.tipo_contrato === 'anunciante' ? '6ª' : '4ª')} — DAS OBRIGAÇÕES
                </h3>
                
                {data.obrigacoes_indexa.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: '0 0 6px 0', textAlign: 'justify', fontWeight: 600 }}>
                      São obrigações da {isSindico ? 'COMODANTE' : 'CONTRATADA'} (EXA Mídia):
                    </p>
                    {data.obrigacoes_indexa.map((obrigacao, i) => (
                      <p key={i} style={{ margin: '0 0 4px 0', textAlign: 'justify', paddingLeft: '16px' }}>
                        • {obrigacao}
                      </p>
                    ))}
                  </div>
                )}
                
                {data.obrigacoes_parceiro.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 6px 0', textAlign: 'justify', fontWeight: 600 }}>
                      São obrigações da {isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}:
                    </p>
                    {data.obrigacoes_parceiro.map((obrigacao, i) => (
                      <p key={i} style={{ margin: '0 0 4px 0', textAlign: 'justify', paddingLeft: '16px' }}>
                        • {obrigacao}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                GATILHOS CONDICIONAIS (para permutas)
            ═══════════════════════════════════════════════════════════════════ */}
            {data.gatilhos_condicionais.length > 0 && (
              <div className="contract-section" style={{ marginBottom: '16px' }}>
                <h3 style={clauseTitleStyle}>CLÁUSULA ESPECIAL — DOS GATILHOS CONDICIONAIS</h3>
                <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
                  As partes acordam os seguintes gatilhos condicionais para ativação de benefícios:
                </p>
                {data.gatilhos_condicionais.map((gatilho, i) => (
                  <div key={i} style={{ 
                    marginBottom: '10px', 
                    paddingLeft: '12px',
                    borderLeft: '3px solid #C8102E',
                    backgroundColor: '#fef2f2',
                    padding: '10px 12px',
                    borderRadius: '0 4px 4px 0'
                  }}>
                    <p style={{ margin: '0 0 2px 0', textAlign: 'justify' }}><strong>Condição:</strong> {gatilho.condicao}</p>
                    <p style={{ margin: '0 0 2px 0', textAlign: 'justify' }}><strong>Ação:</strong> {gatilho.acao}</p>
                    {gatilho.prazo && <p style={{ margin: 0, textAlign: 'justify' }}><strong>Prazo:</strong> {gatilho.prazo}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                CLÁUSULAS GERADAS PELA IA
            ═══════════════════════════════════════════════════════════════════ */}
            {data.clausulas_geradas.map((clausula, i) => (
              <div key={i} className="contract-section" style={{ marginBottom: '16px' }}>
                <h3 style={clauseTitleStyle}>
                  {clausula.titulo}
                </h3>
                <p style={{ margin: 0, textAlign: 'justify' }}>{clausula.conteudo}</p>
              </div>
            ))}

            {/* ═══════════════════════════════════════════════════════════════════
                CLÁUSULA — DA RESCISÃO
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="contract-section" style={{ marginBottom: '16px' }}>
              <h3 style={clauseTitleStyle}>CLÁUSULA — DA RESCISÃO</h3>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de {companySettings.prazo_aviso_rescisao_dias} ({getNumeroExtenso(companySettings.prazo_aviso_rescisao_dias)}) dias.
              </p>
              <p style={{ margin: 0, textAlign: 'justify' }}>
                Em caso de rescisão antecipada pela {isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}, será devida multa de {companySettings.multa_rescisao_percentual}% ({getNumeroExtenso(companySettings.multa_rescisao_percentual)} por cento) sobre o valor remanescente do contrato.
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                CLÁUSULA FINAL — DO FORO
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="contract-section" style={{ marginBottom: '20px' }}>
              <h3 style={clauseTitleStyle}>CLÁUSULA FINAL — DO FORO</h3>
              <p style={{ margin: 0, textAlign: 'justify' }}>
                Fica eleito o foro da Comarca de <strong>{companySettings.foro_completo}</strong> para dirimir quaisquer controvérsias oriundas do presente instrumento, 
                com renúncia expressa a qualquer outro, por mais privilegiado que seja.
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                DATA E LOCAL
            ═══════════════════════════════════════════════════════════════════ */}
            <p style={{ textAlign: 'center', margin: '30px 0', fontSize: '11px' }}>
              {companySettings.foro_completo}, {formatDateExtended(data.data_inicio)}.
            </p>

            {/* ═══════════════════════════════════════════════════════════════════
                ASSINATURAS — LAYOUT SIDE-BY-SIDE
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="contract-section" style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
                {/* CONTRATANTE / COMODATÁRIO */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid #374151', marginBottom: '10px', height: '50px' }}></div>
                  <p style={{ margin: '0 0 2px 0', fontWeight: 700, fontSize: '10px', color: '#C8102E', textTransform: 'uppercase' }}>
                    {isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}
                  </p>
                  <p style={{ margin: '0 0 2px 0', fontSize: '10px', fontWeight: 600 }}>
                    {data.parceiro_nome || '[Nome do Contratante]'}
                  </p>
                  <p style={{ margin: 0, fontSize: '9px', color: '#6b7280' }}>
                    {data.parceiro_documento || '[Documento]'}
                  </p>
                </div>

                {/* CONTRATADA / COMODANTE — EXA */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid #374151', marginBottom: '10px', height: '50px' }}></div>
                  <p style={{ margin: '0 0 2px 0', fontWeight: 700, fontSize: '10px', color: '#C8102E', textTransform: 'uppercase' }}>
                    {isSindico ? 'COMODANTE' : 'CONTRATADA'}
                  </p>
                  <p style={{ margin: '0 0 2px 0', fontSize: '10px', fontWeight: 600 }}>
                    {companySettings.razao_social}
                  </p>
                  <p style={{ margin: 0, fontSize: '9px', color: '#6b7280' }}>CNPJ: {companySettings.cnpj}</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '9px', color: '#6b7280' }}>
                    {companySettings.representante_nome}<br />
                    {companySettings.representante_cargo}<br />
                    CPF: {companySettings.representante_cpf}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              RODAPÉ INSTITUCIONAL
          ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ 
            marginTop: '20px', 
            padding: '12px 28px', 
            borderTop: '1px solid #e5e7eb', 
            backgroundColor: '#f9fafb',
            textAlign: 'center' 
          }}>
            <p style={{ margin: 0, fontSize: '9px', color: '#6b7280' }}>
              {companySettings.endereco_completo}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#6b7280' }}>
              {companySettings.website} • {companySettings.email_institucional} • {companySettings.telefone_principal}
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              EMPTY STATE OVERLAY
          ═══════════════════════════════════════════════════════════════════ */}
          {!hasMinimalContent && (
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'rgba(255,255,255,0.95)', 
              pointerEvents: 'none' 
            }}>
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Converse com a IA para preencher o contrato</p>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>ou clique nos campos para editar manualmente</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
