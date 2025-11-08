import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Plus, Edit, Trash2, Download, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string | null;
  entity_id?: string | null;
  action_description?: string | null;
  metadata?: any;
  created_at: string;
  users?: {
    email: string;
    role: string;
  };
}

interface AuditLogTableProps {
  logs: ActivityLog[];
  loading: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  view: <Eye className="h-4 w-4" />,
  create: <Plus className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  view: 'bg-blue-100 text-blue-800',
  create: 'bg-green-100 text-green-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
  export: 'bg-purple-100 text-purple-800',
};

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma atividade registrada
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-sm">
                {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{log.users?.email}</span>
                  <Badge variant="outline" className="w-fit mt-1">
                    {log.users?.role === 'admin_financeiro'
                      ? 'Admin Financeiro'
                      : log.users?.role}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={actionColors[log.action_type] || 'bg-gray-100 text-gray-800'}>
                  <span className="mr-1">{actionIcons[log.action_type]}</span>
                  {log.action_type}
                </Badge>
              </TableCell>
              <TableCell>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {log.entity_type || '-'}
                </code>
              </TableCell>
              <TableCell>
                <div className="max-w-md">
                  {log.entity_id && (
                    <div className="text-sm text-muted-foreground mb-1">
                      ID: {log.entity_id.substring(0, 8)}...
                    </div>
                  )}
                  {log.action_description && (
                    <div className="text-sm">
                      {log.action_description.substring(0, 100)}
                      {log.action_description.length > 100 && '...'}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AuditLogTable;
