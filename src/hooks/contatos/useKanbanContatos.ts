import { useMemo, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useContatos } from './useContatos';
import type { Contact, CategoriaContato, TemperaturaContato } from '@/types/contatos';

export type KanbanGroupBy = 'categoria' | 'temperatura' | 'responsavel' | 'status';

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  contacts: Contact[];
  count: number;
  totalValue: number;
}

interface UseKanbanContatosOptions {
  groupBy?: KanbanGroupBy;
  search?: string;
}

// TODAS as 12 categorias oficiais com cores do design
const CATEGORIA_CONFIG: Record<string, { title: string; color: string; bgColor: string }> = {
  lead: { title: 'LEAD', color: '#facc15', bgColor: '#facc15' },
  anunciante: { title: 'ANUNCIANTE', color: '#f59e0b', bgColor: '#f59e0b' },
  sindico_exa: { title: 'SÍNDICO EXA', color: '#0ea5e9', bgColor: '#0ea5e9' },
  sindico_lead: { title: 'SÍNDICO LEAD', color: '#8b5cf6', bgColor: '#8b5cf6' },
  prestador_elevador: { title: 'PRESTADOR ELEVADOR', color: '#f97316', bgColor: '#f97316' },
  eletricista: { title: 'ELETRICISTAS', color: '#64748b', bgColor: '#64748b' },
  provedor: { title: 'PROVEDORES', color: '#a855f7', bgColor: '#a855f7' },
  equipe_exa: { title: 'EQUIPE EXA', color: '#6366f1', bgColor: '#6366f1' },
  parceiro_exa: { title: 'PARCEIRO EXA', color: '#14b8a6', bgColor: '#14b8a6' },
  parceiro_lead: { title: 'PARCEIRO LEAD', color: '#10b981', bgColor: '#10b981' },
  outros: { title: 'OUTROS', color: '#94a3b8', bgColor: '#94a3b8' },
  ocultar: { title: 'OCULTAR', color: '#cbd5e1', bgColor: '#cbd5e1' },
};

// Ordem oficial das 12 categorias
const CATEGORIA_ORDER = [
  'lead', 
  'anunciante', 
  'sindico_exa', 
  'sindico_lead',
  'prestador_elevador',
  'eletricista',
  'provedor',
  'equipe_exa', 
  'parceiro_exa', 
  'parceiro_lead', 
  'outros',
  'ocultar'
];

const TEMPERATURA_CONFIG: Record<string, { title: string; color: string; bgColor: string }> = {
  frio: { title: '❄️ Frio', color: 'text-blue-700', bgColor: 'bg-blue-400' },
  morno: { title: '🔥 Morno', color: 'text-orange-700', bgColor: 'bg-orange-400' },
  quente: { title: '🌡️ Quente', color: 'text-red-700', bgColor: 'bg-red-500' },
  sem_temperatura: { title: '⚪ Sem Temp.', color: 'text-gray-600', bgColor: 'bg-gray-300' },
};

const STATUS_CONFIG: Record<string, { title: string; color: string; bgColor: string }> = {
  ativo: { title: '✅ Ativo', color: 'text-green-700', bgColor: 'bg-green-500' },
  arquivado: { title: '📦 Arquivado', color: 'text-gray-600', bgColor: 'bg-gray-400' },
  duplicado: { title: '⚠️ Duplicado', color: 'text-amber-700', bgColor: 'bg-amber-400' },
};

export const useKanbanContatos = (options: UseKanbanContatosOptions = {}) => {
  const { groupBy = 'categoria', search } = options;
  const [movingContact, setMovingContact] = useState<string | null>(null);
  
  const { contacts, loading, updateContact, refetch } = useContatos({
    search,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const columns = useMemo<KanbanColumn[]>(() => {
    if (loading) return [];

    const grouped: Record<string, Contact[]> = {};

    contacts.forEach(contact => {
      let key: string;
      
      switch (groupBy) {
        case 'temperatura':
          key = contact.temperatura || 'sem_temperatura';
          break;
        case 'responsavel':
          key = contact.responsavel_id || 'sem_responsavel';
          break;
        case 'status':
          key = contact.status || 'ativo';
          break;
        case 'categoria':
        default:
          key = contact.categoria || 'outros';
          break;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(contact);
    });

    // Definir ordem e config baseado no groupBy
    let orderedKeys: string[];
    let config: Record<string, { title: string; color: string; bgColor: string }>;

    switch (groupBy) {
      case 'temperatura':
        orderedKeys = ['quente', 'morno', 'frio', 'sem_temperatura'];
        config = TEMPERATURA_CONFIG;
        break;
      case 'status':
        orderedKeys = ['ativo', 'arquivado', 'duplicado'];
        config = STATUS_CONFIG;
        break;
      case 'categoria':
      default:
        // TODAS as 12 categorias sempre visíveis
        orderedKeys = CATEGORIA_ORDER;
        config = CATEGORIA_CONFIG;
        break;
    }

    // Mostrar TODAS as colunas, mesmo as vazias (para categoria)
    return orderedKeys
      .map(key => {
        const contactsInColumn = grouped[key] || [];
        const columnConfig = config[key] || { 
          title: key.toUpperCase(), 
          color: '#94a3b8', 
          bgColor: '#94a3b8' 
        };

        return {
          id: key,
          title: columnConfig.title,
          color: columnConfig.color,
          bgColor: columnConfig.bgColor,
          contacts: contactsInColumn,
          count: contactsInColumn.length,
          totalValue: contactsInColumn.reduce((sum, c) => sum + (c.ticket_estimado || 0), 0),
        };
      });
  }, [contacts, loading, groupBy]);

  const moveContact = useCallback(async (
    contactId: string, 
    targetColumnId: string
  ) => {
    setMovingContact(contactId);
    
    try {
      const updates: Partial<Contact> = {};
      
      switch (groupBy) {
        case 'temperatura':
          if (targetColumnId === 'sem_temperatura') {
            updates.temperatura = undefined;
          } else {
            updates.temperatura = targetColumnId as TemperaturaContato;
          }
          break;
        case 'status':
          updates.status = targetColumnId as Contact['status'];
          break;
        case 'categoria':
        default:
          updates.categoria = targetColumnId as CategoriaContato;
          break;
      }

      await updateContact(contactId, updates);
      
      // Log audit
      await supabase.from('contact_audit_logs').insert({
        contact_id: contactId,
        action: 'updated',
        changed_fields: [groupBy],
        new_values: { [groupBy]: targetColumnId }
      });

      toast.success('Contato movido com sucesso', {
        action: {
          label: 'Desfazer',
          onClick: () => {
            // Implementar undo se necessário
          }
        }
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao mover contato:', error);
      toast.error('Erro ao mover contato');
    } finally {
      setMovingContact(null);
    }
  }, [groupBy, updateContact, refetch]);

  const getColumnMetrics = useCallback((columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return null;

    const urgentCount = column.contacts.filter(c => {
      const lastInteraction = c.last_interaction_at ? new Date(c.last_interaction_at) : null;
      if (!lastInteraction) return false;
      const daysSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    }).length;

    return {
      total: column.count,
      value: column.totalValue,
      urgent: urgentCount,
    };
  }, [columns]);

  return {
    columns,
    loading,
    movingContact,
    moveContact,
    getColumnMetrics,
    refetch,
  };
};
