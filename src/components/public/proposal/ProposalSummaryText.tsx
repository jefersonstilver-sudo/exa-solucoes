import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Play } from 'lucide-react';
import { useState } from 'react';
import FullscreenVideoPlayer from '@/components/paineis-landing/FullscreenVideoPlayer';

const SUPABASE_VIDEO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/public-assets/videos/amostra-agendamento.mp4';

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
  maxVideosPorPedido = 10
}: ProposalSummaryTextProps) {
  const [showVideoDemo, setShowVideoDemo] = useState(false);
  const isHorizontal = tipoProduto === 'horizontal';
  const formatoNome = isHorizontal ? 'Horizontal' : 'Vertical Premium';
  const hasMultiplePosicoes = quantidadePosicoes > 1;
  
  // Para venda futura, usar predios contratados como meta
  const prediosExibidos = isVendaFutura && prediosContratados ? prediosContratados : totalPredios;
  
  // Calcular total de vídeos simultâneos para horizontal com múltiplas posições
  const totalVideosSimultaneos = isHorizontal ? maxVideosPorPedido * quantidadePosicoes : quantidadePosicoes;

  return (
    <Card className="p-4 sm:p-5 bg-slate-50/80 border border-slate-200">
      <div className="flex gap-3">
        <FileText className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          {/* Parágrafo principal - impacto e vitrine digital */}
          <p>
            Imagine sua marca presente na rotina de cada morador e visitante,{' '}
            <span className="font-semibold text-slate-800">todos os dias, várias vezes ao dia</span>.
            Um residente que usa o elevador apenas 2 vezes por dia já é impactado pelo seu anúncio cerca de{' '}
            <span className="font-semibold text-[#9C1E1E]">40 vezes por semana</span>.
            Esta proposta garante{' '}
            <span className="font-semibold text-slate-800">
              {quantidadePosicoes} {quantidadePosicoes === 1 ? 'posição' : 'posições'}
            </span>{' '}
            no formato{' '}
            <span className="font-semibold text-slate-800">{formatoNome}</span>, com presença em{' '}
            <span className="font-semibold text-slate-800">{prediosExibidos} prédios</span> e{' '}
            <span className="font-semibold text-slate-800">{totalTelas} telas</span>.
            São aproximadamente{' '}
            <span className="font-semibold text-[#9C1E1E]">
              {exibicoesMes.toLocaleString('pt-BR')} exibições por mês
            </span>{' '}
            — sua marca se torna parte do dia a dia do público, como uma{' '}
            <span className="font-semibold text-slate-800">vitrine premium</span> que ninguém consegue ignorar.
          </p>

          {/* Diferenciais - público cativo e repetição */}
          <p className="text-slate-500 italic">
            Diferente de qualquer outra mídia, o elevador é um ambiente{' '}
            <span className="font-medium text-slate-600">fechado e inevitável</span>: 
            não existe como pular, fechar ou ignorar. O público é{' '}
            <span className="font-medium text-slate-600">100% cativo</span> — moradores, 
            visitantes e hóspedes que veem sua marca a cada viagem.
            Essa repetição diária{' '}
            <span className="font-medium text-slate-600">grava sua marca no subconsciente</span> do 
            consumidor, criando familiaridade e confiança que nenhum anúncio de feed ou stories consegue replicar.
          </p>

          {/* Condicionais por tipo/cenário */}
          <div className="space-y-1.5 pt-1 border-t border-slate-200">
            {/* Destaque HORIZONTAL - revista digital */}
            {isHorizontal && !hasMultiplePosicoes && (
              <p className="text-slate-600">
                <span className="text-slate-400">→</span>{' '}
                Sua marca funciona como uma{' '}
                <span className="font-semibold text-slate-800">nova revista digital</span>: 
                você pode agendar até{' '}
                <span className="font-semibold text-slate-800">{maxVideosPorPedido} vídeos diferentes</span>{' '}
                no mesmo pedido, cada um como uma "página" nova.
                O morador nunca vê a mesma coisa — segunda pode ser um vídeo institucional, 
                quarta uma oferta especial, sexta o lançamento de um produto e no fim de semana uma promoção exclusiva.
                Isso{' '}
                <span className="font-semibold text-slate-800">elimina a fadiga visual</span> e mantém a 
                curiosidade e o engajamento a cada viagem de elevador.
              </p>
            )}

            {/* Destaque HORIZONTAL com MÚLTIPLAS POSIÇÕES */}
            {isHorizontal && hasMultiplePosicoes && (
              <p className="text-slate-600">
                <span className="text-slate-400">→</span>{' '}
                Com o formato Horizontal e{' '}
                <span className="font-semibold text-slate-800">{quantidadePosicoes} marcas</span>, 
                sua empresa pode manter{' '}
                <span className="font-semibold text-[#9C1E1E]">{totalVideosSimultaneos} vídeos simultâneos</span>{' '}
                na plataforma ({maxVideosPorPedido} vídeos × {quantidadePosicoes} posições), distribuindo campanhas diferentes por dia,
                horário, QR Code, lançamento ou promoção específica.
              </p>
            )}

            {/* Botão de demonstração do agendamento */}
            {isHorizontal && (
              <div className="pt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowVideoDemo(true)}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-[#9C1E1E]/20 bg-[#9C1E1E]/5 px-4 py-2 text-sm font-medium text-[#9C1E1E] transition-all duration-300 hover:bg-[#9C1E1E]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C1E1E]/30"
                >
                  <span className="absolute left-3 inline-flex h-3 w-3 rounded-full bg-[#9C1E1E]/25 motion-safe:animate-ping" />
                  <span className="relative flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9C1E1E]/15">
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </span>
                    Veja como funciona o agendamento
                  </span>
                </button>
              </div>
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

      <FullscreenVideoPlayer
        isOpen={showVideoDemo}
        onClose={() => setShowVideoDemo(false)}
        videoSrc={SUPABASE_VIDEO_URL}
      />
    </Card>
  );
}
