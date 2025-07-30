import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CampanhaPortfolio } from '@/hooks/useCampanhasPortfolio';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  editingCampanha: CampanhaPortfolio | null;
  existingCategories: string[];
}

const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingCampanha,
  existingCategories
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    cliente: '',
    categoria: '',
    descricao: '',
    url_video: ''
  });
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlValidation, setUrlValidation] = useState<{
    isValid: boolean;
    message: string;
    isValidating: boolean;
  }>({
    isValid: false,
    message: '',
    isValidating: false
  });

  useEffect(() => {
    if (editingCampanha) {
      setFormData({
        titulo: editingCampanha.titulo,
        cliente: editingCampanha.cliente,
        categoria: editingCampanha.categoria,
        descricao: editingCampanha.descricao || '',
        url_video: editingCampanha.url_video
      });
      setUseCustomCategory(false);
      setCustomCategory('');
      validateUrl(editingCampanha.url_video);
    } else {
      setFormData({
        titulo: '',
        cliente: '',
        categoria: '',
        descricao: '',
        url_video: ''
      });
      setUseCustomCategory(false);
      setCustomCategory('');
      setUrlValidation({ isValid: false, message: '', isValidating: false });
    }
  }, [editingCampanha, isOpen]);

  const validateUrl = async (url: string) => {
    if (!url.trim()) {
      setUrlValidation({ isValid: false, message: '', isValidating: false });
      return;
    }

    setUrlValidation({ isValid: false, message: '', isValidating: true });

    try {
      // Validação básica de URL
      new URL(url);

      // Verificar se é URL de vídeo suportada
      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
      const isGoogleDrive = url.includes('drive.google.com');
      const isVimeo = url.includes('vimeo.com');

      if (isYoutube || isGoogleDrive || isVimeo) {
        setUrlValidation({
          isValid: true,
          message: `URL válida (${isYoutube ? 'YouTube' : isGoogleDrive ? 'Google Drive' : 'Vimeo'})`,
          isValidating: false
        });
      } else {
        setUrlValidation({
          isValid: false,
          message: 'URL não reconhecida. Use YouTube, Vimeo ou Google Drive.',
          isValidating: false
        });
      }
    } catch {
      setUrlValidation({
        isValid: false,
        message: 'URL inválida. Verifique o formato.',
        isValidating: false
      });
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url_video: url }));
    
    // Debounce validation
    setTimeout(() => {
      validateUrl(url);
    }, 500);
  };

  const openPreview = () => {
    if (formData.url_video) {
      window.open(formData.url_video, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.cliente.trim() || !formData.url_video.trim()) {
      return;
    }

    if (!urlValidation.isValid) {
      return;
    }

    const finalCategory = useCustomCategory ? customCategory.trim() : formData.categoria;
    if (!finalCategory) {
      return;
    }

    setIsSubmitting(true);

    const submitData = {
      ...formData,
      categoria: finalCategory,
      titulo: formData.titulo.trim(),
      cliente: formData.cliente.trim(),
      descricao: formData.descricao.trim()
    };

    const success = await onSubmit(submitData);
    
    if (success) {
      onClose();
    }
    
    setIsSubmitting(false);
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setUseCustomCategory(true);
      setFormData(prev => ({ ...prev, categoria: '' }));
    } else {
      setUseCustomCategory(false);
      setCustomCategory('');
      setFormData(prev => ({ ...prev, categoria: value }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCampanha ? 'Editar Vídeo do Portfólio' : 'Adicionar Novo Vídeo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Vídeo *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ex: Campanha Institucional 2024"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.titulo.length}/100 caracteres
            </p>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente *</Label>
            <Input
              id="cliente"
              value={formData.cliente}
              onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
              placeholder="Ex: Empresa XYZ"
              maxLength={80}
              required
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            {!useCustomCategory ? (
              <Select onValueChange={handleCategoryChange} value={formData.categoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {existingCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">+ Nova categoria</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Digite a nova categoria"
                  maxLength={50}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUseCustomCategory(false)}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          {/* URL do Vídeo */}
          <div className="space-y-2">
            <Label htmlFor="url_video">URL do Vídeo *</Label>
            <div className="flex gap-2">
              <Input
                id="url_video"
                value={formData.url_video}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=... ou https://drive.google.com/..."
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={openPreview}
                disabled={!urlValidation.isValid}
                title="Abrir prévia"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Validação da URL */}
            {urlValidation.isValidating && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando URL...
              </div>
            )}
            
            {!urlValidation.isValidating && urlValidation.message && (
              <Alert className={urlValidation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertCircle className={`h-4 w-4 ${urlValidation.isValid ? 'text-green-600' : 'text-red-600'}`} />
                <AlertDescription className={urlValidation.isValid ? 'text-green-700' : 'text-red-700'}>
                  {urlValidation.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Breve descrição do vídeo ou contexto da campanha..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {formData.descricao.length}/500 caracteres
            </p>
          </div>

          {/* Instruções */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Dicas para URLs:</strong><br />
              • <strong>Google Drive:</strong> Compartilhe o arquivo e cole o link direto<br />
              • <strong>YouTube:</strong> Use a URL completa da página do vídeo<br />
              • <strong>Vimeo:</strong> Use a URL completa da página do vídeo
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.titulo.trim() ||
                !formData.cliente.trim() ||
                !formData.url_video.trim() ||
                !urlValidation.isValid ||
                (!useCustomCategory && !formData.categoria) ||
                (useCustomCategory && !customCategory.trim())
              }
              className="bg-indexa-purple hover:bg-indexa-purple/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {editingCampanha ? 'Atualizando...' : 'Criando...'}
                </>
              ) : (
                editingCampanha ? 'Atualizar Vídeo' : 'Adicionar Vídeo'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioModal;