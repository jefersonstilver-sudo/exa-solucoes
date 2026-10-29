
import React, { useEffect, useState } from 'react';
import TermoAceiteInline from '@/components/settings/TermoAceiteInline';
import { useNavigate } from 'react-router-dom';
import { VideoSlotCard } from './VideoSlotCard';
import { VideoSlotStatus } from './VideoSlotStatus';
import { useCurrentVideoDisplay } from '@/hooks/useCurrentVideoDisplay';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveAuth } from '@/hooks/useEffectiveAuth';

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
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: any[], qrConfig?: any) => void;
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
  const { userProfile } = useEffectiveAuth();
  const { currentVideo, refreshCurrentVideo } = useCurrentVideoDisplay({ orderId, enabled: true });
  const [companyInfoComplete, setCompanyInfoComplete] = useState<boolean | null>(null);

  // Só aparecem os vídeos que existem + UM formulário de envio (aberto quando não há vídeo nenhum
  // ou quando o cliente toca em "Adicionar vídeo"). Antes eram 10 formulários "Slot 1..10" empilhados.
  const ocupado = (s: VideoSlot) => !!(s.video_data || s.id || uploadProgress[s.slot_position] !== undefined);
  const ocupados = videoSlots.filter(ocupado);
  const proximoLivre = videoSlots.find((s) => !ocupado(s));
  const [adicionando, setAdicionando] = useState(false);
  useEffect(() => { setAdicionando(false); }, [ocupados.length]);
  const formAberto = !!proximoLivre && (ocupados.length === 0 || adicionando);
  const visiveis = videoSlots.filter((s) => ocupado(s) || (formAberto && s === proximoLivre));

  // Verificar cadastro de empresa
  useEffect(() => {
    const checkCompanyInfo = async () => {
      try {
        const effectiveUserId = (userProfile as any)?.id;
        if (!effectiveUserId) {
          setCompanyInfoComplete(false);
          return;
        }

        const profileHasCompleteCompany = !!(
          (userProfile as any)?.empresa_aceite_termo
        );
        if (profileHasCompleteCompany) {
          setCompanyInfoComplete(true);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('empresa_nome, empresa_pais, empresa_documento, empresa_segmento, empresa_aceite_termo')
          .eq('id', effectiveUserId)
          .single();

        if (error) throw error;

        const isComplete = !!(
          data?.empresa_aceite_termo
        );
        
        setCompanyInfoComplete(isComplete);
      } catch (error) {
        console.error('Erro ao verificar informações da empresa:', error);
        setCompanyInfoComplete(false);
      }
    };
    
    checkCompanyInfo();
  }, [userProfile]);


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


  // Se cadastro ainda está sendo verificado, não renderizar nada
  if (companyInfoComplete === null) {
    return <div className="space-y-2 sm:space-y-3">
      <VideoSlotStatus videoSlots={videoSlots} />
      <div className="space-y-3" aria-label="Carregando vídeos">
        {[0, 1].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-2xl bg-[#f3eff0]" />)}
      </div>
    </div>;
  }

  // Se cadastro incompleto, mostrar aviso centralizado + slots bloqueados
  if (companyInfoComplete === false) {
    return (
      <div className="space-y-2 sm:space-y-3">
        <VideoSlotStatus videoSlots={videoSlots} />
        
        {/* Aviso Centralizado */}
        <TermoAceiteInline userId={(userProfile as any)?.id} onAccepted={() => setCompanyInfoComplete(true)} />

      </div>
    );
  }

  // Cadastro completo - renderizar normalmente
  return (
    <div className="space-y-2 sm:space-y-3">
      <VideoSlotStatus videoSlots={videoSlots} />

      <div className={`grid ${isVertical ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' : 'grid-cols-1 sm:grid-cols-2'} gap-3 sm:gap-3`}>
        {visiveis.map((slot) => (
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

      {proximoLivre && !formAberto && (
        <button
          type="button"
          onClick={() => setAdicionando(true)}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#e3d9dc] bg-white text-sm font-bold text-[#9C1E1E] transition-colors hover:border-[#9C1E1E]/40 hover:bg-[#fdf6f7] active:scale-[.99]"
        >
          <Plus className="h-4 w-4" /> Adicionar vídeo
          <span className="font-semibold text-[#8b8285]">· {ocupados.length} de {videoSlots.length}</span>
        </button>
      )}
      {formAberto && ocupados.length > 0 && !uploading && (
        <button type="button" onClick={() => setAdicionando(false)} className="mx-auto block min-h-[40px] px-4 text-sm font-semibold text-[#8b8285]">
          Cancelar
        </button>
      )}
    </div>
  );
};
