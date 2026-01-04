import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Send, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Contact } from '@/types/contatos';

interface TabPropostasProps {
  contact: Contact;
}

export const TabPropostas: React.FC<TabPropostasProps> = ({ contact }) => {
  // TODO: Integrar com tabela de propostas quando disponível
  const propostas: any[] = [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Propostas Comerciais</p>
                <p className="text-xs text-muted-foreground">{propostas.length} proposta(s)</p>
              </div>
            </div>
            <Button size="sm" className="h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nova Proposta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Histórico de Propostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {propostas.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhuma proposta enviada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie uma proposta comercial para este contato
              </p>
              <Button variant="outline" className="mt-4" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Criar Primeira Proposta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Placeholder para propostas futuras */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-sm">Proposta #001</p>
                    <p className="text-xs text-muted-foreground">Enviada há 2 dias</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    Aguardando
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabPropostas;
