import React from 'react';
import { Building2, Tv, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProposalBuildingCardProps {
  building: {
    building_id?: string;
    building_name?: string;
    nome?: string;
    bairro?: string;
    endereco?: string;
    quantidade_telas?: number;
    visualizacoes_mes?: number;
    imagem_principal?: string | null;
    imageurl?: string | null;
    publico_estimado?: number;
  };
  index: number;
}

export const ProposalBuildingCard: React.FC<ProposalBuildingCardProps> = ({ building, index }) => {
  const telas = building.quantidade_telas || 1;
  const exibicoesPorTela = 11610;
  const exibicoesTotais = telas * exibicoesPorTela;
  const nome = building.building_name || building.nome || 'Local';
  const bairro = building.bairro || '';
  
  // Buscar imagem - tentar imagem_principal primeiro, depois imageurl
  const imagemUrl = building.imagem_principal || building.imageurl;

  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Badge numérico */}
      <Badge 
        className="absolute top-2 left-2 z-10 bg-[#9C1E1E] text-white text-[10px] font-bold px-2 py-0.5 shadow-md"
      >
        {index}
      </Badge>

      {/* Imagem do prédio */}
      <div className="relative h-24 sm:h-28 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {imagemUrl ? (
          <img 
            src={imagemUrl} 
            alt={nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-10 w-10 text-slate-300" />
          </div>
        )}
        
        {/* Overlay com gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Conteúdo */}
      <div className="p-2.5 sm:p-3 space-y-2">
        {/* Nome e Bairro */}
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 truncate leading-tight">
            {nome}
          </h4>
          {bairro && (
            <p className="text-[10px] sm:text-xs text-slate-500 truncate mt-0.5">
              📍 {bairro}
            </p>
          )}
        </div>

        {/* Métricas */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-600">
            <Tv className="h-3 w-3 text-[#9C1E1E]" />
            <span className="font-medium">{telas}</span>
            <span className="text-slate-400">{telas === 1 ? 'tela' : 'telas'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-600">
            <Eye className="h-3 w-3 text-slate-400" />
            <span className="font-medium">{(exibicoesTotais / 1000).toFixed(0)}k</span>
            <span className="text-slate-400 hidden sm:inline">/mês</span>
          </div>
        </div>
      </div>
    </div>
  );
};
