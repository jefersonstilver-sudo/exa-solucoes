import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContractPreviewProps {
  data: {
    tipo_contrato: string;
    numero_contrato?: string;
    cliente_nome: string;
    cliente_email?: string;
    cliente_cnpj?: string;
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
    total_paineis?: number;
    tipo_produto?: string;
  };
  onEdit?: () => void;
}

const ContractPreview: React.FC<ContractPreviewProps> = ({ data, onEdit }) => {
  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDateExtended = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getPlanoNome = (meses: number | undefined) => {
    switch (meses) {
      case 1: return 'Mensal';
      case 3: return 'Trimestral';
      case 6: return 'Semestral';
      case 12: return 'Anual';
      default: return `${meses || 1} meses`;
    }
  };

  const getMetodoPagamentoNome = (metodo: string | undefined) => {
    switch (metodo) {
      case 'pix_avista': return 'PIX À VISTA';
      case 'pix_fidelidade': return 'PIX FIDELIDADE (parcelado)';
      case 'boleto_fidelidade': return 'BOLETO FIDELIDADE (parcelado)';
      case 'cartao': return 'CARTÃO DE CRÉDITO';
      case 'custom': return 'CONDIÇÃO PERSONALIZADA';
      default: return (metodo || 'A DEFINIR').replace(/_/g, ' ').toUpperCase();
    }
  };

  const getNumeroExtenso = (num: number) => {
    const extenso: Record<number, string> = {
      1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco',
      6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez',
      11: 'onze', 12: 'doze'
    };
    return extenso[num] || String(num);
  };

  const listaPredios = Array.isArray(data.lista_predios) ? data.lista_predios : [];
  const totalPaineis = data.total_paineis || listaPredios.reduce((acc, p) => acc + (p.quantidade_telas || 1), 0);
  const tipoProduto = data.tipo_produto || 'horizontal';
  const isVerticalPremium = tipoProduto === 'vertical_premium';

  const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Calcular data fim do contrato
  const calcularDataFim = () => {
    if (!data.data_inicio) return '';
    try {
      const inicio = new Date(data.data_inicio + 'T00:00:00');
      const fim = new Date(inicio);
      fim.setMonth(fim.getMonth() + (data.plano_meses || 1));
      return format(fim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return '';
    }
  };

  // Logo EXA em SVG inline (funciona em qualquer contexto)
  const ExaLogo = () => (
    <div className="flex items-center gap-3">
      <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#f0f0f0', stopOpacity: 1}} />
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="90" height="90" rx="15" fill="url(#logoGrad)" stroke="#8B1A1A" strokeWidth="3"/>
        <text x="50" y="65" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="38" fontWeight="900" fill="#8B1A1A">EXA</text>
      </svg>
      <div>
        <h1 className="text-xl font-bold tracking-wide">EXA MÍDIA</h1>
        <p className="text-red-100 text-xs mt-0.5">Soluções Digitais em Elevadores</p>
      </div>
    </div>
  );

  // Contrato de Síndico
  if (data.tipo_contrato === 'sindico') {
    return (
      <div className="p-8 bg-white text-gray-900 font-serif text-sm leading-relaxed">
        {/* Header EXA com Logo */}
        <div className="bg-gradient-to-r from-[#8B1A1A] to-[#A52020] text-white p-6 -m-8 mb-8 rounded-t-lg">
          <div className="flex items-center justify-between">
            <ExaLogo />
            <div className="text-right">
              <p className="text-sm font-semibold">TERMO DE CESSÃO DE ESPAÇO</p>
              {data.numero_contrato && (
                <p className="text-xs text-red-100 mt-1">Nº {data.numero_contrato}</p>
              )}
            </div>
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-lg font-bold uppercase tracking-wide">
            Termo de Cessão de Espaço para Publicidade Digital
          </h1>
        </div>

        {/* Partes */}
        <div className="mb-6">
          <p className="mb-4">
            <strong>CEDENTE:</strong> {data.cliente_razao_social || data.cliente_nome}, 
            {data.cliente_cnpj && ` inscrito no CNPJ sob nº ${data.cliente_cnpj},`}
            representado por <strong>{data.cliente_nome}</strong>
            {data.cliente_cargo && ` (${data.cliente_cargo})`}, doravante denominado "CEDENTE".
          </p>
          <p>
            <strong>CESSIONÁRIA:</strong> EXA SOLUÇÕES DIGITAIS LTDA, pessoa jurídica de direito privado, 
            inscrita no CNPJ sob nº 62.878.193/0001-35, com sede na Av. Paraná, nº 974, Sala 301, 
            Centro, Foz do Iguaçu - PR, CEP 85852-000, doravante denominada "CESSIONÁRIA".
          </p>
        </div>

        {/* Cláusulas */}
        <div className="space-y-4">
          <div>
            <h2 className="font-bold">CLÁUSULA 1ª - DO OBJETO</h2>
            <p>
              1.1. O presente termo tem por objeto a cessão gratuita de espaço no(s) elevador(es) 
              do condomínio para instalação de painéis digitais da EXA MÍDIA, destinados à 
              veiculação de conteúdo informativo e publicitário.
            </p>
          </div>

          <div>
            <h2 className="font-bold">CLÁUSULA 2ª - DO LOCAL</h2>
            <p>2.1. O espaço cedido localiza-se em:</p>
            {listaPredios.length > 0 && (
              <ul className="list-disc ml-6 mt-2">
                {listaPredios.map((predio, i) => (
                  <li key={i}>
                    {predio.nome || predio.building_name} - {predio.bairro}
                    {predio.endereco && ` (${predio.endereco})`}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2">2.2. Quantidade de telas: {totalPaineis} unidade(s).</p>
          </div>

          <div>
            <h2 className="font-bold">CLÁUSULA 3ª - DAS OBRIGAÇÕES DA CESSIONÁRIA</h2>
            <p>3.1. A CESSIONÁRIA compromete-se a:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Fornecer e instalar os equipamentos sem qualquer custo ao CEDENTE;</li>
              <li>Realizar manutenção preventiva e corretiva dos equipamentos;</li>
              <li>Disponibilizar conteúdo informativo de utilidade pública;</li>
              <li>Respeitar as normas do condomínio.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold">CLÁUSULA 4ª - DA VIGÊNCIA</h2>
            <p>
              4.1. O presente termo entra em vigor na data de sua assinatura e terá prazo 
              indeterminado, podendo ser rescindido por qualquer das partes mediante 
              comunicação prévia de 30 (trinta) dias.
            </p>
          </div>

          {data.clausulas_especiais && (
            <div>
              <h2 className="font-bold">CLÁUSULA 5ª - CONDIÇÕES ESPECIAIS</h2>
              <p>{data.clausulas_especiais}</p>
            </div>
          )}
        </div>

        {/* Assinaturas */}
        <div className="mt-12">
          <p className="text-center mb-8">
            Foz do Iguaçu - PR, {dataAtual}.
          </p>
          <div className="grid grid-cols-2 gap-8 mt-16">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="font-bold">{data.cliente_nome}</p>
                <p className="text-sm text-gray-600">CEDENTE</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="font-bold">EXA SOLUÇÕES DIGITAIS LTDA</p>
                <p className="text-sm text-gray-600">CESSIONÁRIA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Contrato de Anunciante
  return (
    <div className="p-8 bg-white text-gray-900 font-serif text-sm leading-relaxed">
      {/* Header EXA Profissional com Logo */}
      <div className="bg-gradient-to-r from-[#8B1A1A] to-[#A52020] text-white p-6 -m-8 mb-8 rounded-t-lg">
        <div className="flex items-center justify-between">
          <ExaLogo />
          <div className="text-right">
            <p className="text-sm font-semibold">CONTRATO DE PUBLICIDADE</p>
            {data.numero_contrato && (
              <p className="text-xs text-red-100 mt-1">Nº {data.numero_contrato}</p>
            )}
            {isVerticalPremium && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-white/20 text-white text-[10px] font-medium rounded">
                VERTICAL PREMIUM
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Título */}
      <div className="text-center mb-8">
        <h1 className="text-lg font-bold uppercase tracking-wide">
          Contrato de Publicidade em Mídia Digital
        </h1>
        {isVerticalPremium && (
          <p className="text-purple-700 text-sm font-semibold mt-1">
            Modalidade: Vertical Premium - Tela Cheia
          </p>
        )}
      </div>

      {/* Partes */}
      <div className="mb-6">
        <p className="mb-4">
          <strong>CONTRATANTE:</strong> {data.cliente_razao_social || data.cliente_nome}
          {data.cliente_segmento && ` (${data.cliente_segmento})`}, 
          {data.cliente_endereco ? ` com sede em ${data.cliente_endereco},` : ` com sede em ${data.cliente_cidade || 'Foz do Iguaçu'},`}
          {data.cliente_cnpj && ` inscrita no CNPJ sob o nº ${data.cliente_cnpj},`}
          neste ato representada por seu representante legal
          {data.cliente_nome && `, Sr(a). ${data.cliente_nome}`}
          {data.cliente_cargo && ` (${data.cliente_cargo})`}, 
          doravante denominada "CONTRATANTE".
        </p>
        <p>
          <strong>CONTRATADA:</strong> EXA SOLUÇÕES DIGITAIS LTDA, pessoa jurídica de direito privado, 
          inscrita no CNPJ sob nº 62.878.193/0001-35, com sede na Av. Paraná, nº 974, Sala 301, 
          Centro, Foz do Iguaçu - PR, CEP 85852-000, doravante denominada "CONTRATADA".
        </p>
      </div>

      {/* Cláusulas */}
      <div className="space-y-4">
        <div>
          <h2 className="font-bold">CLÁUSULA 1ª - DO OBJETO</h2>
          {isVerticalPremium ? (
            <p>
              1.1. O presente contrato tem por objeto a veiculação de anúncio publicitário em 
              vídeo vertical com duração de <strong>10 (dez) segundos</strong>, no formato 
              <strong> Vertical Premium</strong>, exibido em <strong>tela cheia a cada 50 segundos</strong>, 
              nos painéis digitais da EXA MÍDIA, localizados em prédios residenciais da cidade de 
              Foz do Iguaçu - PR.
            </p>
          ) : (
            <p>
              1.1. O presente contrato tem por objeto a veiculação de anúncios publicitários em 
              vídeo com duração de até <strong>15 (quinze) segundos</strong>, fornecidos pela CONTRATANTE, nos 
              painéis digitais da EXA MÍDIA, localizados em prédios residenciais da cidade de 
              Foz do Iguaçu - PR.
            </p>
          )}
        </div>

        {/* VIGÊNCIA DO CONTRATO */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <h2 className="font-bold">CLÁUSULA 2ª - DO PRAZO E VIGÊNCIA</h2>
          <p className="mt-2">
            2.1. O presente contrato terá vigência de <strong>{data.plano_meses || 1} ({getNumeroExtenso(data.plano_meses || 1)}) {(data.plano_meses || 1) === 1 ? 'mês' : 'meses'}</strong>, 
            correspondente ao plano <strong>{getPlanoNome(data.plano_meses)}</strong>.
          </p>
          <p className="mt-2">
            2.2. <strong>Período de exibição:</strong>
          </p>
          <ul className="list-disc ml-6 mt-1">
            <li>Data de início: <strong>{formatDateExtended(data.data_inicio) || 'A definir após assinatura'}</strong></li>
            <li>Data de término: <strong>{calcularDataFim() || 'A definir após assinatura'}</strong></li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 3ª - DOS LOCAIS CONTRATADOS</h2>
          {isVerticalPremium ? (
            <>
              <p>3.1. A modalidade <strong>Vertical Premium</strong> abrange <strong>TODOS os {listaPredios.length} prédios</strong> da rede EXA MÍDIA:</p>
              {listaPredios.length > 0 && (
                <div className="mt-2 bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="text-xs text-purple-700 font-medium mb-2">Prédios incluídos ({listaPredios.length} unidades):</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {listaPredios.map((predio, i) => (
                      <span key={i} className="text-purple-800">
                        • {predio.nome || predio.building_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p>3.1. A contratação abrange {totalPaineis} tela(s) nos seguintes edifícios:</p>
              {listaPredios.length > 0 && (
                <table className="w-full mt-2 border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left">Edifício</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Bairro</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Telas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaPredios.map((predio, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 px-3 py-2">{predio.nome || predio.building_name}</td>
                        <td className="border border-gray-300 px-3 py-2">{predio.bairro}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{predio.quantidade_telas || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* CLÁUSULA DE VALOR E PAGAMENTO - DETALHADA */}
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <h2 className="font-bold">CLÁUSULA 4ª - DO VALOR E FORMA DE PAGAMENTO</h2>
          
          <p className="mt-2">
            4.1. <strong>Valor Total do Contrato:</strong> {formatCurrency(data.valor_total)}
          </p>
          
          {/* Só mostrar valor mensal se NÃO for pagamento personalizado */}
          {data.metodo_pagamento !== 'custom' && data.valor_mensal && data.valor_mensal > 0 && (
            <p className="mt-1">
              4.2. <strong>Valor Mensal:</strong> {formatCurrency(data.valor_mensal)}
            </p>
          )}
          
          <p className="mt-2">
            4.{data.metodo_pagamento === 'custom' ? '2' : '3'}. <strong>Forma de Pagamento:</strong> {getMetodoPagamentoNome(data.metodo_pagamento)}
          </p>

          {/* Parcelas detalhadas */}
          {data.metodo_pagamento === 'custom' && data.parcelas && data.parcelas.length > 0 ? (
            <div className="mt-3">
              <p className="font-semibold text-green-800">4.4. Condição de Pagamento Personalizada:</p>
              <table className="w-full mt-2 text-sm border border-green-300">
                <thead>
                  <tr className="bg-green-100">
                    <th className="border border-green-300 px-2 py-1 text-left">Parcela</th>
                    <th className="border border-green-300 px-2 py-1 text-left">Vencimento</th>
                    <th className="border border-green-300 px-2 py-1 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.parcelas.map((parcela: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-green-300 px-2 py-1">{parcela.installment || idx + 1}ª parcela</td>
                      <td className="border border-green-300 px-2 py-1">{formatDateExtended(parcela.due_date)}</td>
                      <td className="border border-green-300 px-2 py-1 text-right font-medium">{formatCurrency(Number(parcela.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : data.metodo_pagamento === 'pix_avista' ? (
            <div className="mt-3">
              <p className="font-semibold text-green-800">4.4. Pagamento à Vista via PIX:</p>
              <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded p-3">
                <p className="text-sm font-medium text-emerald-800">💰 PAGAMENTO ÚNICO</p>
                <p className="mt-1 text-sm">
                  O pagamento deverá ser realizado integralmente via <strong>PIX</strong> no valor de <strong>{formatCurrency(data.valor_total)}</strong>, 
                  em parcela única, antes do início da exibição.
                </p>
              </div>
            </div>
          ) : data.metodo_pagamento === 'cartao' ? (
            <div className="mt-3">
              <p className="font-semibold text-green-800">4.4. Pagamento via Cartão de Crédito:</p>
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm font-medium text-blue-800">💳 CARTÃO DE CRÉDITO</p>
                <p className="mt-1 text-sm">
                  O pagamento será processado via cartão de crédito no valor total de <strong>{formatCurrency(data.valor_total)}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <p className="font-semibold text-green-800">4.4. Condição de Pagamento Parcelada ({data.metodo_pagamento === 'pix_fidelidade' ? 'PIX' : 'Boleto'}):</p>
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-sm font-medium text-amber-800">
                  {data.metodo_pagamento === 'pix_fidelidade' ? '📱 PIX FIDELIDADE' : '📄 BOLETO FIDELIDADE'}
                </p>
                <p className="mt-1 text-sm">
                  O pagamento será realizado em <strong>{data.plano_meses || 1} ({getNumeroExtenso(data.plano_meses || 1)}) parcela(s)</strong> de <strong>{formatCurrency(data.valor_mensal)}</strong>, 
                  com vencimento no <strong>dia {data.dia_vencimento || 10}</strong> de cada mês.
                </p>
              </div>
              
              {/* Tabela de TODAS as parcelas */}
              {data.data_inicio && data.plano_meses && data.plano_meses > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-green-800 mb-2">📋 Cronograma de Parcelas:</p>
                  <table className="w-full text-sm border border-green-300">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="border border-green-300 px-2 py-1 text-left">Parcela</th>
                        <th className="border border-green-300 px-2 py-1 text-left">Vencimento</th>
                        <th className="border border-green-300 px-2 py-1 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: data.plano_meses }, (_, idx) => {
                        const inicio = new Date(data.data_inicio + 'T00:00:00');
                        const dataVencimento = new Date(inicio.getFullYear(), inicio.getMonth() + idx, data.dia_vencimento || 10);
                        if (idx === 0 && dataVencimento < inicio) {
                          dataVencimento.setMonth(dataVencimento.getMonth() + 1);
                        }
                        return (
                          <tr key={idx} className={idx === 0 ? 'bg-green-50' : ''}>
                            <td className="border border-green-300 px-2 py-1">
                              {idx + 1}ª parcela {idx === 0 && <span className="text-green-600 text-xs">(próxima)</span>}
                            </td>
                            <td className="border border-green-300 px-2 py-1">
                              {format(dataVencimento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </td>
                            <td className="border border-green-300 px-2 py-1 text-right font-medium">
                              {formatCurrency(data.valor_mensal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-green-200 font-bold">
                        <td colSpan={2} className="border border-green-300 px-2 py-1 text-right">TOTAL:</td>
                        <td className="border border-green-300 px-2 py-1 text-right">{formatCurrency(data.valor_total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
          
          <p className="mt-3 text-sm">
            4.5. Após 10 (dez) dias de atraso no pagamento, a exibição será automaticamente 
            suspensa até a regularização, sem prejuízo da cobrança dos valores devidos.
          </p>
          <p className="text-sm">
            4.6. Multa por atraso: 2% (dois por cento) sobre o valor da parcela, acrescido de 
            juros de 1% (um por cento) ao mês, calculados pro rata die.
          </p>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 5ª - ENTREGA, FREQUÊNCIA E SLA</h2>
          {isVerticalPremium ? (
            <>
              <p>
                5.1. Exibições estimadas: <strong>tela cheia a cada 50 segundos</strong>, 24 horas por dia, 7 dias por semana.
              </p>
              <p className="mt-2">
                5.2. <strong>Especificações técnicas obrigatórias:</strong>
              </p>
              <ul className="list-disc ml-6 mt-2">
                <li>Formato: <strong>MP4 (H.264)</strong></li>
                <li>Resolução: <strong>1080x1920 (vertical)</strong></li>
                <li>Duração: <strong>10 segundos</strong></li>
                <li>Áudio: Sem áudio</li>
              </ul>
            </>
          ) : (
            <>
              <p>
                5.1. Exibições estimadas: <strong>245 exibições por painel/dia</strong> (média). 
                Relatório mensal será gerado e disponibilizado no painel administrativo.
              </p>
              <p className="mt-2">
                5.2. <strong>Especificações técnicas obrigatórias:</strong>
              </p>
              <ul className="list-disc ml-6 mt-2">
                <li>Formato: <strong>MP4 (H.264)</strong></li>
                <li>Resolução: <strong>1920x1080 (horizontal)</strong></li>
                <li>Duração: <strong>até 15 segundos</strong></li>
                <li>Áudio: Sem áudio</li>
              </ul>
            </>
          )}
          <p className="mt-2">
            5.3. <strong>SLA operacional:</strong> disponibilidade média mínima de 90% da rede. 
            Falhas técnicas imputáveis à EXA serão tratadas em até 72 horas úteis.
          </p>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 6ª - RESPONSABILIDADES</h2>
          <p>6.1. <strong>Responsabilidades da EXA:</strong></p>
          <ul className="list-disc ml-6 mt-1">
            <li>Operação, manutenção e monitoramento dos painéis;</li>
            <li>Backup de logs e emissão de relatórios;</li>
            <li>Suporte técnico e assistência.</li>
          </ul>
          <p className="mt-2">6.2. <strong>Responsabilidades do CONTRATANTE:</strong></p>
          <ul className="list-disc ml-6 mt-1">
            <li>Envio de material em conformidade com especificações;</li>
            <li>Garantia de direitos autorais sobre o conteúdo;</li>
            <li>Pagamento em dia e cooperação em auditorias técnicas.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 7ª - DIREITOS AUTORAIS E CESSÃO DE IMAGEM</h2>
          <p>
            7.1. O CONTRATANTE declara possuir <strong>todos os direitos</strong> sobre o material 
            publicitário e indenizará a EXA por quaisquer reivindicações de terceiros.
          </p>
          <p className="mt-2">
            7.2. A CONTRATANTE <strong>autoriza expressamente</strong> a EXA MÍDIA a utilizar 
            o material publicitário para:
          </p>
          <ul className="list-disc ml-6 mt-1">
            <li>Veiculação nos painéis digitais contratados;</li>
            <li>Divulgação em materiais institucionais, portfólio e cases;</li>
            <li>Redes sociais, website e apresentações comerciais.</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3">
          <h2 className="font-bold">CLÁUSULA 8ª - RESCISÃO E MULTA</h2>
          <p>
            8.1. <strong>Rescisão antecipada pelo CONTRATANTE:</strong> multa de 20% sobre o saldo 
            remanescente, salvo outras condições previamente acordadas por escrito.
          </p>
          <p className="mt-2">
            8.2. <strong>Rescisão por culpa da EXA:</strong> devolução proporcional de valores não utilizados.
          </p>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 9ª - REAJUSTE</h2>
          <p>
            9.1. Reajuste anual pelo <strong>IPCA</strong> ou índice que venha a substituí-lo.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <h2 className="font-bold">CLÁUSULA 10ª - SEGURANÇA, PRIVACIDADE E AUTENTICAÇÃO</h2>
          <p className="mt-2">
            10.1. <strong>Segurança Operacional:</strong> A EXA manterá políticas e controles de 
            segurança incluindo firewall, autenticação multifatorial, segregação de ambientes, 
            backups periódicos e monitoramento de integridade.
          </p>
          <p className="mt-2">
            10.2. <strong>Proteção de Dados e Privacidade:</strong> Ambas as partes concordam em 
            cumprir a legislação aplicável (incl. LGPD). Vazamentos serão comunicados em até 48 horas úteis.
          </p>
          <p className="mt-2">
            10.3. <strong>Logs e Auditoria:</strong> A EXA manterá registros de logs por no mínimo 
            12 meses para fins de auditoria.
          </p>
          <p className="mt-2">
            10.4. <strong>Confidencialidade:</strong> As partes comprometem-se a manter confidenciais 
            termos comerciais, preços, relatórios e acessos técnicos.
          </p>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 11ª - DISPOSIÇÕES GERAIS</h2>
          <p>
            11.1. Comunicações oficiais via portal, e-mail corporativo ou notificações do sistema EXA.
          </p>
          <p className="mt-2">
            11.2. Alterações ao contrato somente por escrito e assinadas por representantes autorizados.
          </p>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 12ª - FORO</h2>
          <p>
            12.1. Elegem as partes o foro da comarca de <strong>Foz do Iguaçu/PR</strong> para dirimir 
            controvérsias, com renúncia a qualquer outro.
          </p>
        </div>

        {data.clausulas_especiais && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h2 className="font-bold">CLÁUSULA 13ª - CONDIÇÕES ESPECIAIS</h2>
            <p>{data.clausulas_especiais}</p>
          </div>
        )}
      </div>

      {/* Assinaturas - COM REPRESENTANTES EXA COMPLETOS */}
      <div className="mt-12 pt-8 border-t-2 border-gray-300">
        <p className="text-center mb-10 text-sm">
          Foz do Iguaçu - PR, {dataAtual}.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* CONTRATANTE */}
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="font-bold text-center text-sm text-gray-600 mb-4 uppercase tracking-wide">
              CONTRATANTE
            </h3>
            <div className="text-center space-y-2">
              <p className="font-bold text-base">{data.cliente_razao_social || data.cliente_nome}</p>
              {data.cliente_cnpj && (
                <p className="text-sm text-gray-600">CNPJ: {data.cliente_cnpj}</p>
              )}
              <p className="text-sm">Representante: {data.cliente_nome}</p>
              {data.cliente_cargo && (
                <p className="text-xs text-gray-500">Cargo: {data.cliente_cargo}</p>
              )}
              
              <div className="mt-8 pt-4">
                <div className="border-t border-gray-400 mx-8"></div>
                <p className="text-xs text-gray-500 mt-2">Assinatura</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">Data: ____ / ____ / ________</p>
            </div>
          </div>
          
          {/* CONTRATADA - EXA com dois representantes */}
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <h3 className="font-bold text-center text-sm text-gray-600 mb-4 uppercase tracking-wide">
              CONTRATADA
            </h3>
            <div className="text-center space-y-2">
              <p className="font-bold text-base">EXA — Soluções Digitais</p>
              <p className="text-sm text-gray-600">CNPJ: 62.878.193/0001-35</p>
              <p className="text-xs text-gray-500 mt-2">Representantes legais:</p>
              
              {/* Natália */}
              <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                <p className="font-semibold text-sm">Natália Krause Guimarães Dantas</p>
                <p className="text-xs text-gray-500">RG 13.038.569-9 / CPF 116.228.359-99</p>
                <div className="mt-4 pt-2">
                  <div className="border-t border-gray-400 mx-12"></div>
                  <p className="text-xs text-gray-500 mt-1">Assinatura</p>
                </div>
              </div>
              
              {/* Jeferson */}
              <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                <p className="font-semibold text-sm">Jeferson Stilver Rodrigues Encina</p>
                <p className="text-xs text-gray-500">RG 8.812.269-0 / CPF 055.031.279-00</p>
                <div className="mt-4 pt-2">
                  <div className="border-t border-gray-400 mx-12"></div>
                  <p className="text-xs text-gray-500 mt-1">Assinatura</p>
                </div>
              </div>
              
              <p className="text-xs text-gray-400 mt-4">Data: ____ / ____ / ________</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de edição se disponível */}
      {onEdit && (
        <div className="mt-6 text-center">
          <button
            onClick={onEdit}
            className="text-primary hover:underline text-sm"
          >
            ✏️ Editar dados do contrato
          </button>
        </div>
      )}
    </div>
  );
};

export default ContractPreview;
