import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryVersion {
  id: string;
  version_number: number;
  created_at: string;
  change_description?: string;
  saved_by?: string;
  custom_html: string;
}

interface EmailTemplateHistoryPanelProps {
  history: HistoryVersion[];
  loading: boolean;
  onRestore: (version: HistoryVersion) => void;
  currentVersion?: number;
}

const EmailTemplateHistoryPanel: React.FC<EmailTemplateHistoryPanelProps> = ({
  history,
  loading,
  onRestore,
  currentVersion,
}) => {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico de Versões
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico de Versões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma versão salva ainda</p>
            <p className="text-xs mt-1">Salve suas alterações para criar histórico</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Histórico de Versões
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {history.length} {history.length === 1 ? 'versão salva' : 'versões salvas'}
        </p>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-3">
            {history.map((version, index) => {
              const isCurrentVersion = currentVersion === version.version_number;
              const htmlLength = version.custom_html.length;
              const lines = version.custom_html.split('\n').length;

              return (
                <div
                  key={version.id}
                  className={`border rounded-lg p-3 transition-all ${
                    isCurrentVersion
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={isCurrentVersion ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          v{version.version_number}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-200">
                            Mais recente
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(version.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                      {version.change_description && (
                        <p className="text-sm mt-1 text-foreground">
                          {version.change_description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{lines} linhas</span>
                        <span>•</span>
                        <span>{(htmlLength / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    {!isCurrentVersion && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRestore(version)}
                        className="shrink-0"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restaurar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateHistoryPanel;
