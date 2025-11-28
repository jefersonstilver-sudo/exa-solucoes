import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye } from 'lucide-react';

interface AlertCardProps {
  nome: string;
  tipo: string;
  descricao?: string;
  template?: string;
  ativo: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}

export const AlertCard = ({
  nome,
  tipo,
  descricao,
  template,
  ativo,
  onToggle,
  onEdit,
  onDelete,
  onPreview,
}: AlertCardProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'painel_offline':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'comportamental':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'custom':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-2 hover:border-primary/50 transition-all">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{nome}</h3>
                <Badge variant="outline" className={getTypeColor(tipo)}>
                  {tipo === 'painel_offline' && '🚨 Painel Offline'}
                  {tipo === 'comportamental' && '📊 Comportamental'}
                  {tipo === 'custom' && '⚙️ Personalizado'}
                </Badge>
              </div>
              {descricao && (
                <p className="text-sm text-muted-foreground">{descricao}</p>
              )}
            </div>
            <Switch checked={ativo} onCheckedChange={onToggle} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {template && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Template da mensagem:
              </p>
              <p className="text-sm line-clamp-3">{template}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
