import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, Video, AlertTriangle } from 'lucide-react';
import { VideoTitleInput } from '@/components/video-upload/VideoTitleInput';
import { VideoUploadScheduleForm, ScheduleRule } from '@/components/video-upload/VideoUploadScheduleForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateVideoFile } from '@/services/videoStorageService';
import { VideoTrimmerModal } from '@/components/video-trimmer/VideoTrimmerModal';
import { VideoQRConfig, VideoQRConfigData } from './VideoQRConfig';
interface VideoSlotUploadProps {
  slotPosition: number;
  uploading: boolean;
  isUploading: boolean;
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: ScheduleRule[], qrConfig?: VideoQRConfigData | null) => void;
  companyInfoComplete?: boolean;
  tipoProduto?: string;
}
export const VideoSlotUpload: React.FC<VideoSlotUploadProps> = ({
  slotPosition,
  uploading,
  isUploading,
  onUpload,
  companyInfoComplete: companyInfoCompleteProp,
  tipoProduto
}) => {
  const isVertical = tipoProduto === 'vertical_premium' || tipoProduto === 'vertical';
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [companyInfoComplete, setCompanyInfoComplete] = useState(false);
  const [checkingCompanyInfo, setCheckingCompanyInfo] = useState(companyInfoCompleteProp === undefined);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [trimmerFile, setTrimmerFile] = useState<File | null>(null);
  const [trimmerMaxDuration, setTrimmerMaxDuration] = useState(10);
  const [qrConfig, setQrConfig] = useState<VideoQRConfigData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Object URL para o preview do vídeo no seletor de localização do QR
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    // Se recebeu a prop do pai, usar ela e não verificar
    if (companyInfoCompleteProp !== undefined) {
      setCompanyInfoComplete(companyInfoCompleteProp);
      setCheckingCompanyInfo(false);
      return;
    }
    
    // Caso contrário, verificar (fallback)
    checkCompanyInfo();
  }, [companyInfoCompleteProp]);
  const checkCompanyInfo = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        setCompanyInfoComplete(false);
        setCheckingCompanyInfo(false);
        return;
      }
      const {
        data,
        error
      } = await supabase.from('users').select('empresa_nome, empresa_pais, empresa_documento, empresa_segmento, empresa_aceite_termo').eq('id', user.id).single();
      if (error) throw error;
      const isComplete = !!(data?.empresa_nome && data?.empresa_pais && data?.empresa_documento && data?.empresa_segmento && data?.empresa_aceite_termo);
      setCompanyInfoComplete(isComplete);
    } catch (error) {
      console.error('Erro ao verificar informações da empresa:', error);
      setCompanyInfoComplete(false);
    } finally {
      setCheckingCompanyInfo(false);
    }
  };
  const validateTitle = (title: string): boolean => {
    if (!title.trim()) {
      setTitleError('Título é obrigatório');
      return false;
    }
    if (title.length < 3) {
      setTitleError('Título deve ter pelo menos 3 caracteres');
      return false;
    }
    if (title.length > 50) {
      setTitleError('Título deve ter no máximo 50 caracteres');
      return false;
    }
    setTitleError('');
    return true;
  };
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione um arquivo de vídeo válido (MP4, MOV, AVI)');
      return;
    }

    // Validar tamanho (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 100MB');
      return;
    }

    // Run full validation to check duration
    const tipo = isVertical ? 'vertical' : 'horizontal';
    const validation = await validateVideoFile(file, tipo);

    if (validation.needsTrimming && validation.maxDuration) {
      console.log('✂️ Vídeo excede duração, abrindo trimmer');
      setTrimmerFile(file);
      setTrimmerMaxDuration(validation.maxDuration);
      setShowTrimmer(true);
      return;
    }

    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    setSelectedFile(file);
  };

  const handleTrimComplete = (trimmedFile: File) => {
    console.log('✅ Vídeo cortado:', trimmedFile.name);
    setShowTrimmer(false);
    setTrimmerFile(null);
    setSelectedFile(trimmedFile);
    toast.success('Vídeo cortado com sucesso!');
  };

  const handleTrimmerClose = () => {
    setShowTrimmer(false);
    setTrimmerFile(null);
  };

  // Upload direto sem agendamento
  const handleDirectUpload = async () => {
    console.log('🚀 [VideoSlotUpload] handleDirectUpload iniciado', {
      slotPosition,
      hasFile: !!selectedFile,
      fileName: selectedFile?.name,
      videoTitle,
      companyInfoComplete,
      uploading,
      isUploading
    });
    if (!companyInfoComplete) {
      console.warn('⚠️ [VideoSlotUpload] Cadastro da empresa incompleto');
      toast.error('Complete o cadastro da empresa antes de fazer upload');
      navigate('/anunciante/configuracoes');
      return;
    }
    if (!validateTitle(videoTitle)) {
      console.warn('⚠️ [VideoSlotUpload] Validação de título falhou');
      return;
    }
    if (!selectedFile) {
      console.warn('⚠️ [VideoSlotUpload] Nenhum arquivo selecionado');
      toast.error('Por favor, selecione um arquivo de vídeo');
      return;
    }
    try {
      console.log('📤 [VideoSlotUpload] Chamando onUpload...', {
        slotPosition,
        fileName: selectedFile.name,
        videoTitle
      });

      // Sem toast otimista. O progresso real é mostrado pelo card do slot.
      await onUpload(slotPosition, selectedFile, videoTitle, undefined, qrConfig);
      console.log('✅ [VideoSlotUpload] onUpload completado com sucesso');

      // Enviar email de confirmação de recebimento (não-bloqueante)
      try {
        console.log('📧 [VideoSlotUpload] Tentando enviar email de confirmação...');
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          // Buscar pedido mais recente do usuário
          const {
            data: pedido
          } = await supabase.from('pedidos').select('id').eq('client_id', user.id).order('created_at', {
            ascending: false
          }).limit(1).single();
          if (pedido?.id) {
            console.log('📧 Enviando email de vídeo recebido para pedido:', pedido.id);
            const {
              error: emailError
            } = await supabase.functions.invoke('video-notification-service', {
              body: {
                action: 'video_submitted',
                pedido_id: pedido.id,
                video_title: videoTitle || 'Seu Vídeo'
              }
            });
            if (emailError) {
              console.warn('⚠️ Erro ao enviar email:', emailError);
            } else {
              console.log('✅ Email de confirmação enviado!');
            }
          }
        }
      } catch (emailErr) {
        console.warn('⚠️ Falha ao enviar email de confirmação:', emailErr);
      }

      // Reset somente em sucesso
      console.log('🔄 [VideoSlotUpload] Resetando formulário');
      setSelectedFile(null);
      setVideoTitle('');
      setTitleError('');
      setQrConfig(null);
    } catch (error) {
      console.error('💥 [VideoSlotUpload] Erro no upload:', error);
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      // Mantém arquivo e título para o usuário poder tentar novamente
      toast.error(`Erro ao enviar vídeo: ${msg}`);
    }
  };
  const qrIncomplete = !!qrConfig?.enabled && (!qrConfig?.redirect_url?.trim() || !qrConfig?.position);
  const canUpload = !!selectedFile && !!videoTitle.trim() && !uploading && !isUploading && !qrIncomplete;
  if (checkingCompanyInfo) {
    return <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-exa-red mr-3" />
          <p className="text-gray-600">Verificando informações...</p>
        </div>
      </div>;
  }
  if (!companyInfoComplete) {
    return <div className="border-2 border-amber-500 bg-amber-50 rounded-lg p-8 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-600 mb-4" />
        <h3 className="text-xl font-semibold text-amber-900 mb-2">
          Cadastro de Empresa Pendente
        </h3>
        <p className="text-amber-800 mb-6">
          Para fazer upload de vídeos, você precisa completar o cadastro da empresa/marca que será divulgada.
        </p>
        <Button onClick={() => navigate('/anunciante/configuracoes')} className="bg-amber-600 hover:bg-amber-700 text-white">
          Completar Cadastro Agora
        </Button>
      </div>;
  }
  return <div className={`rounded-xl p-3 sm:p-4 text-center transition-all duration-300 ${selectedFile ? 'border-2 border-green-400 bg-green-50/60 shadow-md' : 'border border-border bg-background/50'}`}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" id={`file-upload-${slotPosition}`} />
      
      <div className="space-y-3 sm:space-y-3">
        <VideoTitleInput title={videoTitle} onTitleChange={setVideoTitle} error={titleError} placeholder={`Título do vídeo ${slotPosition}`} />
        
        <label htmlFor={`file-upload-${slotPosition}`}>
          <Button asChild variant="outline" className="w-full cursor-pointer h-10 sm:h-9 text-sm sm:text-xs px-3 rounded-xl sm:rounded-md" disabled={uploading || isUploading}>
            <span className="flex items-center justify-center gap-2">
              <Video className="h-4 w-4" />
              {selectedFile ? selectedFile.name.length > 25 ? selectedFile.name.substring(0, 25) + '...' : selectedFile.name : 'Selecionar Vídeo'}
            </span>
          </Button>
        </label>
        
        {selectedFile && <div className="text-xs sm:text-xs text-green-800 bg-green-100 p-2.5 sm:p-2 rounded-xl sm:rounded border border-green-300">
            <div className="truncate"><strong>Arquivo:</strong> {selectedFile.name}</div>
            <div><strong>Tamanho:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</div>
          </div>}
      </div>

      {/* QR rastreável (captação antes do envio) */}
      <div className="mt-3">
        <VideoQRConfig
          value={qrConfig}
          onChange={setQrConfig}
          disabled={uploading || isUploading}
          hasVideoSelected={!!selectedFile}
          videoUrl={previewUrl}
          orientation={isVertical ? 'vertical' : 'horizontal'}
        />
      </div>

      {/* Botão principal - Upload direto */}
      <Button onClick={handleDirectUpload} disabled={!canUpload} className="w-full mt-3 sm:mt-3 h-11 sm:h-9 text-sm sm:text-sm rounded-xl sm:rounded-md">
        {uploading || isUploading ? <>
            <Loader2 className="h-4 w-4 sm:h-4 sm:w-4 animate-spin mr-1.5" />
            Enviando...
          </> : 'Enviar Vídeo'}
      </Button>

      {/* Debug info - remover em produção */}
      {import.meta.env.DEV}

      {/* Video Trimmer Modal */}
      {trimmerFile && (
        <VideoTrimmerModal
          file={trimmerFile}
          maxDuration={trimmerMaxDuration}
          isOpen={showTrimmer}
          onClose={handleTrimmerClose}
          onTrimComplete={handleTrimComplete}
        />
      )}
    </div>;
};