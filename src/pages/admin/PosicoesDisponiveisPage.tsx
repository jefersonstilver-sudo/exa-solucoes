import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Monitor, 
  Users, 
  Search, 
  RefreshCw,
  CheckCircle,
  Clock,
  Ban,
  BarChart3,
  Package,
  TrendingUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePosicoesDisponiveis, type PosicoesPredio } from '@/hooks/usePosicoesDisponiveis';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BuildingWithPosicao {
  id: string;
  nome: string;
  bairro: string;
  imagem_principal: string | null;
  numero_elevadores: number | null;
  publico_estimado: number | null;
  posicao: PosicoesPredio | null;
}

const PosicoesDisponiveisPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'lotado'>('all');
  
  const { 
    posicoesMap, 
    totalPosicoes, 
    totalOcupadas, 
    totalReservadas, 
    totalDisponiveis,
    percentualGeral,
    prediosLotados,
    isLoading: isLoadingPosicoes,
    refetch 
  } = usePosicoesDisponiveis();

  // Buscar prédios com imagens
  const { data: predios, isLoading: isLoadingPredios } = useQuery({
    queryKey: ['predios-posicoes-page'],
    queryFn: async () => {
      const { data } = await supabase
        .from('buildings')
        .select('id, nome, bairro, imagem_principal, numero_elevadores, publico_estimado')
        .eq('status', 'ativo')
        .order('nome');
      return data || [];
    }
  });

  // Combinar prédios com posições
  const prediosComPosicao: BuildingWithPosicao[] = (predios || []).map(predio => ({
    ...predio,
    posicao: posicoesMap[predio.id] || null
  }));

  // Filtrar prédios
  const filteredPredios = prediosComPosicao.filter(predio => {
    const matchesSearch = predio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         predio.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterStatus === 'available') {
      return predio.posicao && predio.posicao.disponiveis > 0;
    }
    if (filterStatus === 'lotado') {
      return predio.posicao && predio.posicao.isLotado;
    }
    
    return true;
  });

  const isLoading = isLoadingPosicoes || isLoadingPredios;

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl;
  };

  const getDisponibilidadeBadge = (posicao: PosicoesPredio | null) => {
    if (!posicao) return null;
    
    if (posicao.isLotado) {
      return (
        <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-1">
          <Ban className="h-3 w-3 mr-1" />
          LOTADO
        </Badge>
      );
    }
    
    if (posicao.disponiveis <= 3) {
      return (
        <Badge className="bg-orange-500 text-white text-xs font-medium px-2 py-0.5">
          {posicao.disponiveis} disponíveis
        </Badge>
      );
    }
    
    if (posicao.disponiveis <= 8) {
      return (
        <Badge className="bg-yellow-500 text-white text-xs font-medium px-2 py-0.5">
          {posicao.disponiveis} disponíveis
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-emerald-500 text-white text-xs font-medium px-2 py-0.5">
        {posicao.disponiveis} disponíveis
      </Badge>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Posições Disponíveis
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Controle de estoque de posições por prédio (Horizontal Premium)
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Posições</p>
              <p className="text-xl font-bold text-blue-700">{totalPosicoes}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Ocupadas</p>
              <p className="text-xl font-bold text-emerald-700">{totalOcupadas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-yellow-600 font-medium">Reservadas</p>
              <p className="text-xl font-bold text-yellow-700">{totalReservadas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-500 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Disponíveis</p>
              <p className="text-xl font-bold text-gray-700">{totalDisponiveis}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">Ocupação</p>
              <p className="text-xl font-bold text-purple-700">{percentualGeral}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <Ban className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-medium">Lotados</p>
              <p className="text-xl font-bold text-red-700">{prediosLotados}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === 'available' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('available')}
              className={filterStatus === 'available' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
            >
              Disponíveis
            </Button>
            <Button
              variant={filterStatus === 'lotado' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('lotado')}
              className={filterStatus === 'lotado' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              Lotados
            </Button>
          </div>
        </div>
      </Card>

      {/* Buildings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredPredios.map(predio => (
            <TooltipProvider key={predio.id}>
              <Card 
                className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                  predio.posicao?.isLotado 
                    ? 'opacity-60 grayscale-[30%] ring-2 ring-red-300' 
                    : ''
                }`}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-gray-100">
                  {predio.imagem_principal ? (
                    <img
                      src={getImageUrl(predio.imagem_principal) || ''}
                      alt={predio.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Lotado Overlay */}
                  {predio.posicao?.isLotado && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge className="bg-red-600 text-white text-sm font-bold px-3 py-1 shadow-lg">
                        LOTADO
                      </Badge>
                    </div>
                  )}
                  
                  {/* Disponibilidade Badge */}
                  {!predio.posicao?.isLotado && predio.posicao && (
                    <div className="absolute top-2 right-2">
                      {getDisponibilidadeBadge(predio.posicao)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                  <h3 className="font-semibold text-sm text-gray-900 truncate" title={predio.nome}>
                    {predio.nome}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{predio.bairro}</p>
                  
                  {/* Metrics */}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {predio.numero_elevadores || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {predio.publico_estimado || 0}
                    </span>
                  </div>

                  {/* Position Details */}
                  {predio.posicao && (
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Ocupadas:</span>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5">
                              {predio.posicao.ocupadas}/{predio.posicao.maxClientes}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Posições vendidas (pedidos ativos)</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Reservadas:</span>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] px-1.5">
                              {predio.posicao.reservadas}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Posições reservadas (propostas ativas)</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${
                            predio.posicao.isLotado 
                              ? 'bg-red-500' 
                              : predio.posicao.percentualOcupado > 70 
                                ? 'bg-orange-500' 
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, predio.posicao.percentualOcupado)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 text-center">
                        {predio.posicao.percentualOcupado}% ocupado
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPredios.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum prédio encontrado
          </h3>
          <p className="text-gray-500 text-sm">
            {searchTerm 
              ? 'Tente uma busca diferente' 
              : 'Não há prédios ativos no momento'}
          </p>
        </Card>
      )}
    </div>
  );
};

export default PosicoesDisponiveisPage;
