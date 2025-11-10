import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { parseBuildingParams } from '@/utils/buildingSlugUtils';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';
import BuildingDisplayPanel from './BuildingDisplayPanel';
import BuildingDisplayCommercial from './BuildingDisplayCommercial';
import BuildingDisplayEmbed from './BuildingDisplayEmbed';

/**
 * Public building display router
 * Resolves building by slug+code and renders appropriate display
 * 
 * Routes:
 * - /:slug/:code -> Commercial display (with UI)
 * - /painel/:slug/:code -> Clean panel display (no UI)
 * - /comercial/:slug/:code -> Commercial display (with UI)
 */

interface PublicBuildingDisplayProps {
  variant?: 'panel' | 'commercial' | 'embed';
}

const PublicBuildingDisplay: React.FC<PublicBuildingDisplayProps> = ({ 
  variant = 'commercial' 
}) => {
  const params = useParams();
  const { buildingSlug, buildingCode } = parseBuildingParams(params);
  
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchBuildingBySlugAndCode = async () => {
      console.log('🔍 [PUBLIC DISPLAY] Iniciando busca:', { 
        buildingSlug, 
        buildingCode,
        variant,
        fullPath: window.location.pathname 
      });

      if (!buildingCode) {
        console.error('❌ [PUBLIC DISPLAY] Código do prédio não fornecido');
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        console.log('📡 [PUBLIC DISPLAY] Buscando no banco:', { codigo_predio: buildingCode });

        // Buscar prédio pelo código (mais confiável)
        const { data, error } = await supabase
          .from('buildings')
          .select('id, nome, codigo_predio, status')
          .eq('codigo_predio', buildingCode)
          .maybeSingle();

        console.log('📊 [PUBLIC DISPLAY] Resultado da query:', { data, error });

        if (error) {
          console.error('❌ [PUBLIC DISPLAY] Erro ao buscar prédio:', error);
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!data) {
          console.warn('⚠️ [PUBLIC DISPLAY] Prédio não encontrado com código:', buildingCode);
          // Tentar listar todos os códigos disponíveis para debug
          const { data: allBuildings } = await supabase
            .from('buildings')
            .select('codigo_predio, nome')
            .limit(10);
          console.log('📋 [PUBLIC DISPLAY] Códigos disponíveis:', allBuildings);
          setNotFound(true);
          setLoading(false);
          return;
        }

        console.log('✅ [PUBLIC DISPLAY] Prédio encontrado:', data);
        
        // Verificar se está ativo
        if (data.status !== 'ativo') {
          console.warn('⚠️ [PUBLIC DISPLAY] Prédio não está ativo:', data.status);
        }
        
        setBuildingId(data.id);
        setLoading(false);
      } catch (err) {
        console.error('💥 [PUBLIC DISPLAY] Erro crítico:', err);
        setNotFound(true);
        setLoading(false);
      }
    };

    fetchBuildingBySlugAndCode();
  }, [buildingSlug, buildingCode, variant]);

  if (loading) {
    return <GlobalLoadingPage message="Carregando exibição..." />;
  }

  if (notFound || !buildingId) {
    return <Navigate to="/404" replace />;
  }

  // Render appropriate display variant
  if (variant === 'embed') {
    return <BuildingDisplayEmbed buildingId={buildingId} />;
  }
  
  if (variant === 'panel') {
    return <BuildingDisplayPanel buildingId={buildingId} />;
  }

  return <BuildingDisplayCommercial buildingId={buildingId} />;
};

export default PublicBuildingDisplay;
