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
      if (!buildingCode) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Buscando prédio:', { buildingSlug, buildingCode });

        // Buscar prédio pelo código (mais confiável)
        const { data, error } = await supabase
          .from('buildings')
          .select('id, nome, codigo_predio')
          .eq('codigo_predio', buildingCode)
          .eq('status', 'ativo')
          .maybeSingle();

        if (error) {
          console.error('❌ Erro ao buscar prédio:', error);
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!data) {
          console.warn('⚠️ Prédio não encontrado:', { buildingCode });
          setNotFound(true);
          setLoading(false);
          return;
        }

        console.log('✅ Prédio encontrado:', data);
        setBuildingId(data.id);
        setLoading(false);
      } catch (err) {
        console.error('💥 Erro crítico:', err);
        setNotFound(true);
        setLoading(false);
      }
    };

    fetchBuildingBySlugAndCode();
  }, [buildingSlug, buildingCode]);

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
