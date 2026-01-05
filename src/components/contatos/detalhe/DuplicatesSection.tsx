import React, { useState } from 'react';
import { AlertTriangle, Users, ExternalLink, GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useDuplicates } from '@/hooks/contatos/useDuplicates';
import { Contact, CATEGORIAS_CONFIG } from '@/types/contatos';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConsolidateContactModal } from './ConsolidateContactModal';
import { Skeleton } from '@/components/ui/skeleton';

interface DuplicatesSectionProps {
  contact: Contact;
  onUpdate?: () => void;
}

export const DuplicatesSection: React.FC<DuplicatesSectionProps> = ({ contact, onUpdate }) => {
  const { duplicates, loading, hasDuplicates, refetch } = useDuplicates(
    contact.id, 
    contact.duplicate_group_id
  );
  const { buildPath } = useAdminBasePath();
  const navigate = useNavigate();
  const [showConsolidateModal, setShowConsolidateModal] = useState(false);

  // Não mostrar se não há duplicados
  if (!contact.is_potential_duplicate && !hasDuplicates) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="py-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!hasDuplicates) {
    return null;
  }

  const allContacts = [contact, ...duplicates];

  return (
    <>
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Contatos Duplicados Detectados ({duplicates.length + 1} registros)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border border-amber-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-100/50">
                  <TableHead className="text-xs font-medium text-amber-900">Nome/Empresa</TableHead>
                  <TableHead className="text-xs font-medium text-amber-900">Telefone</TableHead>
                  <TableHead className="text-xs font-medium text-amber-900">Email</TableHead>
                  <TableHead className="text-xs font-medium text-amber-900">Categoria</TableHead>
                  <TableHead className="text-xs font-medium text-amber-900">Criado em</TableHead>
                  <TableHead className="text-xs font-medium text-amber-900 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Contato atual */}
                <TableRow className="bg-amber-50">
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px] bg-amber-100 border-amber-300">
                        Atual
                      </Badge>
                      <span className="font-medium">
                        {contact.empresa || contact.nome}
                      </span>
                    </div>
                    {contact.empresa && (
                      <span className="text-muted-foreground">{contact.nome}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{contact.telefone}</TableCell>
                  <TableCell className="text-xs truncate max-w-[150px]">{contact.email || '-'}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORIAS_CONFIG[contact.categoria]?.bgColor} ${CATEGORIAS_CONFIG[contact.categoria]?.color}`}>
                      {CATEGORIAS_CONFIG[contact.categoria]?.emoji} {CATEGORIAS_CONFIG[contact.categoria]?.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(contact.created_at), "dd/MM/yy", { locale: ptBR })}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                
                {/* Outros duplicados */}
                {duplicates.map((dup) => (
                  <TableRow key={dup.id} className="hover:bg-amber-50/50">
                    <TableCell className="text-xs">
                      <div className="font-medium">
                        {dup.empresa || dup.nome}
                      </div>
                      {dup.empresa && (
                        <span className="text-muted-foreground">{dup.nome}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{dup.telefone}</TableCell>
                    <TableCell className="text-xs truncate max-w-[150px]">{dup.email || '-'}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORIAS_CONFIG[dup.categoria]?.bgColor} ${CATEGORIAS_CONFIG[dup.categoria]?.color}`}>
                        {CATEGORIAS_CONFIG[dup.categoria]?.emoji} {CATEGORIAS_CONFIG[dup.categoria]?.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(dup.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => navigate(buildPath(`contatos/${dup.id}`))}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-3">
            <Button 
              size="sm" 
              variant="outline"
              className="h-8 text-amber-700 border-amber-300 hover:bg-amber-100"
              onClick={() => setShowConsolidateModal(true)}
            >
              <GitMerge className="h-3.5 w-3.5 mr-1.5" />
              Consolidar Contatos
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConsolidateContactModal
        open={showConsolidateModal}
        onOpenChange={setShowConsolidateModal}
        contacts={allContacts}
        onSuccess={() => {
          refetch();
          onUpdate?.();
        }}
      />
    </>
  );
};
