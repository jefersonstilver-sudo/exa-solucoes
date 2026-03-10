
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoSlotCard } from './VideoSlotCard';
import { VideoSlotStatus } from './VideoSlotStatus';
import { useCurrentVideoDisplay } from '@/hooks/useCurrentVideoDisplay';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VideoSlot {
  id?: string;
  slot_position: number;
  video_id?: string;
  is_active: boolean;
  selected_for_display: boolean;
  is_base_video: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  video_data?: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
    tem_audio: boolean;
    tamanho_arquivo?: number;
    formato?: string;
  };
  rejection_reason?: string;
  schedule_rules?: {
    id: string;
    days_of_week: number[];
    start_time: string;
    end_time: string;
    is_active: boolean;
  }[];
}

interface VideoSlotGridProps {
  videoSlots: VideoSlot[];
  uploading: boolean;
  uploadProgress: { [key: number]: number };
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: any[]) => void;
  onActivate: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onDownload?: (videoUrl: string, fileName: string) => void;
  onSetBaseVideo?: (slotId: string) => void;
  onScheduleVideo?: (videoId: string, scheduleRules: any[]) => Promise<void>;
  orderId: string;
  tipoProduto?: string;
}

export const VideoSlotGrid: React.FC<VideoSlotGridProps> = ({
  videoSlots,
  uploading,
  uploadProgress,
  onUpload,
  onActivate,
  onRemove,
  onDownload,
  onSetBaseVideo,
  onScheduleVideo,
  orderId,
  tipoProduto
}) => {
  const isVertical = tipoProduto === 'vertical_premium' || tipoProduto === 'vertical';
  const navigate = useNavigate();
  const { currentVideo, refreshCurrentVideo } = useCurrentVideoDisplay({ orderId, enabled: true });
  const [companyInfoComplete, setCompanyInfoComplete] = useState<boolean | null>(null);

  // Verificar cadastro de empresa
  useEffect(() => {
    const checkCompanyInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCompanyInfoComplete(false);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('empresa_nome, empresa_pais, empresa_documento, empresa_segmento, empresa_aceite_termo')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const isComplete = !!(
          data?.empresa_nome && 
          data?.empresa_pais && 
          data?.empresa_documento && 
          data?.empresa_segmento && 
          data?.empresa_aceite_termo
        );
        
        setCompanyInfoComplete(isComplete);
      } catch (error) {
        console.error('Erro ao verificar informações da empresa:', error);
        setCompanyInfoComplete(false);
      }
    };
    
    checkCompanyInfo();
  }, []);

  // Atualizar currentVideo quando videoSlots mudar (importante para mudanças de vídeo base)
  useEffect(() => {
    if (videoSlots.length > 0) {
      console.log('🔄 [GRID] Slots atualizados, forçando refresh do vídeo atual');
      refreshCurrentVideo();
    }
  }, [videoSlots, refreshCurrentVideo]);

  // Log para debug do re-render
  console.log('🔄 [GRID] VideoSlotGrid renderizando:', {
    orderId,
    totalSlots: videoSlots.length,
    slotsWithSelection: videoSlots.map(slot => ({
      position: slot.slot_position,
      hasVideo: !!slot.video_data,
      videoName: slot.video_data?.nome,
      selectedForDisplay: slot.selected_for_display,
      slotId: slot.id
    }))
  });

  // Contar vídeos aprovados
  const totalApprovedVideos = videoSlots.filter(slot => 
    slot.approval_status === 'approved'
  ).length;

  // Verificar se há algum vídeo agendado ativo AGORA (em qualquer slot)
  const hasAnyScheduledActiveNow = videoSlots.some(slot => {
    if (!slot.schedule_rules || slot.schedule_rules.length === 0) return false;
    
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    return slot.schedule_rules.some(rule => {
      if (!rule.is_active) return false;
      
      // Verificar se hoje está nos dias programados
      const isDayMatched = rule.days_of_week.includes(currentDay);
      
      // Verificar se está no horário programado
      const isTimeMatched = currentTime >= rule.start_time && currentTime <= rule.end_time;
      
      return isDayMatched && isTimeMatched;
    });
  });

  console.log('🔍 [GRID] Status de agendamento:', {
    hasAnyScheduledActiveNow,
    currentTime: new Date().toTimeString().slice(0, 5),
    currentDay: new Date().getDay()
  });

  // Se cadastro ainda está sendo verificado, não renderizar nada
  if (companyInfoComplete === null) {
    return <div className="space-y-2 sm:space-y-3">
      <VideoSlotStatus videoSlots={videoSlots} />
      <div className="text-center py-8 text-muted-foreground">Verificando informações...</div>
    </div>;
  }

  // Se cadastro incompleto, mostrar aviso centralizado + slots bloqueados
  if (companyInfoComplete === false) {
    return (
      <div className="space-y-2 sm:space-y-3">
        <VideoSlotStatus videoSlots={videoSlots} />
        
        {/* Aviso Centralizado */}
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 sm:p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-amber-500 mb-3" />
          <h3 className="text-base sm:text-lg font-semibold text-amber-900 mb-2">
            Cadastro de Empresa Pendente
          </h3>
          <p className="text-sm text-amber-700 mb-4">
            Complete o cadastro para liberar o upload de vídeos
          </p>
          <Button 
            onClick={() => navigate('/anunciante/configuracoes')} 
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Completar Cadastro Agora
          </Button>
        </div>

        {/* Slots Bloqueados - Visual Apenas */}
        <div className={`grid ${isVertical ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' : 'grid-cols-2'} gap-1.5 sm:gap-3 opacity-40 pointer-events-none`}>
          {videoSlots.map((slot) => (
            <div 
              key={slot.slot_position}
              className="bg-gray-100 border border-gray-300 rounded-lg p-4 sm:p-6 text-center"
            >
              <Lock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-gray-400 mb-2" />
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Slot {slot.slot_position}</span>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Bloqueado</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Cadastro completo - renderizar normalmente
  return (
    <div className="space-y-2 sm:space-y-3">
      <VideoSlotStatus videoSlots={videoSlots} />

      <div className={`grid ${isVertical ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' : 'grid-cols-2'} gap-1.5 sm:gap-3`}>
        {videoSlots.map((slot) => (
          <VideoSlotCard
            key={slot.slot_position}
            slot={slot}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onUpload={onUpload}
            onActivate={onActivate}
            onRemove={onRemove}
            onDownload={onDownload}
            onSetBaseVideo={onSetBaseVideo}
            onScheduleVideo={onScheduleVideo}
            orderId={orderId}
            currentDisplayVideoId={currentVideo?.video_id}
            totalApprovedVideos={totalApprovedVideos}
            hasAnyScheduledActiveNow={hasAnyScheduledActiveNow}
            companyInfoComplete={companyInfoComplete}
            tipoProduto={tipoProduto}
          />
        ))}
      </div>
    </div>
  );
};
