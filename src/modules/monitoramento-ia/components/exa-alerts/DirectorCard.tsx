import { motion } from 'framer-motion';
import { User, Phone, Shield, Edit, Trash2, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Director {
  id: string;
  nome: string;
  telefone: string;
  departamento?: string | null;
  nivel_acesso: 'basico' | 'gerente' | 'admin';
  ativo: boolean;
  pode_usar_ia: boolean;
  user_id: string | null;
  telefone_verificado?: boolean;
  verificado_em?: string | null;
}

interface DirectorCardProps {
  director: Director;
  onEdit: (director: Director) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, ativo: boolean) => void;
  canDelete?: boolean;
}

export const DirectorCard = ({ director, onEdit, onDelete, onToggleStatus, canDelete = false }: DirectorCardProps) => {
  const nivelColors: Record<string, string> = {
    basico: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    gerente: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
  };

  const nivelLabels: Record<string, string> = {
    basico: 'Básico',
    gerente: 'Gerente',
    admin: 'Admin'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`
        p-6 rounded-2xl border-2 transition-all duration-300
        ${director.ativo 
          ? 'border-gray-200 bg-white hover:border-[#9C1E1E]/30 hover:shadow-lg hover:shadow-[#9C1E1E]/5' 
          : 'border-gray-100 bg-gray-50 opacity-60'
        }
      `}>
        {/* Status Indicator */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${director.ativo ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">
              {director.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          
          {director.pode_usar_ia && (
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs">
              🤖 IA Gerente
            </Badge>
          )}
        </div>

        {/* Director Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#9C1E1E] to-[#D72638] rounded-xl">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{director.nome}</p>
              {director.departamento && (
                <p className="text-xs text-gray-500">{director.departamento}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4" />
            <span>{director.telefone}</span>
            {director.telefone_verificado && (
              <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300">
                ✓ Verificado
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <Badge className={nivelColors[director.nivel_acesso] || 'bg-gray-100 text-gray-700'}>
              {nivelLabels[director.nivel_acesso] || director.nivel_acesso}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(director.id, !director.ativo)}
            className="flex-1"
          >
            <Power className="w-4 h-4 mr-2" />
            {director.ativo ? 'Desativar' : 'Ativar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(director)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(director.id)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
