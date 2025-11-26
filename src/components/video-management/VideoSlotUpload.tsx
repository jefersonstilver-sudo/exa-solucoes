import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, Video, AlertTriangle } from 'lucide-react';
import { VideoTitleInput } from '@/components/video-upload/VideoTitleInput';
import { VideoUploadScheduleForm, ScheduleRule } from '@/components/video-upload/VideoUploadScheduleForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
interface VideoSlotUploadProps {
  slotPosition: number;
  uploading: boolean;
  isUploading: boolean;
  onUpload: (slotPosition: number, file: File, title: string, scheduleRules?: ScheduleRule[]) => void;
}
export const VideoSlotUpload: React.FC<VideoSlotUploadProps> = ({
  slotPosition,
  uploading,
  isUploading,
  onUpload
}) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [companyInfoComplete, setCompanyInfoComplete] = useState(false);
  const [checkingCompanyInfo, setCheckingCompanyInfo] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    checkCompanyInfo();
  }, []);
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
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setSelectedFile(file);
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
      toast.loading('Iniciando upload do vídeo...', {
        id: 'upload-toast'
      });
      await onUpload(slotPosition, selectedFile, videoTitle);
      console.log('✅ [VideoSlotUpload] onUpload completado com sucesso');
      toast.success('Upload concluído!', {
        id: 'upload-toast'
      });

      // Enviar email de confirmação de recebimento
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

      // Reset after upload
      console.log('🔄 [VideoSlotUpload] Resetando formulário');
      setSelectedFile(null);
      setVideoTitle('');
      setTitleError('');
    } catch (error) {
      console.error('💥 [VideoSlotUpload] Erro no upload:', error);
      toast.error(`Erro ao fazer upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        id: 'upload-toast'
      });
    }
  };
  const canUpload = selectedFile && videoTitle.trim() && !uploading && !isUploading;
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
  return <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-4 text-center bg-gray-50">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" id={`file-upload-${slotPosition}`} />
      
      <div className="space-y-1.5 sm:space-y-3">
        <div>
          <Video className="h-6 w-6 sm:h-10 sm:w-10 mx-auto mb-1 sm:mb-2 text-gray-400" />
          <p className="text-xs sm:text-sm text-gray-600 font-medium">Clique para enviar seu vídeo</p>
          <p className="text-[10px] sm:text-xs text-gray-500">
            MP4, MOV, AVI (máx. 100MB)
          </p>
        </div>
        
        <VideoTitleInput title={videoTitle} onTitleChange={setVideoTitle} error={titleError} placeholder={`Título do vídeo ${slotPosition}`} />
        
        <label htmlFor={`file-upload-${slotPosition}`}>
          <Button asChild variant="outline" className="w-full cursor-pointer h-7 sm:h-9 text-[10px] sm:text-xs" disabled={uploading || isUploading}>
            <span>
              {selectedFile ? (selectedFile.name.length > 20 ? selectedFile.name.substring(0, 20) + '...' : selectedFile.name) : 'Selecionar Arquivo'}
            </span>
          </Button>
        </label>
        
        {selectedFile && <div className="text-[10px] sm:text-xs text-gray-500 bg-white p-1.5 sm:p-2 rounded border">
            <div className="truncate"><strong>Arquivo:</strong> {selectedFile.name}</div>
            <div><strong>Tamanho:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</div>
          </div>}
      </div>

      {/* Botão principal - Upload direto */}
      <Button onClick={handleDirectUpload} disabled={!canUpload} className="w-full mt-2 sm:mt-3 h-7 sm:h-9 text-xs sm:text-sm">
        {uploading || isUploading ? <>
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1.5" />
            Enviando...
          </> : 'Enviar Vídeo'}
      </Button>

      {/* Debug info - remover em produção */}
      {import.meta.env.DEV}

    </div>;
};