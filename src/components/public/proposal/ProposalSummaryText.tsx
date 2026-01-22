import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';

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
    <Card className="p-4 sm:p-5 bg-slate-50/80 border border-slate-200">
      <div className="flex gap-3">
        <Info className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
          {/* Texto principal */}
          <p>
            Você está adquirindo{' '}
            <span className="font-semibold text-slate-800">
              {quantidadePosicoes} {quantidadePosicoes === 1 ? 'posição' : 'posições'}
            </span>{' '}
            no formato{' '}
            <span className="font-semibold text-slate-800">{formatoNome}</span>, com presença em{' '}
            <span className="font-semibold text-slate-800">{totalPredios} prédios</span> e{' '}
            <span className="font-semibold text-slate-800">{totalTelas} telas</span>.
            Seu anúncio de{' '}
            <span className="font-semibold text-slate-800">{duracaoVideoSegundos}s</span> será exibido aproximadamente{' '}
            <span className="font-semibold text-[#9C1E1E]">
              {exibicoesMes.toLocaleString('pt-BR')}x/mês
            </span>.
          </p>

          {/* Destaque para HORIZONTAL - intercalação de vídeos */}
          {isHorizontal && (
            <p className="text-slate-600">
              <span className="font-medium text-slate-700">→</span>{' '}
              Você pode enviar até{' '}
              <span className="font-semibold text-slate-800">{maxVideosPorPedido} vídeos diferentes</span>{' '}
              que serão intercalados automaticamente, transmitindo variedade e alto posicionamento.
            </p>
          )}

          {/* Destaque para VERTICAL PREMIUM */}
          {!isHorizontal && (
            <p className="text-slate-600">
              <span className="font-medium text-slate-700">→</span>{' '}
              O formato <span className="font-semibold text-slate-800">Vertical Premium</span> garante{' '}
              atenção total no elevador, sem divisão de tela.
            </p>
          )}

          {/* Destaque para MÚLTIPLAS POSIÇÕES */}
          {hasMultiplePosicoes && (
            <p className="text-slate-600">
              <span className="font-medium text-slate-700">→</span>{' '}
              Com{' '}
              <span className="font-semibold text-slate-800">{quantidadePosicoes} posições</span>, 
              sua marca ocupa{' '}
              <span className="font-semibold text-[#9C1E1E]">{quantidadePosicoes}x mais espaço</span>{' '}
              no ciclo de exibição.
            </p>
          )}

          {/* Destaque para VENDA FUTURA */}
          {isVendaFutura && (
            <p className="text-slate-600">
              <span className="font-medium text-slate-700">→</span>{' '}
              <span className="font-semibold text-slate-800">Condição especial</span>: 
              você garante o preço atual e o período até a instalação completa é{' '}
              <span className="font-semibold text-[#9C1E1E]">100% gratuito</span>.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
