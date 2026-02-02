import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { RefreshCw, DollarSign, Check, Package, Building2, Lightbulb } from 'lucide-react';

interface ItemPermuta {
  id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  ocultar_preco: boolean;
}

interface PermutaChoiceCardProps {
  valorReferenciaMonetaria: number;
  duracaoMeses: number;
  duracaoDias?: number | null;
  isCustomDays?: boolean;
  itensPermuta: ItemPermuta[];
  descricaoContrapartida?: string | null;
  ocultarValores?: boolean;
  totalTelas: number;
  totalExibicoes: number;
  totalPredios: number;
  onSelectionChange?: (option: 'monetario' | 'permuta') => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'k';
  }
  return value.toLocaleString('pt-BR');
};

export function PermutaChoiceCard({
  valorReferenciaMonetaria,
  duracaoMeses,
  duracaoDias,
  isCustomDays,
  itensPermuta,
  descricaoContrapartida,
  ocultarValores,
  totalTelas,
  totalExibicoes,
  totalPredios,
  onSelectionChange,
}: PermutaChoiceCardProps) {
  const [selectedOption, setSelectedOption] = useState<'monetario' | 'permuta'>('permuta');

  const handleSelection = (option: 'monetario' | 'permuta') => {
    setSelectedOption(option);
    onSelectionChange?.(option);
  };

  const periodoTexto = isCustomDays && duracaoDias
    ? `${duracaoDias} ${duracaoDias === 1 ? 'dia' : 'dias'}`
    : `${duracaoMeses} ${duracaoMeses === 1 ? 'mês' : 'meses'}`;

  const multiplicador = isCustomDays && duracaoDias
    ? duracaoDias / 30
    : duracaoMeses;

  const valorTotalMonetario = valorReferenciaMonetaria * multiplicador;

  // Gerar descrição dos itens de contrapartida
  const contrapartidaTexto = itensPermuta.length > 0
    ? itensPermuta.map(item => `${item.quantidade}x ${item.nome}`).join(', ')
    : descricaoContrapartida || 'Equipamentos/Serviços';

  return (
    <Card className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] rounded-lg">
          <RefreshCw className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-800">
            Modalidade de Pagamento
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500">
            Escolha como deseja formalizar esta parceria
          </p>
        </div>
      </div>

      {/* Options Grid - Side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Option 1: Valor Monetário */}
        <div 
          onClick={() => handleSelection('monetario')}
          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            selectedOption === 'monetario'
              ? 'border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white shadow-lg'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
          }`}
        >
          {/* Badge e Checkmark dinâmicos */}
          {selectedOption === 'monetario' && (
            <>
              <div className="absolute -top-2 left-3 bg-gradient-to-r from-[#9C1E1E] to-[#7D1818] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="h-2.5 w-2.5" />
                ESCOLHIDO
              </div>
              <div className="absolute -top-2 -right-2 p-1 bg-[#9C1E1E] rounded-full">
                <Check className="h-3 w-3 text-white" />
              </div>
            </>
          )}

          <div className={`flex items-center gap-2 mb-3 ${selectedOption === 'monetario' ? 'mt-2' : ''}`}>
            <DollarSign className={`h-4 w-4 ${selectedOption === 'monetario' ? 'text-[#9C1E1E]' : 'text-slate-500'}`} />
            <span className={`font-semibold text-sm ${selectedOption === 'monetario' ? 'text-[#7D1818]' : 'text-slate-700'}`}>
              Valor Monetário
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <p className={`text-[10px] uppercase ${selectedOption === 'monetario' ? 'text-[#9C1E1E]/60' : 'text-slate-400'}`}>Mensal</p>
              <p className={`text-lg font-bold ${selectedOption === 'monetario' ? 'text-[#9C1E1E]' : 'text-slate-700'}`}>
                {formatCurrency(valorReferenciaMonetaria)}
                <span className={`text-xs font-normal ${selectedOption === 'monetario' ? 'text-[#9C1E1E]/60' : 'text-slate-400'}`}>/mês</span>
              </p>
            </div>
            <div>
              <p className={`text-[10px] uppercase ${selectedOption === 'monetario' ? 'text-[#9C1E1E]/60' : 'text-slate-400'}`}>Total ({periodoTexto})</p>
              <p className={`text-sm font-semibold ${selectedOption === 'monetario' ? 'text-[#7D1818]' : 'text-slate-600'}`}>
                {formatCurrency(valorTotalMonetario)}
              </p>
            </div>
          </div>

          <div className={`mt-3 pt-3 border-t ${selectedOption === 'monetario' ? 'border-[#9C1E1E]/10' : 'border-slate-100'}`}>
            <p className={`text-[10px] flex items-center gap-1 ${selectedOption === 'monetario' ? 'text-[#7D1818]' : 'text-slate-400'}`}>
              <Building2 className="h-3 w-3" />
              {totalTelas} telas • {formatNumber(totalExibicoes)} exib./mês
            </p>
          </div>
        </div>

        {/* Option 2: Acordo de Permuta */}
        <div 
          onClick={() => handleSelection('permuta')}
          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            selectedOption === 'permuta'
              ? 'border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white shadow-lg'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
          }`}
        >
          {/* Badge e Checkmark dinâmicos */}
          {selectedOption === 'permuta' && (
            <>
              <div className="absolute -top-2 left-3 bg-gradient-to-r from-[#9C1E1E] to-[#7D1818] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="h-2.5 w-2.5" />
                ESCOLHIDO
              </div>
              <div className="absolute -top-2 -right-2 p-1 bg-[#9C1E1E] rounded-full">
                <Check className="h-3 w-3 text-white" />
              </div>
            </>
          )}
          
          <div className={`flex items-center gap-2 mb-3 ${selectedOption === 'permuta' ? 'mt-2' : ''}`}>
            <RefreshCw className={`h-4 w-4 ${selectedOption === 'permuta' ? 'text-[#9C1E1E]' : 'text-slate-500'}`} />
            <span className={`font-semibold text-sm ${selectedOption === 'permuta' ? 'text-[#7D1818]' : 'text-slate-700'}`}>
              Acordo de Permuta
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <p className={`text-[10px] uppercase ${selectedOption === 'permuta' ? 'text-[#9C1E1E]/60' : 'text-slate-400'}`}>Período</p>
              <p className={`text-lg font-bold ${selectedOption === 'permuta' ? 'text-[#9C1E1E]' : 'text-slate-700'}`}>{periodoTexto}</p>
            </div>
            <div>
              <p className={`text-[10px] uppercase ${selectedOption === 'permuta' ? 'text-[#9C1E1E]/60' : 'text-slate-400'}`}>Contrapartida</p>
              <p className={`text-sm font-semibold line-clamp-2 ${selectedOption === 'permuta' ? 'text-[#7D1818]' : 'text-slate-600'}`}>
                {contrapartidaTexto}
              </p>
            </div>
          </div>

          <div className={`mt-3 pt-3 border-t ${selectedOption === 'permuta' ? 'border-[#9C1E1E]/10' : 'border-slate-100'}`}>
            <p className={`text-[10px] flex items-center gap-1 ${selectedOption === 'permuta' ? 'text-[#7D1818]' : 'text-slate-400'}`}>
              <Building2 className="h-3 w-3" />
              {totalTelas} telas • {formatNumber(totalExibicoes)} exib./mês
            </p>
          </div>
        </div>
      </div>

      {/* Detalhes dos Itens de Permuta */}
      {itensPermuta.length > 0 && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
          <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-2 mb-2">
            <Package className="h-3.5 w-3.5 text-[#9C1E1E]" />
            Itens da Contrapartida
          </h4>
          <div className="space-y-1.5">
            {itensPermuta.map((item, index) => (
              <div key={item.id || index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#9C1E1E]/10 text-[#9C1E1E] rounded-full flex items-center justify-center text-[10px] font-bold">
                    {index + 1}
                  </span>
                  <span className="text-slate-600">
                    {item.quantidade}x {item.nome}
                  </span>
                </div>
                {!ocultarValores && !item.ocultar_preco && (
                  <span className="text-slate-500 font-medium">
                    {formatCurrency(item.preco_total)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Texto Explicativo Dinâmico */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-[10px] sm:text-xs text-slate-600 space-y-1">
            {selectedOption === 'permuta' ? (
              <>
                <p>
                  <strong className="text-slate-700">Você escolheu o Acordo de Permuta.</strong>
                </p>
                <p>
                  Em vez de pagamento em dinheiro, você fornece {contrapartidaTexto.toLowerCase()} para a EXA Mídia.
                </p>
                <p>
                  <strong className="text-[#9C1E1E]">Esta opção pode sair mais barata para sua empresa</strong> ao comparar seus produtos a preço de custo em vez do valor de mercado de {formatCurrency(valorTotalMonetario)}.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong className="text-slate-700">Você escolheu o Valor Monetário.</strong>
                </p>
                <p>
                  O investimento é de <strong className="text-[#9C1E1E]">{formatCurrency(valorReferenciaMonetaria)}/mês</strong>, totalizando <strong className="text-[#9C1E1E]">{formatCurrency(valorTotalMonetario)}</strong> em {periodoTexto}.
                </p>
                <p>
                  Ideal para quem prefere uma relação comercial tradicional e direta, com pagamento via boleto, PIX ou cartão.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
