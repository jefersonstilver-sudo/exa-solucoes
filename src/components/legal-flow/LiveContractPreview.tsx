import React, { useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LegalFlowData, ClausulaGerada, GatilhoCondicional } from '@/hooks/useLegalFlow';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const extenso: Record<number, string> = { 1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco', 6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez', 11: 'onze', 12: 'doze' };
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

  return (
    <ScrollArea className="h-full">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px', backgroundColor: '#e5e7eb', minHeight: '100%' }}>
        <div 
          ref={containerRef}
          id="contract-preview"
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: '13px',
            lineHeight: '1.65',
            color: '#1a1a1a',
            backgroundColor: '#ffffff',
            maxWidth: '210mm',
            width: '100%',
            minHeight: '297mm',
            padding: '18mm 22mm',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #d1d5db',
            position: 'relative'
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
              CABEÇALHO COM LOGO — EXATO DO ContractPreview.tsx
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="contract-section" style={{ textAlign: 'center', marginBottom: '28px', borderBottom: '3px solid #8B1A1A', paddingBottom: '18px' }}>
            <img 
              src={EXA_LOGO_URL} 
              alt="EXA Mídia" 
              style={{ height: '55px', marginBottom: '14px' }}
              crossOrigin="anonymous"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <h1 style={{ 
              fontSize: '16px', 
              fontWeight: '700', 
              color: '#8B1A1A', 
              margin: '0 0 6px 0',
              letterSpacing: '0.8px',
              textTransform: 'uppercase'
            }}>
              {getTituloContrato(data.tipo_contrato)}
            </h1>
            <p style={{ fontSize: '13px', color: '#444', margin: 0, fontWeight: '600' }}>
              Contrato nº {numeroContrato}
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              IDENTIFICAÇÃO DAS PARTES — PARÁGRAFOS CORRIDOS
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="contract-section" style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#222', marginBottom: '10px', textTransform: 'uppercase', borderBottom: '1px solid #e0e0e0', paddingBottom: '4px' }}>
              Identificação das Partes
            </h2>
            
            <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
              <strong style={{ color: '#8B1A1A' }}>{isSindico ? 'COMODANTE' : 'CONTRATADA'}:</strong>{' '}
              <strong>{companySettings.razao_social}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>{companySettings.cnpj}</strong>, 
              com sede em {companySettings.endereco_completo}, neste ato representada por seu {companySettings.representante_cargo}, <strong>{companySettings.representante_nome}</strong>, 
              inscrito no CPF sob o nº {companySettings.representante_cpf}.
            </p>

            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong style={{ color: '#8B1A1A' }}>{isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}:</strong>{' '}
              <strong>
                <EditableField 
                  field="parceiro_nome" 
                  value={data.parceiro_nome} 
                  placeholder="[Nome/Razão Social]"
                  style={{ fontWeight: 700 }}
                />
              </strong>
              {data.parceiro_documento && (
                <>, inscrita no {data.parceiro_tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'} sob o nº <strong>{data.parceiro_documento}</strong></>
              )}
              {!data.parceiro_documento && (
                <>, inscrita no {data.parceiro_tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'} sob o nº <strong>
                  <EditableField field="parceiro_documento" value={data.parceiro_documento} placeholder="[Documento]" style={{ fontWeight: 700 }} />
                </strong></>
              )}
              {data.parceiro_email && <>, e-mail: {data.parceiro_email}</>}
              {data.parceiro_telefone && <>, telefone: {data.parceiro_telefone}</>}.
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CLÁUSULA 1 — DO OBJETO
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 1ª — DO OBJETO</h3>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              <strong>1.1.</strong> O presente instrumento tem por objeto:{' '}
              <EditableField 
                field="objeto" 
                value={data.objeto} 
                placeholder="[Descreva o objeto do contrato]"
              />
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CLÁUSULA 2 — DO PRAZO
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 2ª — DO PRAZO</h3>
            <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
              <strong>2.1.</strong> O presente contrato terá vigência de <strong>{data.prazo_meses || 12} ({getNumeroExtenso(data.prazo_meses || 12)}) {(data.prazo_meses || 12) === 1 ? 'mês' : 'meses'}</strong>, 
              a partir de <strong>{formatDateExtended(data.data_inicio)}</strong>, podendo ser renovado mediante termo aditivo assinado pelas partes.
            </p>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              <strong>2.2.</strong> O contrato poderá ser renovado mediante acordo entre as partes, formalizado por escrito com antecedência mínima de 30 (trinta) dias do término.
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              CLÁUSULA 3 — DO VALOR (se houver)
          ═══════════════════════════════════════════════════════════════════ */}
          {data.valor_financeiro && (
            <div className="contract-section" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA 3ª — DO VALOR E FORMA DE PAGAMENTO</h3>
              <p style={{ margin: '0 0 6px 0', textAlign: 'justify' }}>
                <strong>3.1.</strong> Pelo serviço objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor de <strong style={{ color: '#8B1A1A' }}>{formatCurrency(data.valor_financeiro)}</strong>.
              </p>
              <p style={{ margin: 0, textAlign: 'justify' }}>
                <strong>3.2.</strong> O atraso no pagamento implicará multa de 2% (dois por cento) sobre o valor devido, acrescido de juros de mora de 1% (um por cento) ao mês.
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              OBRIGAÇÕES DAS PARTES
          ═══════════════════════════════════════════════════════════════════ */}
          {(data.obrigacoes_indexa.length > 0 || data.obrigacoes_parceiro.length > 0) && (
            <div className="contract-section" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>
                CLÁUSULA {data.valor_financeiro ? '4ª' : '3ª'} — DAS OBRIGAÇÕES
              </h3>
              
              {data.obrigacoes_indexa.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>São obrigações da {isSindico ? 'COMODANTE' : 'CONTRATADA'} (EXA Mídia):</strong></p>
                  {data.obrigacoes_indexa.map((obrigacao, i) => (
                    <p key={i} style={{ margin: '0 0 4px 0', textAlign: 'justify', paddingLeft: '16px' }}>
                      <strong>{data.valor_financeiro ? '4' : '3'}.{i + 1}.</strong> {obrigacao}
                    </p>
                  ))}
                </div>
              )}
              
              {data.obrigacoes_parceiro.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 4px 0', textAlign: 'justify' }}><strong>São obrigações da {isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}:</strong></p>
                  {data.obrigacoes_parceiro.map((obrigacao, i) => (
                    <p key={i} style={{ margin: '0 0 4px 0', textAlign: 'justify', paddingLeft: '16px' }}>
                      <strong>{data.valor_financeiro ? '4' : '3'}.{data.obrigacoes_indexa.length + i + 1}.</strong> {obrigacao}
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
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA ESPECIAL — DOS GATILHOS CONDICIONAIS</h3>
              <p style={{ margin: '0 0 8px 0', textAlign: 'justify' }}>
                As partes acordam os seguintes gatilhos condicionais para ativação de benefícios:
              </p>
              {data.gatilhos_condicionais.map((gatilho, i) => (
                <div key={i} style={{ 
                  marginBottom: '10px', 
                  paddingLeft: '12px',
                  borderLeft: '2px solid #8B1A1A'
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
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>
                {clausula.titulo}
              </h3>
              <p style={{ margin: 0, textAlign: 'justify' }}>{clausula.conteudo}</p>
            </div>
          ))}

          {/* ═══════════════════════════════════════════════════════════════════
              CLÁUSULA — DA RESCISÃO
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="contract-section" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA — DA RESCISÃO</h3>
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
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#222', marginBottom: '6px' }}>CLÁUSULA FINAL — DO FORO</h3>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              Fica eleito o foro da Comarca de <strong>{companySettings.foro_completo}</strong> para dirimir quaisquer controvérsias oriundas do presente instrumento, 
              com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              DATA E LOCAL
          ═══════════════════════════════════════════════════════════════════ */}
          <p style={{ textAlign: 'center', margin: '35px 0', fontSize: '13px' }}>
            {companySettings.foro_completo}, {formatDateExtended(data.data_inicio)}.
          </p>

          {/* ═══════════════════════════════════════════════════════════════════
              ASSINATURAS — LAYOUT SIDE-BY-SIDE
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="contract-section" style={{ marginTop: '35px' }}>
            <h2 style={{ 
              fontSize: '13px', 
              fontWeight: '700', 
              color: '#222', 
              marginBottom: '22px', 
              textTransform: 'uppercase', 
              borderBottom: '1px solid #e0e0e0', 
              paddingBottom: '4px', 
              textAlign: 'center' 
            }}>
              Assinaturas
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '35px' }}>
              {/* CONTRATANTE / COMODATÁRIO */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #333', marginBottom: '8px', height: '45px' }}></div>
                <p style={{ margin: '0 0 2px 0', fontWeight: '700', fontSize: '11px', color: '#8B1A1A' }}>
                  {isSindico ? 'COMODATÁRIO' : 'CONTRATANTE'}
                </p>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: '600' }}>
                  {data.parceiro_nome || '[Nome do Contratante]'}
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>
                  {data.parceiro_documento || '[Documento]'}
                </p>
              </div>

              {/* CONTRATADA / COMODANTE — EXA */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #333', marginBottom: '8px', height: '45px' }}></div>
                <p style={{ margin: '0 0 2px 0', fontWeight: '700', fontSize: '11px', color: '#8B1A1A' }}>
                  {isSindico ? 'COMODANTE' : 'CONTRATADA'}
                </p>
                <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: '600' }}>
                  {companySettings.razao_social}
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>CNPJ: {companySettings.cnpj}</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#555' }}>
                  {companySettings.representante_nome}<br />
                  {companySettings.representante_cargo}<br />
                  CPF: {companySettings.representante_cpf}
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              RODAPÉ INSTITUCIONAL
          ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ marginTop: '35px', paddingTop: '12px', borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>
              Documento gerado eletronicamente por EXA Mídia — {numeroContrato}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#888' }}>
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
              <div style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Converse com a IA para preencher o contrato</p>
                <p style={{ fontSize: '14px', color: '#aaa' }}>ou clique nos campos para editar manualmente</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
