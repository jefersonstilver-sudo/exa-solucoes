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
  };
}

const ContractPreview: React.FC<ContractPreviewProps> = ({ data }) => {
  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const listaPredios = Array.isArray(data.lista_predios) ? data.lista_predios : [];
  const totalPaineis = data.total_paineis || listaPredios.reduce((acc, p) => acc + (p.quantidade_telas || 1), 0);

  const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  if (data.tipo_contrato === 'sindico') {
    return (
      <div className="p-8 bg-white text-gray-900 font-serif text-sm leading-relaxed">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold uppercase tracking-wide">
            Termo de Cessão de Espaço para Publicidade Digital
          </h1>
          {data.numero_contrato && (
            <p className="text-sm text-gray-600 mt-2">Nº {data.numero_contrato}</p>
          )}
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
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase tracking-wide">
          Contrato de Prestação de Serviços Publicitários
        </h1>
        {data.numero_contrato && (
          <p className="text-sm text-gray-600 mt-2">Nº {data.numero_contrato}</p>
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
          <p>
            1.1. O presente contrato tem por objeto a veiculação de anúncios publicitários em 
            vídeo com duração de até 15 (quinze) segundos, fornecidos pela CONTRATANTE, nos 
            painéis digitais da EXA MÍDIA, localizados em prédios residenciais da cidade de 
            Foz do Iguaçu - PR, pelo prazo contratado de {data.plano_meses || 1} ({data.plano_meses === 1 ? 'um' : data.plano_meses}) 
            {data.plano_meses === 1 ? ' mês' : ' meses'} de exibição.
          </p>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 2ª - DOS LOCAIS CONTRATADOS</h2>
          <p>2.1. A contratação abrange {totalPaineis} tela(s) nos seguintes edifícios:</p>
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
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 3ª - DO VALOR E PAGAMENTO</h2>
          <p>3.1. Valor mensal: <strong>{formatCurrency(data.valor_mensal)}</strong></p>
          <p>3.2. Valor total do contrato: <strong>{formatCurrency(data.valor_total)}</strong></p>
          <p>3.3. Forma de pagamento: {data.metodo_pagamento?.replace(/_/g, ' ').toUpperCase() || 'A DEFINIR'}</p>
          {data.dia_vencimento && (
            <p>3.4. Vencimento das parcelas: dia {data.dia_vencimento} de cada mês.</p>
          )}
          <p className="mt-2">
            3.5. Após 10 (dez) dias de atraso no pagamento, a exibição será automaticamente 
            suspensa até a regularização.
          </p>
          <p>3.6. Multa por atraso: 2% (dois por cento) + 1% (um por cento) de juros ao mês.</p>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 4ª - DO CONTEÚDO PUBLICITÁRIO</h2>
          <p>
            4.1. A CONTRATANTE compromete-se a enviar vídeos conforme especificações técnicas 
            da CONTRATADA (resolução 1920x1080, formato MP4, máximo 15 segundos).
          </p>
          <p>
            4.2. Os vídeos podem ser substituídos a qualquer momento, mediante solicitação prévia.
          </p>
          <p>
            4.3. A CONTRATADA poderá recusar conteúdos que não atendam aos padrões técnicos 
            ou que contenham material ofensivo, ilegal ou que infrinja direitos de terceiros.
          </p>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 5ª - DO CANCELAMENTO</h2>
          <p>
            5.1. O cancelamento antecipado por parte da CONTRATANTE gerará multa de 30% 
            (trinta por cento) sobre o saldo devedor restante.
          </p>
        </div>

        <div>
          <h2 className="font-bold">CLÁUSULA 6ª - DO FORO</h2>
          <p>
            6.1. Para dirimir eventuais dúvidas ou litígios oriundos deste contrato, as partes 
            elegem o foro da Comarca de Foz do Iguaçu - PR, com renúncia expressa a qualquer outro.
          </p>
        </div>

        {data.clausulas_especiais && (
          <div>
            <h2 className="font-bold">CLÁUSULA 7ª - CONDIÇÕES ESPECIAIS</h2>
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
              <p className="font-bold">{data.cliente_razao_social || data.cliente_nome}</p>
              <p className="text-sm text-gray-600">CONTRATANTE</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="font-bold">EXA SOLUÇÕES DIGITAIS LTDA</p>
              <p className="text-sm text-gray-600">CONTRATADA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractPreview;
