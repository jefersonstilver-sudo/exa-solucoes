import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface ProposalSummaryTextProps {
  tipoProduto: 'horizontal' | 'vertical_premium';
  quantidadePosicoes: number;
  totalPredios: number;
  totalTelas: number;
  exibicoesMes: number;
  duracaoMeses: number;
  duracaoVideoSegundos: number;
  isVendaFutura: boolean;
  prediosContratados?: number;
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
  prediosContratados,
  maxVideosPorPedido = 4
}: ProposalSummaryTextProps) {
  const isHorizontal = tipoProduto === 'horizontal';
  const formatoNome = isHorizontal ? 'Horizontal' : 'Vertical Premium';
  const hasMultiplePosicoes = quantidadePosicoes > 1;
  
  // Para venda futura, usar predios contratados como meta
  const prediosExibidos = isVendaFutura && prediosContratados ? prediosContratados : totalPredios;

  return (
    <Card className="p-4 sm:p-5 bg-slate-50/80 border border-slate-200">
      <div className="flex gap-3">
        <FileText className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          {/* Parágrafo principal - formato de proposta */}
          <p>
            Esta proposta oferece{' '}
            <span className="font-semibold text-slate-800">
              {quantidadePosicoes} {quantidadePosicoes === 1 ? 'posição' : 'posições'}
            </span>{' '}
            no formato{' '}
            <span className="font-semibold text-slate-800">{formatoNome}</span>, com presença em{' '}
            <span className="font-semibold text-slate-800">{prediosExibidos} prédios</span> e{' '}
            <span className="font-semibold text-slate-800">{totalTelas} telas</span>.
            Seu anúncio de{' '}
            <span className="font-semibold text-slate-800">{duracaoVideoSegundos}s</span> será exibido aproximadamente{' '}
            <span className="font-semibold text-[#9C1E1E]">
              {exibicoesMes.toLocaleString('pt-BR')}x/mês
            </span>{' '}
            — uma exposição diária que forma opinião e gera lembrança de marca.
          </p>

          {/* Diferenciais da mídia - sempre presente */}
          <p className="text-slate-500 italic">
            A mídia em elevador é altamente eficaz: público <span className="font-medium text-slate-600">recorrente</span> (residentes e visitantes diários), 
            atenção <span className="font-medium text-slate-600">inevitável</span> (ambiente fechado) e 
            repetição que <span className="font-medium text-slate-600">consolida sua marca</span> na mente do consumidor.
          </p>

          {/* Condicionais por tipo/cenário */}
          <div className="space-y-1.5 pt-1 border-t border-slate-200">
            {/* Destaque HORIZONTAL */}
            {isHorizontal && (
              <p className="text-slate-600">
                <span className="text-slate-400">→</span>{' '}
                Com o formato Horizontal, você pode intercalar até{' '}
                <span className="font-semibold text-slate-800">{maxVideosPorPedido} vídeos diferentes</span>{' '}
                no mesmo pedido, transmitindo variedade e alto posicionamento.
              </p>
            )}

            {/* Destaque VERTICAL PREMIUM */}
            {!isHorizontal && (
              <p className="text-slate-600">
                <span className="text-slate-400">→</span>{' '}
                O formato <span className="font-semibold text-slate-800">Vertical Premium</span> garante 
                atenção exclusiva: tela cheia, sem divisão com outros anunciantes.
              </p>
            )}

            {/* Destaque MÚLTIPLAS POSIÇÕES */}
            {hasMultiplePosicoes && (
              <p className="text-slate-600">
                <span className="text-slate-400">→</span>{' '}
                Com{' '}
                <span className="font-semibold text-slate-800">{quantidadePosicoes} posições</span>, 
                sua marca ocupa{' '}
                <span className="font-semibold text-[#9C1E1E]">{quantidadePosicoes}x mais espaço</span>{' '}
                no ciclo de exibição, aumentando frequência e impacto.
              </p>
            )}

            {/* Destaque VENDA FUTURA */}
            {isVendaFutura && prediosContratados && (
              <p className="text-slate-600">
                <span className="text-slate-400">→</span>{' '}
                <span className="font-semibold text-slate-800">Condição especial</span>: 
                você garante o preço atual, e todo o período até a instalação completa dos{' '}
                <span className="font-semibold text-slate-800">{prediosContratados} prédios</span> é{' '}
                <span className="font-semibold text-[#9C1E1E]">100% gratuito</span>.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
