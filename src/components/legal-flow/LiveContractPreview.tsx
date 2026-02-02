import React, { useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LegalFlowData, ClausulaGerada, GatilhoCondicional } from '@/hooks/useLegalFlow';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Header EXA oficial - IMAGEM COMPLETA COM FUNDO VERMELHO
import exaContractHeader from '@/assets/exa-contract-header.png';

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
// ESTILOS INLINE — VISUAL CLONE 100% DO TEMPLATE OFICIAL
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  header: {
    width: 'calc(100% + 40px)',
    margin: '-15px -20px 15px -20px',
    display: 'block',
  },
  headerImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
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
    color: '#666666',
  },
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
    color: '#666666',
    fontSize: '10pt',
  },
  infoValue: {
    fontWeight: 500,
    color: '#1a1a1a',
    textAlign: 'right' as const,
    fontSize: '10pt',
  },
  clause: {
    margin: '20px 0',
    textAlign: 'justify' as const,
    lineHeight: 1.8,
  },
  clauseTitle: {
    fontWeight: 600,
    color: '#8B1A1A',
    display: 'block',
    marginBottom: '5px',
  },
  clauseText: {
    marginTop: '5px',
    textAlign: 'justify' as const,
    lineHeight: 1.8,
    fontSize: '10.5pt',
  },
  highlightBox: {
    background: '#fafafa',
    border: '1px solid #e0e0e0',
    borderLeft: '4px solid #8B1A1A',
    borderRadius: '4px',
    padding: '15px',
    margin: '15px 0',
  },
  signatureSection: {
    marginTop: '60px',
    pageBreakInside: 'avoid' as const,
  },
  signatureIntro: {
    textAlign: 'center' as const,
    marginBottom: '30px',
    fontStyle: 'italic' as const,
    color: '#666666',
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
    borderTop: '1px solid #1a1a1a',
    marginTop: '70px',
    paddingTop: '10px',
  },
  signatureName: {
    fontWeight: 600,
    color: '#1a1a1a',
    fontSize: '10pt',
  },
  signatureRole: {
    fontSize: '9pt',
    color: '#666666',
    marginTop: '3px',
  },
  signatureDoc: {
    fontSize: '9pt',
    color: '#999999',
    marginTop: '3px',
  },
  witnessesSection: {
    marginTop: '50px',
    paddingTop: '25px',
    borderTop: '1px dashed #cccccc',
  },
  witnessesTitle: {
    textAlign: 'center' as const,
    fontWeight: 600,
    color: '#666666',
    marginBottom: '25px',
    fontSize: '10pt',
  },
  footer: {
    marginTop: '50px',
    paddingTop: '15px',
    borderTop: '2px solid #8B1A1A',
    textAlign: 'center' as const,
    color: '#666666',
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

  // Editable Field Component - PLACEHOLDER DENTRO DA LINHA (não flutuante)
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
        padding: '2px 4px',
        backgroundColor: isEditable && !value ? 'transparent' : 'transparent',
        cursor: isEditable ? 'text' : 'default',
        color: !value ? '#9ca3af' : 'inherit',
        fontStyle: !value ? 'italic' : 'normal',
        borderBottom: isEditable && !value ? '1px dashed #d1d5db' : 'none',
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
      {/* FUNDO CINZA LEVEMENTE MAIS ESCURO - para o papel "Pop out" */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        padding: '32px', 
        backgroundColor: '#d1d5db', // bg-gray-300 - mais escuro para contraste
        minHeight: '100%' 
      }}>
        {/* PAPEL A4 COM SOMBRA PROFUNDA */}
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
            // SOMBRA PROFUNDA E DIFUSA (shadow-2xl)
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 12px 24px -8px rgba(0, 0, 0, 0.15)',
            // BORDA SUTIL
            border: '1px solid rgba(209, 213, 219, 0.6)',
            borderRadius: '4px',
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

          {/* CABEÇALHO CORPORATIVO EXA */}
          <div className="no-break" style={styles.header}>
            <img
              style={styles.headerImage}
              src={exaContractHeader}
              alt="EXA - Ecossistema de Mídia e Tecnologia"
            />
          </div>

          {/* TÍTULO DO CONTRATO */}
          <div style={styles.contractTitle}>
            <h1 style={styles.contractTitleH1}>
              {getTituloContrato(data.tipo_contrato)}
            </h1>
            <div style={styles.contractNumber}>
              Contrato nº {numeroContrato}
            </div>
          </div>

          {/* IDENTIFICAÇÃO DAS PARTES */}
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

          {/* CLÁUSULAS DO CONTRATO */}
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
                      <strong>3.2.</strong> O pagamento será realizado conforme condições acordadas entre as partes.
                    </p>
                  </div>
                )}

                {/* CLÁUSULA - OBRIGAÇÕES DO PARCEIRO (se houver) */}
                {data.obrigacoes_parceiro.length > 0 && (
                  <div style={styles.clause}>
                    <span style={styles.clauseTitle}>CLÁUSULA {data.valor_financeiro ? '4' : '3'}ª — DAS OBRIGAÇÕES</span>
                    <p style={{ margin: '8px 0 4px 0', textAlign: 'justify' }}>
                      <strong>{data.valor_financeiro ? '4' : '3'}.1.</strong> A CONTRATANTE se obriga a:
                    </p>
                    <ul style={{ margin: '8px 0 0 20px', paddingLeft: '10px' }}>
                      {data.obrigacoes_parceiro.map((obr, idx) => (
                        <li key={idx} style={{ marginBottom: '4px', textAlign: 'justify' }}>{obr}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              /* Cláusulas para Comodato/Termo de Aceite */
              <>
                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 1ª — DO OBJETO</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>1.1.</strong> O presente termo tem por objeto a instalação e operação de equipamento de mídia digital em elevador, 
                    conforme especificações técnicas a serem apresentadas pela COMODANTE.
                  </p>
                </div>

                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 2ª — DA CESSÃO GRATUITA</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>2.1.</strong> O COMODATÁRIO autoriza a instalação do equipamento em caráter de comodato, 
                    sem qualquer ônus para o condomínio, ficando a COMODANTE responsável por todos os custos de instalação, 
                    manutenção e operação do equipamento.
                  </p>
                </div>

                <div style={styles.clause}>
                  <span style={styles.clauseTitle}>CLÁUSULA 3ª — DO PRAZO</span>
                  <p style={{ margin: '8px 0 0 0', textAlign: 'justify' }}>
                    <strong>3.1.</strong> O presente termo terá vigência de <strong>{data.prazo_meses || 12} ({getNumeroExtenso(data.prazo_meses || 12)}) {(data.prazo_meses || 12) === 1 ? 'mês' : 'meses'}</strong>, 
                    renovável automaticamente por igual período, salvo manifestação contrária de qualquer das partes com 30 dias de antecedência.
                  </p>
                </div>
              </>
            )}

            {/* GATILHOS CONDICIONAIS (se houver) */}
            {data.gatilhos_condicionais.length > 0 && (
              <div style={styles.highlightBox}>
                <strong style={{ color: '#8B1A1A' }}>⚡ Gatilhos Condicionais</strong>
                <ul style={{ margin: '10px 0 0 15px', paddingLeft: '5px' }}>
                  {data.gatilhos_condicionais.map((g, idx) => (
                    <li key={idx} style={{ marginBottom: '6px', fontSize: '10pt' }}>
                      <strong>Condição:</strong> {g.condicao}<br/>
                      <strong>Ação:</strong> {g.acao} <em>({g.prazo})</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ASSINATURAS */}
          <div className="no-break" style={styles.signatureSection}>
            <div style={styles.signatureIntro}>
              E por estarem assim justas e contratadas, as partes firmam o presente instrumento em 2 (duas) vias de igual teor e forma.
            </div>

            <p style={{ textAlign: 'center', marginBottom: '30px' }}>
              Campo Grande/MS, {formatDateExtended(data.data_inicio)}
            </p>

            <div style={styles.signaturesGrid}>
              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}>
                  <div style={styles.signatureName}>{companySettings.razao_social}</div>
                  <div style={styles.signatureRole}>{isSindico ? 'COMODANTE' : 'CONTRATADA'}</div>
                  <div style={styles.signatureDoc}>CNPJ: {companySettings.cnpj}</div>
                </div>
              </div>

              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}>
                  <div style={styles.signatureName}>
                    {data.parceiro_nome || '[NOME DO PARCEIRO]'}
                  </div>
                  <div style={styles.signatureRole}>{isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}</div>
                  <div style={styles.signatureDoc}>
                    {data.parceiro_tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}: {data.parceiro_documento || '[DOCUMENTO]'}
                  </div>
                </div>
              </div>
            </div>

            {/* TESTEMUNHAS */}
            <div style={styles.witnessesSection}>
              <div style={styles.witnessesTitle}>TESTEMUNHAS</div>
              <div style={styles.signaturesGrid}>
                <div style={styles.signatureBox}>
                  <div style={styles.signatureLine}>
                    <div style={styles.signatureName}>________________________</div>
                    <div style={styles.signatureRole}>Nome:</div>
                    <div style={styles.signatureDoc}>CPF:</div>
                  </div>
                </div>
                <div style={styles.signatureBox}>
                  <div style={styles.signatureLine}>
                    <div style={styles.signatureName}>________________________</div>
                    <div style={styles.signatureRole}>Nome:</div>
                    <div style={styles.signatureDoc}>CPF:</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RODAPÉ */}
          <div style={styles.footer}>
            <strong style={{ color: '#8B1A1A' }}>INDEXA MIDIA LTDA</strong>
            <br />
            {companySettings.endereco_completo}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
