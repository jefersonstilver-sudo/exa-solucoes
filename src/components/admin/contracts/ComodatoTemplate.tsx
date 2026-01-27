import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import exaContractHeader from '@/assets/exa-contract-header.png';

interface ComodatoTemplateProps {
  data: {
    numero_contrato?: string;
    cliente_nome: string;
    cliente_email?: string;
    cliente_cnpj?: string;
    cliente_cpf?: string;
    cliente_razao_social?: string;
    cliente_cargo?: string;
    cliente_endereco?: string;
    cliente_cidade?: string;
    cliente_telefone?: string;
    predio_nome?: string;
    predio_endereco?: string;
    numero_telas_instaladas?: number;
    prazo_aviso_rescisao?: number;
    requer_internet?: boolean;
    posicao_elevador?: string;
    clausulas_especiais?: string;
    data_inicio?: string;
  };
}

const ComodatoTemplate: React.FC<ComodatoTemplateProps> = ({ data }) => {
  const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  const formatDateExtended = (dateStr: string | undefined) => {
    if (!dateStr) return dataAtual;
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dataAtual;
    }
  };

  const getPosicaoElevadorTexto = (posicao: string | undefined) => {
    switch (posicao) {
      case 'social': return 'elevador social';
      case 'servico': return 'elevador de serviço';
      case 'ambos': return 'elevadores social e de serviço';
      default: return 'elevador(es)';
    }
  };

  // URL oficial do cabeçalho EXA - usando import local
  const EXA_CONTRACT_HEADER_URL = exaContractHeader;

  return (
    <div className="bg-white text-gray-900 font-serif text-sm leading-relaxed">
      {/* Header Oficial EXA - Full Width */}
      <div style={{
        width: 'calc(100% + 64px)',
        margin: '-32px -32px 24px -32px',
        display: 'block'
      }}>
        <img 
          src={EXA_CONTRACT_HEADER_URL} 
          alt="EXA Header" 
          style={{ width: '100%', height: 'auto', display: 'block' }}
          crossOrigin="anonymous"
        />
      </div>

      {/* Container com padding */}
      <div className="px-8">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-lg font-bold uppercase tracking-wide">
            Contrato de Comodato de Equipamento Digital
          </h1>
          {data.numero_contrato && (
            <p className="text-gray-600 text-sm mt-1">
              Contrato nº {data.numero_contrato}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Empréstimo Gratuito de Painel Digital para Publicidade
          </p>
        </div>

      {/* Partes */}
      <div className="mb-6 space-y-4">
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">COMODANTE (quem empresta)</p>
          <p>
            <strong>INDEXA MIDIA LTDA</strong> (marca ExaMídia), pessoa jurídica de direito privado, 
            inscrita no CNPJ sob nº <strong>38.142.638/0001-30</strong>, com sede na 
            Av. Paraná, nº 974, Sala 301, Centro, Foz do Iguaçu - PR, CEP 85852-000, 
            neste ato representada por seus representantes legais, doravante denominada 
            simplesmente <strong>"COMODANTE"</strong>.
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <p className="text-xs text-blue-600 uppercase font-semibold mb-2">COMODATÁRIO (quem recebe)</p>
          <p>
            <strong>{data.cliente_razao_social || data.predio_nome || data.cliente_nome}</strong>
            {data.cliente_cnpj && <>, inscrito no CNPJ sob nº <strong>{data.cliente_cnpj}</strong></>}
            {data.cliente_cpf && !data.cliente_cnpj && <>, inscrito no CPF sob nº <strong>{data.cliente_cpf}</strong></>}
            {data.predio_endereco && <>, situado em <strong>{data.predio_endereco}</strong></>}
            {data.cliente_cidade && <>, {data.cliente_cidade}</>}
            , representado neste ato por <strong>{data.cliente_nome}</strong>
            {data.cliente_cargo && <> ({data.cliente_cargo})</>}
            , doravante denominado simplesmente <strong>"COMODATÁRIO"</strong>.
          </p>
        </div>
      </div>

      {/* Cláusulas */}
      <div className="space-y-6">
        {/* CLÁUSULA 1 - OBJETO */}
        <div>
          <h2 className="font-bold text-[#8B1A1A] border-b border-[#8B1A1A]/30 pb-1 mb-3">
            CLÁUSULA 1ª - DO OBJETO
          </h2>
          <p className="text-justify mb-2">
            1.1. O presente contrato tem por objeto o <strong>empréstimo gratuito (comodato)</strong> de 
            <strong> {data.numero_telas_instaladas || 1} ({data.numero_telas_instaladas === 1 ? 'um' : data.numero_telas_instaladas}) painel(is) digital(is)</strong> de 
            propriedade da COMODANTE, para instalação no(s) {getPosicaoElevadorTexto(data.posicao_elevador)} do 
            edifício <strong>{data.predio_nome || '[Nome do Edifício]'}</strong>.
          </p>
          <p className="text-justify">
            1.2. Os equipamentos serão utilizados exclusivamente para exibição de conteúdo informativo 
            de utilidade pública e publicitário, gerenciados pela COMODANTE.
          </p>
        </div>

        {/* CLÁUSULA 2 - LOCAL */}
        <div className="bg-amber-50 border border-amber-200 rounded p-4">
          <h2 className="font-bold text-amber-800 mb-3">
            CLÁUSULA 2ª - DO LOCAL DA INSTALAÇÃO
          </h2>
          <p className="text-justify mb-2">
            2.1. O(s) equipamento(s) será(ão) instalado(s) no seguinte endereço:
          </p>
          <div className="bg-white p-3 rounded border border-amber-300 mt-2">
            <p><strong>Edifício:</strong> {data.predio_nome || '[A definir]'}</p>
            <p><strong>Endereço:</strong> {data.predio_endereco || '[A definir]'}</p>
            <p><strong>Cidade:</strong> {data.cliente_cidade || 'Foz do Iguaçu - PR'}</p>
            <p><strong>Posição:</strong> {getPosicaoElevadorTexto(data.posicao_elevador)}</p>
            <p><strong>Quantidade de Telas:</strong> {data.numero_telas_instaladas || 1} unidade(s)</p>
          </div>
        </div>

        {/* CLÁUSULA 3 - OBRIGAÇÕES DA COMODANTE */}
        <div>
          <h2 className="font-bold text-[#8B1A1A] border-b border-[#8B1A1A]/30 pb-1 mb-3">
            CLÁUSULA 3ª - DAS OBRIGAÇÕES DA COMODANTE
          </h2>
          <p className="text-justify mb-2">3.1. A COMODANTE compromete-se a:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Fornecer e instalar o(s) equipamento(s) <strong>sem qualquer custo</strong> ao COMODATÁRIO;</li>
            <li>Realizar <strong>manutenção preventiva e corretiva</strong> gratuita dos equipamentos;</li>
            <li>Disponibilizar <strong>suporte técnico</strong> para eventuais problemas;</li>
            <li>Substituir equipamentos defeituosos sem ônus ao COMODATÁRIO;</li>
            <li>Exibir conteúdo informativo de utilidade pública para o condomínio;</li>
            <li>Respeitar as normas internas do condomínio quanto a horários de manutenção.</li>
          </ul>
        </div>

        {/* CLÁUSULA 4 - OBRIGAÇÕES DO COMODATÁRIO */}
        <div>
          <h2 className="font-bold text-[#8B1A1A] border-b border-[#8B1A1A]/30 pb-1 mb-3">
            CLÁUSULA 4ª - DAS OBRIGAÇÕES DO COMODATÁRIO
          </h2>
          <p className="text-justify mb-2">4.1. O COMODATÁRIO compromete-se a:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Ceder o espaço necessário para instalação do(s) equipamento(s);</li>
            <li>Permitir acesso da equipe técnica da COMODANTE para instalação e manutenção;</li>
            <li>Zelar pela conservação do(s) equipamento(s), comunicando imediatamente qualquer irregularidade;</li>
            <li>Não remover, danificar ou permitir que terceiros manipulem o(s) equipamento(s);</li>
            {data.requer_internet !== false && (
              <li><strong>Garantir ponto de energia elétrica e sinal de internet</strong> para funcionamento do(s) equipamento(s);</li>
            )}
            {data.requer_internet === false && (
              <li>Garantir ponto de energia elétrica para funcionamento do(s) equipamento(s);</li>
            )}
            <li>Comunicar à COMODANTE qualquer alteração no edifício que possa afetar o(s) equipamento(s).</li>
          </ul>
        </div>

        {/* CLÁUSULA 5 - VIGÊNCIA */}
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h2 className="font-bold text-green-800 mb-3">
            CLÁUSULA 5ª - DA VIGÊNCIA E RESCISÃO
          </h2>
          <p className="text-justify mb-2">
            5.1. O presente contrato terá <strong>prazo indeterminado</strong>, iniciando-se em 
            <strong> {formatDateExtended(data.data_inicio)}</strong>.
          </p>
          <p className="text-justify mb-2">
            5.2. Qualquer das partes poderá rescindir o presente contrato mediante comunicação 
            prévia por escrito de <strong>{data.prazo_aviso_rescisao || 30} ({data.prazo_aviso_rescisao === 30 ? 'trinta' : data.prazo_aviso_rescisao}) dias</strong>.
          </p>
          <p className="text-justify">
            5.3. Em caso de rescisão, a COMODANTE terá o prazo de 10 (dez) dias úteis para 
            retirar o(s) equipamento(s) do local.
          </p>
        </div>

        {/* CLÁUSULA 6 - PROPRIEDADE */}
        <div>
          <h2 className="font-bold text-[#8B1A1A] border-b border-[#8B1A1A]/30 pb-1 mb-3">
            CLÁUSULA 6ª - DA PROPRIEDADE
          </h2>
          <p className="text-justify mb-2">
            6.1. O(s) equipamento(s) objeto deste contrato permanecem sendo de <strong>propriedade 
            exclusiva da COMODANTE</strong>, devendo ser devolvidos em perfeito estado de 
            conservação ao término do presente instrumento.
          </p>
          <p className="text-justify">
            6.2. O COMODATÁRIO <strong>não poderá</strong>, em hipótese alguma, alienar, transferir, 
            emprestar ou dar em garantia o(s) equipamento(s).
          </p>
        </div>

        {/* CLÁUSULA 7 - USO DE IMAGEM */}
        <div className="bg-purple-50 border border-purple-200 rounded p-4">
          <h2 className="font-bold text-purple-800 mb-3">
            CLÁUSULA 7ª - DO USO DE IMAGEM
          </h2>
          <p className="text-justify mb-2">
            7.1. O COMODATÁRIO autoriza a COMODANTE a utilizar fotos e vídeos da instalação 
            do(s) equipamento(s) para fins de divulgação institucional e comercial.
          </p>
          <p className="text-justify">
            7.2. A autorização prevista no item anterior inclui a utilização em materiais 
            publicitários, redes sociais, site institucional e apresentações comerciais.
          </p>
        </div>

        {/* CLÁUSULA 8 - CONDIÇÕES ESPECIAIS */}
        {data.clausulas_especiais && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h2 className="font-bold text-blue-800 mb-3">
              CLÁUSULA 8ª - CONDIÇÕES ESPECIAIS
            </h2>
            <p className="text-justify whitespace-pre-line">{data.clausulas_especiais}</p>
          </div>
        )}

        {/* CLÁUSULA 9 - FORO */}
        <div>
          <h2 className="font-bold text-[#8B1A1A] border-b border-[#8B1A1A]/30 pb-1 mb-3">
            CLÁUSULA {data.clausulas_especiais ? '9ª' : '8ª'} - DO FORO
          </h2>
          <p className="text-justify">
            {data.clausulas_especiais ? '9' : '8'}.1. Fica eleito o foro da Comarca de <strong>Foz do Iguaçu - PR</strong> para 
            dirimir quaisquer dúvidas ou litígios decorrentes do presente contrato, com 
            renúncia expressa a qualquer outro, por mais privilegiado que seja.
          </p>
        </div>
      </div>

      {/* Encerramento */}
      <div className="mt-12 text-justify">
        <p>
          E por estarem assim justas e contratadas, as partes firmam o presente instrumento 
          em 02 (duas) vias de igual teor e forma, na presença das testemunhas abaixo.
        </p>
      </div>

      {/* Local e Data */}
      <div className="mt-8 text-center">
        <p>Foz do Iguaçu - PR, {formatDateExtended(data.data_inicio)}.</p>
      </div>

      {/* Assinaturas */}
      <div className="grid grid-cols-2 gap-8 mt-16">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mx-4">
            <p className="font-bold">INDEXA MIDIA LTDA</p>
            <p className="text-sm text-gray-600">COMODANTE</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mx-4">
            <p className="font-bold">{data.cliente_nome}</p>
            <p className="text-sm text-gray-600">COMODATÁRIO</p>
            {data.cliente_cargo && (
              <p className="text-xs text-gray-500">{data.cliente_cargo}</p>
            )}
          </div>
        </div>
      </div>

      {/* Testemunhas */}
      <div className="grid grid-cols-2 gap-8 mt-12">
        <div className="text-center">
          <div className="border-t border-gray-300 pt-2 mx-8">
            <p className="text-sm text-gray-600">Testemunha 1</p>
            <p className="text-xs text-gray-500">Nome: _______________________</p>
            <p className="text-xs text-gray-500">CPF: _________________________</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-300 pt-2 mx-8">
            <p className="text-sm text-gray-600">Testemunha 2</p>
            <p className="text-xs text-gray-500">Nome: _______________________</p>
          <p className="text-xs text-gray-500">CPF: _________________________</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ComodatoTemplate;
