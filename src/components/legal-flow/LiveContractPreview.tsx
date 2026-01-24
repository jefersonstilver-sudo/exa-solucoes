import React, { useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LegalFlowData, ClausulaGerada, GatilhoCondicional } from '@/hooks/useLegalFlow';

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

  // Estilo do template igual ao módulo de anunciante
  const styles = `
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    
    @media print {
      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    .contract-body { 
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.65; 
      color: #1a1a1a; 
      font-size: 10.5pt;
      background: #fff;
    }
    
    .contract-header {
      background: linear-gradient(135deg, #8B1A1A 0%, #A52020 50%, #8B1A1A 100%);
      color: white;
      padding: 20px 25px;
      text-align: center;
      border-radius: 0 0 6px 6px;
      border-bottom: 3px solid #5a0f0f;
    }
    
    .section-title {
      background: linear-gradient(90deg, #8B1A1A, #A52020);
      color: white;
      padding: 10px 15px;
      font-size: 11pt;
      font-weight: 600;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    
    .info-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
    }
    
    .info-card-title {
      font-weight: 600;
      color: #8B1A1A;
      margin-bottom: 10px;
      font-size: 10pt;
      border-bottom: 2px solid #8B1A1A;
      padding-bottom: 5px;
    }
    
    .clause-title {
      font-weight: 600;
      color: #8B1A1A;
    }
    
    .highlight-box {
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-left: 4px solid #8B1A1A;
      border-radius: 4px;
      padding: 15px;
      margin: 15px 0;
    }
  `;

  return (
    <ScrollArea className="h-full">
      <style>{styles}</style>
      <div className="flex justify-center p-4 md:p-8 bg-gray-200 min-h-full">
        <div 
          ref={containerRef}
          className="contract-body bg-white shadow-2xl border border-gray-200 rounded overflow-hidden w-full max-w-[210mm] min-h-[297mm]"
        >
          {/* Header Corporativo - Igual ao Anunciante */}
          <div className="contract-header">
            <div className="flex items-center justify-center gap-4">
              <img 
                src="/lovable-uploads/0bcfc861-e13d-455a-bfb2-3314c065a23d.png"
                alt="EXA Mídia"
                className="h-12 w-auto brightness-0 invert"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">EXA Mídia</h1>
                <p className="text-[10px] uppercase tracking-[3px] opacity-80">Mídia Indoor em Elevadores</p>
              </div>
            </div>
          </div>

          {/* Conteúdo do Contrato */}
          <div className="p-6 md:p-8">
            {/* Info da Empresa */}
            <div className="text-center border-b border-gray-200 pb-4 mb-6">
              <p className="text-[9pt] text-gray-500 font-medium">
                Indexa Midia LTDA — CNPJ: 38.142.638/0001-30
              </p>
              <p className="text-[8pt] text-gray-400 mt-1">
                Avenida Paraná, 974 – Sala 301, Centro • Foz do Iguaçu/PR • CEP 85852-000
              </p>
            </div>

            {/* Título do Contrato */}
            <div className="text-center mb-8">
              <h2 className="text-[16pt] font-semibold text-[#8B1A1A] tracking-wide">
                {getTipoLabel(data.tipo_contrato)}
              </h2>
              <p className="text-[10pt] text-gray-500 mt-2">
                Nº CTR-{Date.now().toString().slice(-8)}
              </p>
            </div>

            {/* Cards de Informação - Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Contratada */}
              <div className="info-card">
                <div className="info-card-title">CONTRATADA</div>
                <div className="space-y-1 text-[10pt]">
                  <p><span className="text-gray-500">Razão Social:</span> <strong>Indexa Midia LTDA</strong></p>
                  <p><span className="text-gray-500">CNPJ:</span> 38.142.638/0001-30</p>
                  <p><span className="text-gray-500">Representante:</span> Jeferson Stilver Rodrigues Encina</p>
                  <p><span className="text-gray-500">CPF:</span> 055.031.279-00</p>
                </div>
              </div>

              {/* Contratante */}
              <div className="info-card">
                <div className="info-card-title">CONTRATANTE</div>
                <div className="space-y-1 text-[10pt]">
                  <p>
                    <span className="text-gray-500">Nome/Razão:</span>{' '}
                    <EditableField 
                      field="parceiro_nome" 
                      value={data.parceiro_nome} 
                      placeholder="[Clique para editar]"
                      className="font-semibold"
                    />
                  </p>
                  <p>
                    <span className="text-gray-500">{data.parceiro_tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}:</span>{' '}
                    <EditableField 
                      field="parceiro_documento" 
                      value={data.parceiro_documento} 
                      placeholder="[Documento]"
                    />
                  </p>
                  {data.parceiro_email && (
                    <p><span className="text-gray-500">E-mail:</span> {data.parceiro_email}</p>
                  )}
                  {data.parceiro_telefone && (
                    <p><span className="text-gray-500">Telefone:</span> {data.parceiro_telefone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cláusula 1 - Objeto */}
            <div className="mb-6">
              <div className="section-title">CLÁUSULA 1ª — DO OBJETO</div>
              <p className="text-justify text-[10.5pt] leading-relaxed">
                O presente instrumento tem por objeto:{' '}
                <EditableField 
                  field="objeto" 
                  value={data.objeto} 
                  placeholder="[Descreva o objeto do contrato - clique para editar]"
                />
              </p>
            </div>

            {/* Cláusula 2 - Valor (se houver) */}
            {(data.valor_financeiro || data.tipo_contrato === 'anunciante') && (
              <div className="mb-6">
                <div className="section-title">CLÁUSULA 2ª — DO VALOR</div>
                <div className="highlight-box">
                  {data.valor_financeiro ? (
                    <p className="text-[10.5pt]">
                      Pela execução dos serviços objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor total de{' '}
                      <strong className="text-[#8B1A1A]">{formatCurrency(data.valor_financeiro)}</strong>.
                    </p>
                  ) : (
                    <p className="text-gray-400 italic text-[10.5pt]">[Valor a ser definido]</p>
                  )}
                </div>
              </div>
            )}

            {/* Cláusula 3 - Prazo */}
            <div className="mb-6">
              <div className="section-title">
                CLÁUSULA {data.valor_financeiro ? '3ª' : '2ª'} — DO PRAZO E VIGÊNCIA
              </div>
              <p className="text-justify text-[10.5pt] leading-relaxed">
                O presente contrato terá vigência de{' '}
                <strong>{data.prazo_meses || 12} ({data.prazo_meses === 1 ? 'um' : data.prazo_meses || 'doze'}) meses</strong>, 
                a partir de <strong>{formatDate(data.data_inicio)}</strong>, podendo ser renovado mediante 
                termo aditivo assinado pelas partes.
              </p>
            </div>

            {/* Obrigações das Partes */}
            {(data.obrigacoes_indexa.length > 0 || data.obrigacoes_parceiro.length > 0) && (
              <div className="mb-6">
                <div className="section-title">
                  CLÁUSULA {data.valor_financeiro ? '4ª' : '3ª'} — DAS OBRIGAÇÕES
                </div>
                
                {data.obrigacoes_indexa.length > 0 && (
                  <div className="mb-4">
                    <p className="font-semibold text-[10.5pt] mb-2">São obrigações da CONTRATADA (EXA Mídia):</p>
                    <ul className="list-disc pl-6 space-y-1 text-[10.5pt]">
                      {data.obrigacoes_indexa.map((obrigacao, i) => (
                        <li key={i}>{obrigacao}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.obrigacoes_parceiro.length > 0 && (
                  <div>
                    <p className="font-semibold text-[10.5pt] mb-2">São obrigações da CONTRATANTE:</p>
                    <ul className="list-disc pl-6 space-y-1 text-[10.5pt]">
                      {data.obrigacoes_parceiro.map((obrigacao, i) => (
                        <li key={i}>{obrigacao}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Gatilhos Condicionais (para permutas) */}
            {data.gatilhos_condicionais.length > 0 && (
              <div className="mb-6">
                <div className="section-title">CLÁUSULA ESPECIAL — GATILHOS CONDICIONAIS</div>
                <div className="highlight-box">
                  <p className="mb-3 text-[10.5pt]">
                    As partes acordam os seguintes gatilhos condicionais para ativação de benefícios:
                  </p>
                  <ul className="space-y-3">
                    {data.gatilhos_condicionais.map((gatilho, i) => (
                      <li key={i} className="text-[10.5pt] border-l-2 border-[#8B1A1A] pl-3">
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
              <div key={i} className="mb-6">
                <div className="section-title">
                  {clausula.titulo.toUpperCase()}
                </div>
                <p className="text-justify text-[10.5pt] leading-relaxed">{clausula.conteudo}</p>
              </div>
            ))}

            {/* Foro */}
            <div className="mb-8">
              <div className="section-title">CLÁUSULA FINAL — DO FORO</div>
              <p className="text-justify text-[10.5pt] leading-relaxed">
                Fica eleito o foro da Comarca de <strong>Foz do Iguaçu/PR</strong> para dirimir quaisquer 
                controvérsias oriundas do presente instrumento, com renúncia expressa a qualquer outro, 
                por mais privilegiado que seja.
              </p>
            </div>

            {/* Data e Local */}
            <p className="text-center my-10 text-[10.5pt] italic text-gray-600">
              Foz do Iguaçu/PR, {formatDate(data.data_inicio)}.
            </p>

            {/* Assinaturas */}
            <div className="grid grid-cols-2 gap-10 mt-16">
              <div className="text-center">
                <div className="border-t border-gray-800 pt-3 mt-20">
                  <p className="font-semibold text-[#8B1A1A]">EXA Mídia</p>
                  <p className="text-[9pt] text-gray-700">Jeferson Stilver Rodrigues Encina</p>
                  <p className="text-[8pt] text-gray-500">Sócio-Administrador</p>
                  <p className="text-[8pt] text-gray-400">CPF: 055.031.279-00</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-3 mt-20">
                  <p className="font-semibold text-gray-800">{data.parceiro_nome || '[CONTRATANTE]'}</p>
                  <p className="text-[9pt] text-gray-600">{data.parceiro_documento || '[Documento]'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Empty state overlay */}
          {!hasMinimalContent && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded pointer-events-none">
              <div className="text-center text-gray-400 p-8">
                <div className="text-5xl mb-4">📝</div>
                <p className="text-base font-medium mb-2">Converse com a IA para preencher o contrato</p>
                <p className="text-sm text-gray-400">ou clique nos campos amarelos para editar manualmente</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
