
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Monitor, Edit, Trash2, Play, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  painel_id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  obs?: string;
  created_at: string;
  video_id: string;
}

interface MobileCampaignCardProps {
  campaign: Campaign;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView?: (id: string) => void;
  index: number;
}

const MobileCampaignCard = ({ 
  campaign, 
  onEdit, 
  onDelete, 
  onView,
  index 
}: MobileCampaignCardProps) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      ativo: { bg: 'bg-green-500', text: 'text-white', label: 'Ativa' },
      active: { bg: 'bg-green-500', text: 'text-white', label: 'Ativa' },
      pausado: { bg: 'bg-red-500', text: 'text-white', label: 'Pausada' },
      paused: { bg: 'bg-red-500', text: 'text-white', label: 'Pausada' },
      agendado: { bg: 'bg-yellow-500', text: 'text-white', label: 'Agendada' },
      scheduled: { bg: 'bg-yellow-500', text: 'text-white', label: 'Agendada' },
      pendente: { bg: 'bg-blue-500', text: 'text-white', label: 'Pendente' },
      finalizado: { bg: 'bg-blue-500', text: 'text-white', label: 'Finalizada' },
      cancelado: { bg: 'bg-blue-500', text: 'text-white', label: 'Cancelada' }
    };
    
    const variant = variants[status as keyof typeof variants] || { bg: 'bg-blue-500', text: 'text-white', label: status };
    
    return (
      <Badge className={cn(variant.bg, variant.text, 'font-medium')}>
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="overflow-hidden border-l-4 border-l-indexa-purple hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-base mb-1">
                Campanha #{campaign.id.substring(0, 8)}
              </h3>
              {getStatusBadge(campaign.status)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Info Grid */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-indexa-purple" />
              <span className="font-medium">
                {formatDate(campaign.data_inicio)} - {formatDate(campaign.data_fim)}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Monitor className="h-4 w-4 mr-2 text-indexa-purple" />
              <span>Painel: {campaign.painel_id.substring(0, 12)}...</span>
            </div>

            {campaign.obs && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{campaign.obs}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            {onView && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onView(campaign.id)}
                className="flex-1 h-9"
              >
                <Play className="h-3 w-3 mr-1" />
                Ver
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(campaign.id)}
              className="flex-1 h-9"
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDelete(campaign.id)}
              className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MobileCampaignCard;
