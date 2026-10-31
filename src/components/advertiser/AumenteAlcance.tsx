/**
 * "Aumente seu alcance": porta discreta para a loja (/loja) dentro do app do anunciante.
 * Mostra 3 fachadas reais e quantos prédios/moradores a rede tem — convite, não propaganda.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { usePrediosPublicos } from '@/site/usePrediosPublicos';
import { getImageUrl } from '@/services/buildingStoreService';

const num = (n: number) => Math.round(n).toLocaleString('pt-BR');

export const AumenteAlcance: React.FC<{ jaTem?: number; compacto?: boolean }> = ({ jaTem = 0, compacto }) => {
  const { predios, totalPredios, totalPublico, carregando } = usePrediosPublicos();
  if (carregando || !totalPredios) return null;
  const fotos = predios.filter((p) => p.imagem_principal).sort((a, b) => (b.publico_estimado || 0) - (a.publico_estimado || 0)).slice(0, 3);
  const outros = Math.max(totalPredios - jaTem, 0);

  if (compacto) {
    return (
      <Link to="/loja" className="flex items-center gap-3 rounded-2xl bg-[#0B0B0D] px-4 py-3.5 text-white active:scale-[.99]">
        <span className="flex -space-x-2">
          {fotos.map((p) => <img key={p.id} src={getImageUrl(p.imagem_principal) || ''} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-[#0B0B0D]" loading="lazy" />)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold">Aumente seu alcance</span>
          <span className="block truncate text-[12.5px] text-white/60">Ver os {totalPredios} prédios e preços</span>
        </span>
        <ArrowUpRight className="h-5 w-5 text-white/70" />
      </Link>
    );
  }

  return (
    <Link
      to="/loja"
      className="group relative block overflow-hidden rounded-[22px] bg-[#0B0B0D] p-4 text-white shadow-[0_18px_40px_-24px_rgba(11,11,13,.8)] active:scale-[.99]"
    >
      <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#EA251D]/25 blur-2xl" />
      <span className="relative flex items-center gap-4">
        <span className="flex shrink-0 -space-x-3">
          {fotos.map((p, i) => (
            <img
              key={p.id}
              src={getImageUrl(p.imagem_principal) || ''}
              alt=""
              loading="lazy"
              className="h-12 w-12 rounded-2xl object-cover ring-2 ring-[#0B0B0D]"
              style={{ transform: `rotate(${(i - 1) * 4}deg)` }}
            />
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-extrabold tracking-[-0.01em]">Aumente seu alcance</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-white/65">
            {jaTem > 0 ? `Mais ${outros} prédios` : `${totalPredios} prédios`} em Foz · {num(totalPublico)} moradores na rede
          </span>
        </span>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#0B0B0D] transition-transform group-active:translate-x-0.5">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </span>
    </Link>
  );
};

export default AumenteAlcance;
