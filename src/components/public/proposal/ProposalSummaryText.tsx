import { Card } from '@/components/ui/card';
import { Lightbulb, Target, FileText } from 'lucide-react';

interface ProposalSummaryTextProps {
  tipoProduto: 'horizontal' | 'vertical_premium';
  quantidadePosicoes: number;
  totalPredios: number;
  totalTelas: number;
  exibicoesMes: number;
  duracaoMeses: number;
  duracaoVideoSegundos: number;
  isVendaFutura: boolean;
  maxVideosPorPedido?: number;
}

export function ProposalSummaryText({
  tipoProduto,
  quantidadePosicoes,
  totalPredios,
  totalTelas,
  exibicoesMes,
  duracaoMeses,
  duracaoVideoSegundos,
  isVendaFutura,
  maxVideosPorPedido = 4
}: ProposalSummaryTextProps) {
  const isHorizontal = tipoProduto === 'horizontal';
  const formatoNome = isHorizontal ? 'Horizontal' : 'Vertical Premium';
  const hasMultiplePosicoes = quantidadePosicoes > 1;

  return (
    <Card className="p-4 sm:p-5 bg-white border border-slate-200 shadow-sm">
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        {/* Texto principal */}
        <p>
          Você está adquirindo{' '}
          <span className="font-semibold text-slate-900">
            {quantidadePosicoes} {quantidadePosicoes === 1 ? 'posição' : 'posições'}
          </span>{' '}
          no formato{' '}
          <span className="font-semibold text-slate-900">{formatoNome}</span>, com presença em{' '}
          <span className="font-semibold text-slate-900">{totalPredios} prédios</span> e{' '}
          <span className="font-semibold text-slate-900">{totalTelas} telas</span> de elevador.
          Seu anúncio de{' '}
          <span className="font-semibold text-slate-900">{duracaoVideoSegundos} segundos</span> será exibido aproximadamente{' '}
          <span className="font-semibold text-[#9C1E1E]">
            {exibicoesMes.toLocaleString('pt-BR')} vezes por mês
          </span>.
        </p>

        {/* Destaque para HORIZONTAL - intercalação de vídeos */}
        {isHorizontal && (
          <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-slate-700">
              <span className="font-semibold text-slate-900">
                Você pode enviar até {maxVideosPorPedido} vídeos diferentes
              </span>{' '}
              que serão intercalados automaticamente, transmitindo maior variedade e{' '}
              <span className="font-medium">alto posicionamento</span> da sua marca.
            </p>
          </div>
        )}

        {/* Destaque para VERTICAL PREMIUM */}
        {!isHorizontal && (
          <div className="flex gap-2.5 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <Lightbulb className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-slate-700">
              O formato <span className="font-semibold text-slate-900">Vertical Premium</span> garante{' '}
              <span className="font-medium">atenção total no elevador</span>, sem divisão de tela com outros anunciantes.
            </p>
          </div>
        )}

        {/* Destaque para MÚLTIPLAS POSIÇÕES */}
        {hasMultiplePosicoes && (
          <div className="flex gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Target className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-slate-700">
              Com <span className="font-semibold text-slate-900">{quantidadePosicoes} posições</span>, 
              sua marca ocupa{' '}
              <span className="font-semibold text-[#9C1E1E]">{quantidadePosicoes}x mais espaço</span>{' '}
              no ciclo de exibição, garantindo maior frequência e memorização.
            </p>
          </div>
        )}

        {/* Destaque para VENDA FUTURA */}
        {isVendaFutura && (
          <div className="flex gap-2.5 p-3 bg-green-50 border border-green-200 rounded-lg">
            <FileText className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-slate-700">
              Esta proposta inclui <span className="font-semibold text-slate-900">condição especial</span>: 
              você garante o preço atual e todo o período até a conclusão da instalação dos {totalPredios} prédios é{' '}
              <span className="font-semibold text-green-700">100% gratuito</span>.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
