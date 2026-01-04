import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Settings, User, Thermometer, Archive, Trash2, 
  AlertTriangle, History, Shield 
} from 'lucide-react';
import { 
  Contact, 
  CategoriaContato, 
  TemperaturaContato,
  CATEGORIAS_CONFIG, 
  CATEGORIAS_ORDER,
  TEMPERATURA_CONFIG 
} from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface TabConfiguracoesProps {
  contact: Contact;
  onUpdate: () => void;
}

export const TabConfiguracoes: React.FC<TabConfiguracoesProps> = ({ contact, onUpdate }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [saving, setSaving] = useState(false);

  const handleUpdateField = async (field: keyof Contact, value: any) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('contacts')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', contact.id);

      if (error) throw error;
      toast.success('Atualizado com sucesso');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    await handleUpdateField('status', contact.status === 'arquivado' ? 'ativo' : 'arquivado');
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;
      toast.success('Contato excluído');
      navigate(buildPath('contatos'));
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-4">
      {/* Alterar Categoria */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4" />
            Categoria do Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-xs">Categoria</Label>
            <Select
              value={contact.categoria}
              onValueChange={(v) => handleUpdateField('categoria', v)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_ORDER.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORIAS_CONFIG[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {CATEGORIAS_CONFIG[contact.categoria].description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alterar Temperatura */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Temperatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-xs">Nível de interesse</Label>
            <Select
              value={contact.temperatura || ''}
              onValueChange={(v) => handleUpdateField('temperatura', v || null)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a temperatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não definido</SelectItem>
                {(Object.keys(TEMPERATURA_CONFIG) as TemperaturaContato[]).map((temp) => (
                  <SelectItem key={temp} value={temp}>
                    {TEMPERATURA_CONFIG[temp].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Status / Arquivar */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Archive className="w-4 h-4" />
            Status do Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Status atual: <span className="capitalize">{contact.status}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {contact.status === 'arquivado' 
                  ? 'Este contato está arquivado e não aparece na listagem principal'
                  : 'Este contato está ativo no sistema'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleArchive}
              disabled={saving}
            >
              <Archive className="w-3.5 h-3.5 mr-1" />
              {contact.status === 'arquivado' ? 'Desarquivar' : 'Arquivar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <History className="w-4 h-4" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">ID</p>
              <p className="font-mono text-xs">{contact.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Criado em</p>
              <p>{new Date(contact.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Atualizado em</p>
              <p>{new Date(contact.updated_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pontuação</p>
              <p>{contact.pontuacao_atual || 0} pontos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="bg-red-50/50 backdrop-blur-sm border-red-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-red-700 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-700">Excluir Contato</p>
              <p className="text-xs text-red-600">
                Esta ação é irreversível. Todos os dados serão perdidos.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir "{contact.nome}"? 
                    Esta ação não pode ser desfeita e todos os dados 
                    relacionados (notas, arquivos, histórico) serão perdidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Sim, excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabConfiguracoes;
