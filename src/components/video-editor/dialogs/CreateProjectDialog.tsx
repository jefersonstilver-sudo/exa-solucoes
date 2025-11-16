import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useVideoEditorProjects } from '@/hooks/video-editor/useVideoEditorProjects';
import { Loader2 } from 'lucide-react';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateProjectDialog = ({ open, onOpenChange }: CreateProjectDialogProps) => {
  const navigate = useNavigate();
  const { createProject, isCreating } = useVideoEditorProjects();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  const handleCreate = () => {
    const canvasSettings = {
      '16:9': { width: 1280, height: 720 },
      '9:16': { width: 720, height: 1280 },
      '1:1': { width: 1080, height: 1080 },
    };

    const canvas = canvasSettings[aspectRatio];

    createProject(
      {
        title: title || 'Novo Projeto',
        description,
        project_data: {
          timeline: [],
          canvas: {
            width: canvas.width,
            height: canvas.height,
            background_color: '#000000',
            aspect_ratio: aspectRatio,
          },
          effects: [],
          transitions: [],
          audio_tracks: [],
        },
      },
      {
        onSuccess: (newProject) => {
          onOpenChange(false);
          navigate(`/anunciante/editor-video/${newProject.id}`);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto</DialogTitle>
          <DialogDescription>
            Configure seu novo projeto de vídeo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Projeto</Label>
            <Input
              id="title"
              placeholder="Ex: Vídeo Promocional"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva seu projeto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Formato do Vídeo</Label>
            <RadioGroup value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="16:9" id="16:9" />
                <Label htmlFor="16:9" className="font-normal cursor-pointer">
                  16:9 - YouTube, Horizontal (1280x720)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="9:16" id="9:16" />
                <Label htmlFor="9:16" className="font-normal cursor-pointer">
                  9:16 - Instagram Stories, TikTok (720x1280)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1:1" id="1:1" />
                <Label htmlFor="1:1" className="font-normal cursor-pointer">
                  1:1 - Instagram Feed, Quadrado (1080x1080)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Projeto'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
