import React, { useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LegalFlowData, ClausulaGerada, GatilhoCondicional } from '@/hooks/useLegalFlow';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Logo EXA oficial - PADRÃO ÚNICO PARA TODOS OS CONTRATOS (mesma URL da home)
const EXA_LOGO_URL = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0";

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

const calcDataFim = (dataInicio?: string, prazoMeses?: number) => {
  if (!dataInicio || !prazoMeses) return null;
  try {
    const start = new Date(dataInicio + 'T00:00:00');
    start.setMonth(start.getMonth() + prazoMeses);
    return format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch { return null; }
};

const getNumeroExtenso = (num: number) => {
  const extenso: Record<number, string> = { 1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco', 6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez', 11: 'onze', 12: 'doze', 20: 'vinte', 30: 'trinta' };
  return extenso[num] || String(num);
};

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS INLINE PADRÃO OFICIAL EXA - IDÊNTICO A create-contract-from-proposal
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  // ═══════════════════════════════════════════════════════════════════════════════
  // HEADER CORPORATIVO EXA - VERMELHO #C8102E (BRANDBOOK OFICIAL)
  // ═══════════════════════════════════════════════════════════════════════════════
  header: {
    width: '100%',
    height: '128px',
    background: '#C8102E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    margin: '-15px -20px 25px -20px',
    marginLeft: '-20px',
    marginRight: '-20px',
    marginTop: '-15px',
    boxSizing: 'border-box' as const,
  },
  headerLogo: {
    height: '60px',
    width: 'auto',
  },
  headerText: {
    color: 'white',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '3px',
    textTransform: 'uppercase' as const,
    textAlign: 'right' as const,
  },
  // Título do contrato
  contractTitle: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  contractTitleH1: {
    color: '#8B1A1A',
    fontSize: '18pt',
    margin: '0 0 10px 0',
    fontWeight: 600,
  },
  contractNumber: {
    fontSize: '12pt',
    color: '#666',
  },
  // Seções
  section: {
    margin: '25px 0',
  },
  sectionTitle: {
    background: 'linear-gradient(90deg, #8B1A1A, #A52020)',
    color: 'white',
    padding: '10px 15px',
    fontSize: '12pt',
    fontWeight: 600,
    marginBottom: '15px',
    borderRadius: '4px',
  },
  // Grid de info cards
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    margin: '15px 0',
  },
  infoCard: {
    background: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '15px',
  },
  infoCardTitle: {
    fontWeight: 600,
    color: '#8B1A1A',
    marginBottom: '10px',
    fontSize: '11pt',
    borderBottom: '2px solid #8B1A1A',
    paddingBottom: '5px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    borderBottom: '1px dotted #ddd',
  },
  infoLabel: {
    color: '#666',
    fontSize: '10pt',
  },
  infoValue: {
    fontWeight: 500,
    color: '#1a1a1a',
    textAlign: 'right' as const,
    fontSize: '10pt',
  },
  // Cláusulas
  clause: {
    margin: '20px 0',
    textAlign: 'justify' as const,
    lineHeight: 1.8,
  },
  clauseTitle: {
    fontWeight: 600,
    color: '#8B1A1A',
  },
  // Highlight box
  highlightBox: {
    background: '#fafafa',
    border: '1px solid #e0e0e0',
    borderLeft: '4px solid #8B1A1A',
    borderRadius: '4px',
    padding: '15px',
    margin: '15px 0',
  },
  // Assinaturas
  signatureSection: {
    marginTop: '60px',
    pageBreakInside: 'avoid' as const,
  },
  signaturesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    marginTop: '30px',
  },
  signatureBox: {
    textAlign: 'center' as const,
  },
  signatureLine: {
    borderTop: '1px solid #333',
    marginTop: '70px',
    paddingTop: '10px',
  },
  signatureName: {
    fontWeight: 600,
    color: '#1a1a1a',
  },
  signatureRole: {
    fontSize: '10pt',
    color: '#666',
    marginTop: '3px',
  },
  signatureDoc: {
    fontSize: '9pt',
    color: '#888',
    marginTop: '3px',
  },
  // Testemunhas
  witnessesSection: {
    marginTop: '50px',
    paddingTop: '30px',
    borderTop: '1px dashed #ccc',
  },
  witnessesTitle: {
    textAlign: 'center' as const,
    fontWeight: 600,
    color: '#666',
    marginBottom: '30px',
  },
  // Rodapé
  footer: {
    marginTop: '50px',
    paddingTop: '15px',
    borderTop: '2px solid #8B1A1A',
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '9pt',
  },
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
  const numeroContrato = `CTR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  return (
    <ScrollArea className="h-full">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px', backgroundColor: '#e5e7eb', minHeight: '100%' }}>
        <div 
          ref={containerRef}
          id="contract-preview"
          style={{
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontSize: '10.5pt',
            lineHeight: 1.65,
            color: '#1a1a1a',
            backgroundColor: '#ffffff',
            maxWidth: '210mm',
            width: '100%',
            minHeight: '297mm',
            padding: '15px 20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #d1d5db',
            position: 'relative'
          }}
        >
          <style>{`
            @page { size: A4; margin: 12mm 15mm; }
            @media print {
              html, body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                background: white !important;
              }
              .page-break { page-break-before: always; }
              .no-break { page-break-inside: avoid; }
            }
            * { box-sizing: border-box; }
          `}</style>

          {/* ═══════════════════════════════════════════════════════════════════
              CABEÇALHO CORPORATIVO EXA — HEADER VERMELHO #C8102E (BRANDBOOK)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="no-break" style={styles.header}>
            <img 
              src={EXA_LOGO_URL} 
              alt="EXA Mídia" 
              style={styles.headerLogo}
              crossOrigin="anonymous"
            />
            <div style={styles.headerText}>
              PUBLICIDADE EM ELEVADORES
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              TÍTULO DO CONTRATO
          ═══════════════════════════════════════════════════════════════════ */}
          <div style={styles.contractTitle}>
            <h1 style={styles.contractTitleH1}>
              {getTituloContrato(data.tipo_contrato)}
            </h1>
            <div style={styles.contractNumber}>
              Contrato nº {numeroContrato}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              IDENTIFICAÇÃO DAS PARTES (SECTION COM GRADIENTE)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="no-break" style={styles.section}>
            <div style={styles.sectionTitle}>
              IDENTIFICAÇÃO DAS PARTES
            </div>
            
            <div style={styles.infoGrid}>
              {/* CONTRATADA / EXA */}
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>
                  {isSindico ? 'COMODANTE' : 'CONTRATADA'}
                </div>
                <div style={{ ...styles.infoRow, borderBottom: '1px dotted #ddd' }}>
                  <span style={styles.infoLabel}>Razão Social</span>
                  <span style={styles.infoValue}>{companySettings.razao_social}</span>
                </div>
                <div style={{ ...styles.infoRow, borderBottom: '1px dotted #ddd' }}>
                  <span style={styles.infoLabel}>CNPJ</span>
                  <span style={styles.infoValue}>{companySettings.cnpj}</span>
                </div>
                <div style={{ ...styles.infoRow, borderBottom: '1px dotted #ddd' }}>
                  <span style={styles.infoLabel}>Endereço</span>
                  <span style={styles.infoValue}>{companySettings.endereco_completo}</span>
                </div>
                <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
                  <span style={styles.infoLabel}>Representante</span>
                  <span style={styles.infoValue}>{companySettings.representante_nome}</span>
                </div>
              </div>

              {/* CONTRATANTE / PARCEIRO */}
              <div style={styles.infoCard}>
                <div style={styles.infoCardTitle}>
                  {isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}
                </div>
                <div style={{ ...styles.infoRow, borderBottom: '1px dotted #ddd' }}>
                  <span style={styles.infoLabel}>{data.parceiro_tipo_pessoa === 'PF' ? 'Nome' : 'Razão Social'}</span>
                  <span style={styles.infoValue}>
                    <EditableField field="parceiro_nome" value={data.parceiro_nome} placeholder="[Nome/Razão Social]" />
                  </span>
                </div>
                <div style={{ ...styles.infoRow, borderBottom: '1px dotted #ddd' }}>
                  <span style={styles.infoLabel}>{data.parceiro_tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}</span>
                  <span style={styles.infoValue}>
                    <EditableField field="parceiro_documento" value={data.parceiro_documento || ''} placeholder="[Documento]" />
                  </span>
                </div>
                {data.parceiro_email && (
                  <div style={{ ...styles.infoRow, borderBottom: '1px dotted #ddd' }}>
                    <span style={styles.infoLabel}>E-mail</span>
                    <span style={styles.infoValue}>{data.parceiro_email}</span>
                  </div>
                )}
                <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
                  <span style={styles.infoLabel}>Telefone</span>
                  <span style={styles.infoValue}>{data.parceiro_telefone || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CLÁUSULAS DO CONTRATO
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="no-break" style={styles.section}>
            <div style={styles.sectionTitle}>
              CLÁUSULAS CONTRATUAIS
            </div>

            {!isSindico ? (
              <>
                {/* CLÁUSULA 1 - OBJETO */}
                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 1ª — DO OBJETO</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>1.1.</strong> O presente contrato tem por objeto:{' '}
                    <EditableField field="objeto" value={data.objeto} placeholder="[Descreva o objeto do contrato]" />
                  </p>
                </div>

                {/* CLÁUSULA 2 - PRAZO */}
                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 2ª — DO PRAZO</span>
                  <p style={{ margin: '8px 0 4px 0', textAlign: 'justify' }}>
                    <strong>2.1.</strong> O presente contrato terá vigência de <strong>{data.prazo_meses || 12} ({getNumeroExtenso(data.prazo_meses || 12)}) {(data.prazo_meses || 12) === 1 ? 'mês' : 'meses'}</strong>, 
                    com início em <strong>{formatDateExtended(data.data_inicio)}</strong> e término previsto para <strong>{calcDataFim(data.data_inicio, data.prazo_meses) || '[DATA FIM]'}</strong>.
                  </p>
                  <p style={{ margin: 0, textAlign: 'justify' }}>
                    <strong>2.2.</strong> O contrato poderá ser renovado mediante acordo entre as partes, formalizado por escrito com antecedência mínima de 30 (trinta) dias do término.
                  </p>
                </div>

                {/* CLÁUSULA 3 - VALOR E PAGAMENTO (se houver) */}
                {data.valor_financeiro && (
                  <div style={styles.clause}>
                    <span style={styles.clauseTitle}>CLÁUSULA 3ª — DO VALOR E FORMA DE PAGAMENTO</span>
                    <p style={{ margin: '8px 0 4px 0', textAlign: 'justify' }}>
                      <strong>3.1.</strong> Pelo serviço objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor de <strong>{formatCurrency(data.valor_financeiro)}</strong>.
                    </p>
                    <p style={{ margin: 0, textAlign: 'justify' }}>
                      <strong>3.2.</strong> O atraso no pagamento implicará multa de 2% (dois por cento) sobre o valor devido, acrescido de juros de mora de 1% (um por cento) ao mês.
                    </p>
                  </div>
                )}

                {/* CLÁUSULA - OBRIGAÇÕES DA CONTRATADA */}
                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA {data.valor_financeiro ? '4ª' : '3ª'} — DAS OBRIGAÇÕES DA CONTRATADA</span>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px', listStyleType: 'none' }}>
                    <li style={{ margin: '4px 0' }}><strong>{data.valor_financeiro ? '4.1.' : '3.1.'}</strong> Manter os equipamentos em perfeito funcionamento;</li>
                    <li style={{ margin: '4px 0' }}><strong>{data.valor_financeiro ? '4.2.' : '3.2.'}</strong> Garantir a exibição do conteúdo conforme especificações acordadas;</li>
                    <li style={{ margin: '4px 0' }}><strong>{data.valor_financeiro ? '4.3.' : '3.3.'}</strong> Prestar suporte técnico em caso de falhas;</li>
                    <li style={{ margin: '4px 0' }}><strong>{data.valor_financeiro ? '4.4.' : '3.4.'}</strong> Fornecer relatórios de exibição quando solicitado.</li>
                  </ul>
                </div>

                {/* CLÁUSULA - OBRIGAÇÕES DO CONTRATANTE */}
                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA {data.valor_financeiro ? '5ª' : '4ª'} — DAS OBRIGAÇÕES DA CONTRATANTE</span>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px', listStyleType: 'none' }}>
                    <li style={{ margin: '4px 0' }}><strong>{data.valor_financeiro ? '5.1.' : '4.1.'}</strong> Efetuar os pagamentos nas datas acordadas;</li>
                    <li style={{ margin: '4px 0' }}><strong>{data.valor_financeiro ? '5.2.' : '4.2.'}</strong> Fornecer o material publicitário em formato compatível;</li>
                    <li style={{ margin: '4px 0' }}><strong>{data.valor_financeiro ? '5.3.' : '4.3.'}</strong> Garantir que o conteúdo não viole legislação vigente;</li>
                    <li style={{ margin: '4px 0' }}><strong>{data.valor_financeiro ? '5.4.' : '4.4.'}</strong> Comunicar alterações no conteúdo com antecedência mínima de 48 horas.</li>
                  </ul>
                </div>

                {/* CLÁUSULA - RESCISÃO */}
                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA {data.valor_financeiro ? '6ª' : '5ª'} — DA RESCISÃO</span>
                  <p style={{ margin: '8px 0 4px 0', textAlign: 'justify' }}>
                    <strong>{data.valor_financeiro ? '6.1.' : '5.1.'}</strong> O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.
                  </p>
                  <p style={{ margin: 0, textAlign: 'justify' }}>
                    <strong>{data.valor_financeiro ? '6.2.' : '5.2.'}</strong> Em caso de rescisão antecipada pela CONTRATANTE, será devida multa de 20% (vinte por cento) sobre o valor remanescente do contrato.
                  </p>
                </div>

                {/* CLÁUSULA - DIREITO DE IMAGEM */}
                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA {data.valor_financeiro ? '7ª' : '6ª'} — DO DIREITO DE IMAGEM</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>{data.valor_financeiro ? '7.1.' : '6.1.'}</strong> A CONTRATANTE autoriza expressamente a CONTRATADA a utilizar imagens dos painéis em funcionamento, 
                    incluindo o conteúdo publicitário veiculado, para fins de divulgação institucional, portfólio e marketing.
                  </p>
                </div>

                {/* CLÁUSULA - FORO */}
                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA {data.valor_financeiro ? '8ª' : '7ª'} — DO FORO</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>{data.valor_financeiro ? '8.1.' : '7.1.'}</strong> As partes elegem o foro da Comarca de <strong>{companySettings.foro_completo}</strong> para dirimir quaisquer controvérsias 
                    oriundas deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.
                  </p>
                </div>
              </>
            ) : (
              /* ═════════════════════════════════════════════════════════════════
                 CLÁUSULAS PARA CONTRATO DE COMODATO / TERMO DE ACEITE (SÍNDICO)
              ═════════════════════════════════════════════════════════════════ */
              <>
                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 1ª — DO OBJETO</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>1.1.</strong> O presente contrato tem por objeto o empréstimo gratuito (comodato) de painel(éis) digital(is) 
                    para instalação no(s) elevador(es) do edifício:{' '}
                    <EditableField field="objeto" value={data.objeto} placeholder="[Nome e endereço do prédio]" />
                  </p>
                </div>

                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 2ª — DA VIGÊNCIA</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>2.1.</strong> O presente contrato vigorará por prazo indeterminado, podendo ser rescindido por qualquer das partes 
                    mediante aviso prévio de <strong>30 (trinta)</strong> dias.
                  </p>
                </div>

                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 3ª — DAS OBRIGAÇÕES DA COMODANTE (EXA)</span>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px', listStyleType: 'none' }}>
                    <li style={{ margin: '4px 0' }}><strong>3.1.</strong> Fornecer os equipamentos em perfeito estado de funcionamento;</li>
                    <li style={{ margin: '4px 0' }}><strong>3.2.</strong> Realizar a instalação e manutenção dos equipamentos;</li>
                    <li style={{ margin: '4px 0' }}><strong>3.3.</strong> Prestar suporte técnico durante toda a vigência do contrato;</li>
                    <li style={{ margin: '4px 0' }}><strong>3.4.</strong> Substituir equipamentos defeituosos sem custo para o COMODATÁRIO.</li>
                  </ul>
                </div>

                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 4ª — DAS OBRIGAÇÕES DO COMODATÁRIO</span>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px', listStyleType: 'none' }}>
                    <li style={{ margin: '4px 0' }}><strong>4.1.</strong> Permitir o acesso da equipe técnica para instalação e manutenção;</li>
                    <li style={{ margin: '4px 0' }}><strong>4.2.</strong> Comunicar imediatamente qualquer dano ou mau funcionamento;</li>
                    <li style={{ margin: '4px 0' }}><strong>4.3.</strong> Não remover ou alterar os equipamentos sem autorização;</li>
                    <li style={{ margin: '4px 0' }}><strong>4.4.</strong> Permitir a instalação de conexão de internet pela COMODANTE, se necessário.</li>
                  </ul>
                </div>

                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 5ª — DA PROPRIEDADE</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>5.1.</strong> Os equipamentos objeto deste comodato permanecem de propriedade exclusiva da COMODANTE (EXA), 
                    devendo ser restituídos ao término do contrato em perfeito estado de conservação, ressalvado o desgaste natural pelo uso.
                  </p>
                </div>

                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 6ª — DO DIREITO DE IMAGEM</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>6.1.</strong> O COMODATÁRIO autoriza expressamente a COMODANTE a utilizar imagens dos painéis instalados 
                    para fins de divulgação institucional e comercialização de espaço publicitário a terceiros.
                  </p>
                </div>

                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 7ª — DO FORO</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>7.1.</strong> As partes elegem o foro da Comarca de <strong>{companySettings.foro_completo}</strong> para dirimir quaisquer controvérsias oriundas deste contrato.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CLÁUSULAS ESPECIAIS GERADAS PELA IA (se houver)
          ═══════════════════════════════════════════════════════════════════ */}
          {data.clausulas_geradas && data.clausulas_geradas.length > 0 && (
            <div className="no-break" style={styles.section}>
              <div style={styles.sectionTitle}>
                CONDIÇÕES ESPECIAIS
              </div>
              {data.clausulas_geradas.map((clausula, idx) => (
                <div key={idx} style={styles.clause}>
                  <span style={styles.clauseTitle}>{clausula.titulo}</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>{clausula.conteudo}</p>
                </div>
              ))}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              BLOCO DE ASSINATURAS — LAYOUT SIDE-BY-SIDE (PADRÃO EXA)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="no-break" style={styles.signatureSection}>
            <div style={styles.sectionTitle}>
              ASSINATURAS
            </div>
            
            <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#666', marginBottom: '30px' }}>
              E, por estarem assim justas e contratadas, as partes firmam o presente instrumento em 2 (duas) vias de igual teor.
            </p>

            <p style={{ textAlign: 'center', marginBottom: '40px' }}>
              Foz do Iguaçu/PR, {formatDateExtended(data.data_inicio)}.
            </p>

            <div style={styles.signaturesGrid}>
              {/* CONTRATANTE */}
              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}></div>
                <p style={{ ...styles.signatureName, color: '#8B1A1A' }}>
                  {isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}
                </p>
                <p style={styles.signatureName}>
                  {data.parceiro_nome || '[Nome do Contratante]'}
                </p>
                {data.parceiro_documento && (
                  <p style={styles.signatureDoc}>
                    {data.parceiro_tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}: {data.parceiro_documento}
                  </p>
                )}
              </div>

              {/* CONTRATADA / EXA */}
              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}></div>
                <p style={{ ...styles.signatureName, color: '#8B1A1A' }}>
                  {isSindico ? 'COMODANTE' : 'CONTRATADA'}
                </p>
                <p style={styles.signatureName}>
                  {companySettings.razao_social}
                </p>
                <p style={styles.signatureRole}>
                  {companySettings.representante_nome}
                </p>
                <p style={styles.signatureDoc}>
                  {companySettings.representante_cargo} — CPF: {companySettings.representante_cpf}
                </p>
              </div>
            </div>

            {/* TESTEMUNHAS */}
            <div style={styles.witnessesSection}>
              <div style={styles.witnessesTitle}>TESTEMUNHAS</div>
              <div style={{ ...styles.signaturesGrid, marginTop: '20px' }}>
                <div style={styles.signatureBox}>
                  <div style={{ ...styles.signatureLine, marginTop: '50px' }}></div>
                  <p style={styles.signatureName}>Testemunha 1</p>
                  <p style={styles.signatureDoc}>Nome: _______________________</p>
                  <p style={styles.signatureDoc}>CPF: ________________________</p>
                </div>
                <div style={styles.signatureBox}>
                  <div style={{ ...styles.signatureLine, marginTop: '50px' }}></div>
                  <p style={styles.signatureName}>Testemunha 2</p>
                  <p style={styles.signatureDoc}>Nome: _______________________</p>
                  <p style={styles.signatureDoc}>CPF: ________________________</p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              RODAPÉ INSTITUCIONAL
          ═══════════════════════════════════════════════════════════════════ */}
          <div style={styles.footer}>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {companySettings.razao_social}
            </p>
            <p style={{ margin: '4px 0' }}>
              {companySettings.endereco_completo}
            </p>
            <p style={{ margin: 0 }}>
              {companySettings.website} • {companySettings.email_institucional} • {companySettings.telefone_principal}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '8pt', color: '#999' }}>
              Documento nº {numeroContrato} — Gerado eletronicamente
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
