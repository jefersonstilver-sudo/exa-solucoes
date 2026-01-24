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
  if (!date) return new Date().toLocaleDateString('pt-BR');
  return new Date(date).toLocaleDateString('pt-BR');
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
        ${isEditable ? 'hover:bg-yellow-100/50 focus:bg-yellow-100 focus:ring-2 focus:ring-yellow-400/50' : ''}
        ${!value ? 'text-gray-400 italic' : ''}
        ${className}
      `}
    >
      {value || placeholder}
    </span>
  );

  const hasMinimalContent = data.parceiro_nome || data.tipo_contrato || data.objeto;

  return (
    <ScrollArea className="h-full">
      <div className="flex justify-center p-4 md:p-8 bg-gray-200 min-h-full">
        <div 
          ref={containerRef}
          className="bg-white shadow-2xl border border-gray-200 rounded-sm w-full max-w-[210mm] min-h-[297mm]"
          style={{ 
            padding: 'clamp(1.5rem, 4vw, 2.5cm)',
            fontFamily: "'Times New Roman', Georgia, serif",
            lineHeight: '1.6',
            fontSize: '12pt'
          }}
        >
          {/* Header Corporativo */}
          <div className="text-center border-b-2 border-[#9C1E1E] pb-4 mb-6">
            <div className="text-2xl font-bold text-[#9C1E1E] tracking-wider mb-1">
              INDEXA MÍDIA
            </div>
            <p className="text-[10pt] text-gray-500 mb-0.5">
              INDEXA MIDIA LTDA - CNPJ: 38.142.638/0001-30
            </p>
            <p className="text-[9pt] text-gray-400">
              Avenida Paraná, 974 - Sala 301, Centro, Foz do Iguaçu - PR, CEP 85851-180
            </p>
          </div>

          {/* Título do Contrato */}
          <h1 className="text-center font-bold text-lg mb-8 tracking-wide">
            {getTipoLabel(data.tipo_contrato)}
          </h1>

          {/* Partes */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="mb-4 text-justify">
              <strong>CONTRATADA:</strong> INDEXA MIDIA LTDA, pessoa jurídica de direito privado, 
              inscrita no CNPJ sob nº 38.142.638/0001-30, com sede na Avenida Paraná, 974 - Sala 301, 
              Centro, Foz do Iguaçu - PR, CEP 85851-180, neste ato representada por seu sócio-administrador{' '}
              <strong>Jeferson Stilver Rodrigues Encina</strong>, inscrito no CPF sob nº 055.031.279-00.
            </p>
            
            <p className="text-justify">
              <strong>CONTRATANTE:</strong>{' '}
              <EditableField 
                field="parceiro_nome" 
                value={data.parceiro_nome} 
                placeholder="[Nome do Parceiro/Empresa]"
                className="font-semibold"
              />
              , {data.parceiro_tipo_pessoa === 'PF' ? 'pessoa física, inscrita no CPF sob nº' : 'pessoa jurídica de direito privado, inscrita no CNPJ sob nº'}{' '}
              <EditableField 
                field="parceiro_documento" 
                value={data.parceiro_documento} 
                placeholder="[CNPJ/CPF]"
              />
              {data.parceiro_email && (
                <>, e-mail: {data.parceiro_email}</>
              )}
              {data.parceiro_telefone && (
                <>, telefone: {data.parceiro_telefone}</>
              )}
              .
            </p>
          </div>

          {/* Objeto */}
          <div className="mb-6">
            <h2 className="font-bold mb-2 text-[#9C1E1E]">CLÁUSULA 1ª - DO OBJETO</h2>
            <p className="text-justify">
              O presente instrumento tem por objeto:{' '}
              <EditableField 
                field="objeto" 
                value={data.objeto} 
                placeholder="[Descreva o objeto do contrato - clique para editar]"
              />
            </p>
          </div>

          {/* Valor (se houver) */}
          {(data.valor_financeiro || data.tipo_contrato === 'anunciante') && (
            <div className="mb-6">
              <h2 className="font-bold mb-2 text-[#9C1E1E]">CLÁUSULA 2ª - DO VALOR</h2>
              <p className="text-justify">
                {data.valor_financeiro ? (
                  <>Pela execução dos serviços/produtos objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor de {formatCurrency(data.valor_financeiro)}.</>
                ) : (
                  <span className="text-gray-400 italic">[Valor a ser definido]</span>
                )}
              </p>
            </div>
          )}

          {/* Prazo */}
          <div className="mb-6">
            <h2 className="font-bold mb-2 text-[#9C1E1E]">
              CLÁUSULA {data.valor_financeiro ? '3ª' : '2ª'} - DO PRAZO
            </h2>
            <p className="text-justify">
              O presente contrato terá vigência de{' '}
              <strong>{data.prazo_meses || 12} ({data.prazo_meses === 1 ? 'um' : data.prazo_meses || 'doze'}) meses</strong>, 
              a partir de {formatDate(data.data_inicio)}, podendo ser renovado mediante acordo entre as partes.
            </p>
          </div>

          {/* Obrigações das Partes */}
          {(data.obrigacoes_indexa.length > 0 || data.obrigacoes_parceiro.length > 0) && (
            <div className="mb-6">
              <h2 className="font-bold mb-2 text-[#9C1E1E]">
                CLÁUSULA {data.valor_financeiro ? '4ª' : '3ª'} - DAS OBRIGAÇÕES
              </h2>
              
              {data.obrigacoes_indexa.length > 0 && (
                <>
                  <p className="font-semibold mb-1">São obrigações da CONTRATADA:</p>
                  <ul className="list-disc pl-6 mb-3">
                    {data.obrigacoes_indexa.map((obrigacao, i) => (
                      <li key={i} className="mb-1">{obrigacao}</li>
                    ))}
                  </ul>
                </>
              )}
              
              {data.obrigacoes_parceiro.length > 0 && (
                <>
                  <p className="font-semibold mb-1">São obrigações da CONTRATANTE:</p>
                  <ul className="list-disc pl-6">
                    {data.obrigacoes_parceiro.map((obrigacao, i) => (
                      <li key={i} className="mb-1">{obrigacao}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Gatilhos Condicionais (para permutas) */}
          {data.gatilhos_condicionais.length > 0 && (
            <div className="mb-6">
              <h2 className="font-bold mb-2 text-[#9C1E1E]">CLÁUSULA ESPECIAL - DOS GATILHOS CONDICIONAIS</h2>
              <p className="mb-2 text-justify">
                As partes acordam os seguintes gatilhos condicionais para ativação de benefícios:
              </p>
              <ul className="list-disc pl-6">
                {data.gatilhos_condicionais.map((gatilho, i) => (
                  <li key={i} className="mb-2">
                    <strong>Condição:</strong> {gatilho.condicao}<br />
                    <strong>Ação:</strong> {gatilho.acao}
                    {gatilho.prazo && <><br /><strong>Prazo:</strong> {gatilho.prazo}</>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cláusulas Geradas pela IA */}
          {data.clausulas_geradas.map((clausula, i) => (
            <div key={i} className="mb-6">
              <h2 className="font-bold mb-2 text-[#9C1E1E]">
                {clausula.titulo.toUpperCase()}
              </h2>
              <p className="text-justify">{clausula.conteudo}</p>
            </div>
          ))}

          {/* Foro */}
          <div className="mb-6">
            <h2 className="font-bold mb-2 text-[#9C1E1E]">CLÁUSULA FINAL - DO FORO</h2>
            <p className="text-justify">
              Fica eleito o foro da Comarca de <strong>Foz do Iguaçu/PR</strong> para dirimir quaisquer 
              controvérsias oriundas do presente instrumento, com renúncia expressa a qualquer outro, 
              por mais privilegiado que seja.
            </p>
          </div>

          {/* Data e Local */}
          <p className="text-center my-8">
            Foz do Iguaçu/PR, {formatDate(data.data_inicio)}.
          </p>

          {/* Assinaturas */}
          <div className="flex justify-between mt-16 gap-8">
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-2 mt-16">
                <p className="font-bold">INDEXA MIDIA LTDA</p>
                <p className="text-sm">Jeferson Stilver Rodrigues Encina</p>
                <p className="text-xs text-gray-500">CPF: 055.031.279-00</p>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="border-t border-black pt-2 mt-16">
                <p className="font-bold">{data.parceiro_nome || '[CONTRATANTE]'}</p>
                <p className="text-sm">{data.parceiro_documento || '[Documento]'}</p>
              </div>
            </div>
          </div>

          {/* Empty state overlay */}
          {!hasMinimalContent && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded pointer-events-none">
              <div className="text-center text-gray-400">
                <p className="text-lg mb-2">📝</p>
                <p className="text-sm">Converse com a IA para preencher o contrato</p>
                <p className="text-xs">ou clique nos campos para editar manualmente</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
