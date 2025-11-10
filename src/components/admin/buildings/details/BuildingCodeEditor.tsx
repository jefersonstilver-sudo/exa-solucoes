import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Hash, Save, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateBuildingCode } from '@/services/buildingsOperationsService';

interface BuildingCodeEditorProps {
  building: any;
  onUpdate: () => void;
}

const BuildingCodeEditor: React.FC<BuildingCodeEditorProps> = ({ building, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newCode, setNewCode] = useState(building?.codigo_predio || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newCode || newCode.trim() === '') {
      toast.error('Código do prédio não pode estar vazio');
      return;
    }

    if (newCode === building?.codigo_predio) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await updateBuildingCode(building.id, newCode.trim());
      toast.success('Código do prédio atualizado com sucesso!');
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao atualizar código:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('Este código já está em uso por outro prédio');
      } else {
        toast.error('Erro ao atualizar código do prédio');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewCode(building?.codigo_predio || '');
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Hash className="h-5 w-5 mr-2" />
            Código do Prédio
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isEditing ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {building?.codigo_predio || 'Sem código'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              (usado no link público)
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Digite o código do prédio (ex: 001)"
                maxLength={10}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este código será usado no link público: /comercial/{building?.nome?.toLowerCase()?.replace(/\s+/g, '-')}/{newCode}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                size="sm"
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BuildingCodeEditor;
