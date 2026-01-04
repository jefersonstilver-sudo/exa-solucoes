import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCheck, Plus, Eye, Calendar, AlertTriangle } from 'lucide-react';
import { Contact } from '@/types/contatos';

interface TabContratosProps {
  contact: Contact;
}

export const TabContratos: React.FC<TabContratosProps> = ({ contact }) => {
  // TODO: Integrar com tabela de contratos quando disponível
  const contratos: any[] = [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Contratos</p>
                <p className="text-xs text-muted-foreground">{contratos.length} contrato(s)</p>
              </div>
            </div>
            <Button size="sm" className="h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Novo Contrato
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Histórico de Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contratos.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum contrato encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Este contato ainda não possui contratos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Placeholder para contratos */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Contrato Anual</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      01/01/2024 - 31/12/2024
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Ativo
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

export default TabContratos;
