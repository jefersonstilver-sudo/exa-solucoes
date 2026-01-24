import React, { useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LegalFlowData, ClausulaGerada, GatilhoCondicional } from '@/hooks/useLegalFlow';

// Logo oficial EXA
const EXA_LOGO_URL = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Exa%20sozinha.png";

interface LiveContractPreviewProps {
  data: LegalFlowData;
  onUpdate: (updates: Partial<LegalFlowData>) => void;
  isEditable?: boolean;
  onManualEdit?: (field: string, value: string) => void;
}

const getTipoLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    'termo_aceite': 'TERMO DE ACEITE E AUTORIZAÇÃO',
    'comodato': 'CONTRATO DE COMODATO',
    'anunciante': 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MÍDIA',
    'parceria_clt': 'CONTRATO DE PARCERIA (CLT)',
    'parceria_pj': 'CONTRATO DE PARCERIA COMERCIAL (PJ)',
    'permuta': 'CONTRATO DE PERMUTA DE MÍDIA',
  };
  return labels[tipo] || 'CONTRATO';
};

const formatDate = (date?: string) => {
  if (!date) return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatCurrency = (value: number | null) => {
  if (!value) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function LiveContractPreview({ 
  data, 
  onUpdate, 
  isEditable = true,
  onManualEdit 
}: LiveContractPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContentEdit = useCallback((field: keyof LegalFlowData, value: string) => {
    onUpdate({ [field]: value } as Partial<LegalFlowData>);
    onManualEdit?.(field, value);
  }, [onUpdate, onManualEdit]);

  const EditableField = ({ 
    field, 
    value, 
    placeholder,
    className = ''
  }: { 
    field: keyof LegalFlowData; 
    value: string; 
    placeholder: string;
    className?: string;
  }) => (
    <span
      contentEditable={isEditable}
      suppressContentEditableWarning
      onBlur={(e) => handleContentEdit(field, e.currentTarget.textContent || '')}
      className={`
        outline-none transition-all duration-200 rounded px-0.5
        ${isEditable ? 'hover:bg-amber-100/50 focus:bg-amber-100 focus:ring-2 focus:ring-amber-400/50' : ''}
        ${!value ? 'text-gray-400 italic' : ''}
        ${className}
      `}
    >
      {value || placeholder}
    </span>
  );

  const hasMinimalContent = data.parceiro_nome || data.tipo_contrato || data.objeto;

  // Estilo EXATO do template de anunciante (ContractPreview.tsx)
  const styles = `
    @page {
      size: A4;
      margin: 0;
    }
    
    @media print {
      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    .contract-document { 
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.7; 
      color: #1a1a1a; 
      font-size: 11pt;
      background: #fff;
    }
    
    .contract-header-minimal {
      text-align: center;
      padding: 25px 22mm 20px 22mm;
      border-bottom: 3px solid #8B1A1A;
    }
    
    .section-title-clean {
      font-weight: 700;
      color: #8B1A1A;
      font-size: 11pt;
      margin: 24px 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .info-box {
      background: #fafafa;
      border: 1px solid #e5e5e5;
      border-left: 3px solid #8B1A1A;
      border-radius: 4px;
      padding: 16px;
    }
    
    .info-box-title {
      font-weight: 700;
      color: #8B1A1A;
      margin-bottom: 10px;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .clause-content {
      text-align: justify;
      font-size: 10.5pt;
      line-height: 1.75;
      margin-bottom: 20px;
    }
    
    .highlight-value {
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-left: 3px solid #8B1A1A;
      border-radius: 4px;
      padding: 14px 18px;
      margin: 12px 0;
    }
    
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 70px;
      padding-top: 10px;
      text-align: center;
    }
  `;

  return (
    <ScrollArea className="h-full">
      <style>{styles}</style>
      <div className="flex justify-center p-4 md:p-8 bg-gray-200 min-h-full">
        <div 
          ref={containerRef}
          className="contract-document bg-white shadow-2xl border border-gray-200 overflow-hidden w-full max-w-[210mm] min-h-[297mm]"
        >
          {/* Header Minimalista - IGUAL ao ContractPreview.tsx */}
          <div className="contract-header-minimal">
            <img 
              src={EXA_LOGO_URL} 
              alt="EXA Mídia" 
              style={{ height: '55px', marginBottom: '14px' }}
              crossOrigin="anonymous"
              onError={(e) => {
                // Fallback para texto se logo não carregar
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 style={{ 
              fontSize: '15px', 
              fontWeight: '700', 
              color: '#8B1A1A', 
              margin: '0 0 6px 0',
              letterSpacing: '0.8px',
              textTransform: 'uppercase'
            }}>
              {getTipoLabel(data.tipo_contrato)}
            </h1>
            <p style={{ fontSize: '12px', color: '#666', margin: 0, fontWeight: '500' }}>
              Contrato nº CTR-{new Date().getFullYear()}-{Date.now().toString().slice(-4)}
            </p>
          </div>

          {/* Conteúdo do Contrato */}
          <div style={{ padding: '25px 22mm' }}>

            {/* Cards de Informação - Grid IGUAL ao Anunciante */}
            <div className="info-grid">
              {/* Contratada */}
              <div className="info-box">
                <div className="info-box-title">Contratada</div>
                <div style={{ fontSize: '10pt', lineHeight: '1.6' }}>
                  <p><strong>Indexa Midia LTDA</strong></p>
                  <p style={{ color: '#666' }}>CNPJ: 38.142.638/0001-30</p>
                  <p style={{ color: '#666', marginTop: '6px' }}>Representante Legal:</p>
                  <p><strong>Jeferson Stilver Rodrigues Encina</strong></p>
                  <p style={{ color: '#666' }}>CPF: 055.031.279-00</p>
                </div>
              </div>

              {/* Contratante */}
              <div className="info-box">
                <div className="info-box-title">Contratante</div>
                <div style={{ fontSize: '10pt', lineHeight: '1.6' }}>
                  <p>
                    <EditableField 
                      field="parceiro_nome" 
                      value={data.parceiro_nome} 
                      placeholder="[Nome/Razão Social]"
                      className="font-semibold"
                    />
                  </p>
                  <p style={{ color: '#666' }}>
                    {data.parceiro_tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}:{' '}
                    <EditableField 
                      field="parceiro_documento" 
                      value={data.parceiro_documento} 
                      placeholder="[Documento]"
                    />
                  </p>
                  {data.parceiro_email && (
                    <p style={{ color: '#666', marginTop: '6px' }}>E-mail: {data.parceiro_email}</p>
                  )}
                  {data.parceiro_telefone && (
                    <p style={{ color: '#666' }}>Tel: {data.parceiro_telefone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cláusula 1 - Objeto */}
            <div style={{ marginBottom: '24px' }}>
              <h3 className="section-title-clean">Cláusula 1ª — Do Objeto</h3>
              <p className="clause-content">
                O presente instrumento tem por objeto:{' '}
                <EditableField 
                  field="objeto" 
                  value={data.objeto} 
                  placeholder="[Descreva o objeto do contrato]"
                />
              </p>
            </div>

            {/* Cláusula 2 - Valor (se houver) */}
            {(data.valor_financeiro || data.tipo_contrato === 'anunciante') && (
              <div style={{ marginBottom: '24px' }}>
                <h3 className="section-title-clean">Cláusula 2ª — Do Valor</h3>
                <div className="highlight-value">
                  {data.valor_financeiro ? (
                    <p style={{ fontSize: '10.5pt', margin: 0 }}>
                      Pela execução dos serviços, a <strong>CONTRATANTE</strong> pagará à <strong>CONTRATADA</strong> o valor de{' '}
                      <strong style={{ color: '#8B1A1A' }}>{formatCurrency(data.valor_financeiro)}</strong>.
                    </p>
                  ) : (
                    <p style={{ color: '#999', fontStyle: 'italic', fontSize: '10.5pt', margin: 0 }}>[Valor a ser definido]</p>
                  )}
                </div>
              </div>
            )}

            {/* Cláusula 3 - Prazo */}
            <div style={{ marginBottom: '24px' }}>
              <h3 className="section-title-clean">
                Cláusula {data.valor_financeiro ? '3ª' : '2ª'} — Do Prazo e Vigência
              </h3>
              <p className="clause-content">
                O presente contrato terá vigência de{' '}
                <strong>{data.prazo_meses || 12} ({data.prazo_meses === 1 ? 'um' : data.prazo_meses || 'doze'}) meses</strong>, 
                a partir de <strong>{formatDate(data.data_inicio)}</strong>, podendo ser renovado mediante 
                termo aditivo assinado pelas partes.
              </p>
            </div>

            {/* Obrigações das Partes */}
            {(data.obrigacoes_indexa.length > 0 || data.obrigacoes_parceiro.length > 0) && (
              <div style={{ marginBottom: '24px' }}>
                <h3 className="section-title-clean">
                  Cláusula {data.valor_financeiro ? '4ª' : '3ª'} — Das Obrigações
                </h3>
                
                {data.obrigacoes_indexa.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontWeight: '600', fontSize: '10.5pt', marginBottom: '8px' }}>São obrigações da CONTRATADA (EXA Mídia):</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '24px', fontSize: '10.5pt', lineHeight: '1.7' }}>
                      {data.obrigacoes_indexa.map((obrigacao, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{obrigacao}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.obrigacoes_parceiro.length > 0 && (
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '10.5pt', marginBottom: '8px' }}>São obrigações da CONTRATANTE:</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '24px', fontSize: '10.5pt', lineHeight: '1.7' }}>
                      {data.obrigacoes_parceiro.map((obrigacao, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{obrigacao}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Gatilhos Condicionais (para permutas) */}
            {data.gatilhos_condicionais.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 className="section-title-clean">Cláusula Especial — Gatilhos Condicionais</h3>
                <div className="highlight-value">
                  <p style={{ marginBottom: '12px', fontSize: '10.5pt' }}>
                    As partes acordam os seguintes gatilhos condicionais para ativação de benefícios:
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {data.gatilhos_condicionais.map((gatilho, i) => (
                      <li key={i} style={{ 
                        fontSize: '10.5pt', 
                        borderLeft: '2px solid #8B1A1A', 
                        paddingLeft: '12px',
                        marginBottom: '12px' 
                      }}>
                        <strong>Condição:</strong> {gatilho.condicao}<br />
                        <strong>Ação:</strong> {gatilho.acao}
                        {gatilho.prazo && <><br /><strong>Prazo:</strong> {gatilho.prazo}</>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Cláusulas Geradas pela IA */}
            {data.clausulas_geradas.map((clausula, i) => (
              <div key={i} style={{ marginBottom: '24px' }}>
                <h3 className="section-title-clean">
                  {clausula.titulo}
                </h3>
                <p className="clause-content">{clausula.conteudo}</p>
              </div>
            ))}

            {/* Foro */}
            <div style={{ marginBottom: '32px' }}>
              <h3 className="section-title-clean">Cláusula Final — Do Foro</h3>
              <p className="clause-content">
                Fica eleito o foro da Comarca de <strong>Foz do Iguaçu/PR</strong> para dirimir quaisquer 
                controvérsias oriundas do presente instrumento, com renúncia expressa a qualquer outro, 
                por mais privilegiado que seja.
              </p>
            </div>

            {/* Data e Local */}
            <p style={{ textAlign: 'center', margin: '40px 0', fontSize: '10.5pt', fontStyle: 'italic', color: '#666' }}>
              Foz do Iguaçu/PR, {formatDate(data.data_inicio)}.
            </p>

            {/* Assinaturas - Estilo do Anunciante */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '60px' }}>
              <div className="signature-line">
                <p style={{ fontWeight: '600', color: '#8B1A1A', margin: '0 0 4px 0' }}>EXA Mídia</p>
                <p style={{ fontSize: '9pt', color: '#444', margin: '0 0 2px 0' }}>Jeferson Stilver Rodrigues Encina</p>
                <p style={{ fontSize: '8pt', color: '#666', margin: '0 0 2px 0' }}>Sócio-Administrador</p>
                <p style={{ fontSize: '8pt', color: '#888', margin: 0 }}>CPF: 055.031.279-00</p>
              </div>
              <div className="signature-line">
                <p style={{ fontWeight: '600', color: '#333', margin: '0 0 4px 0' }}>{data.parceiro_nome || '[CONTRATANTE]'}</p>
                <p style={{ fontSize: '9pt', color: '#666', margin: 0 }}>{data.parceiro_documento || '[Documento]'}</p>
              </div>
            </div>
          </div>

          {/* Empty state overlay */}
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
