
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  FileVideo,
  Globe,
  Database
} from 'lucide-react';
import { diagnosePanelVideoIssues, testStorageConnectivity, VideoHealthCheck } from '@/services/videoHealthService';
import { toast } from 'sonner';

interface VideoHealthDiagnosticProps {
  orderId: string;
}

export const VideoHealthDiagnostic: React.FC<VideoHealthDiagnosticProps> = ({ orderId }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [healthChecks, setHealthChecks] = useState<VideoHealthCheck[]>([]);
  const [storageConnected, setStorageConnected] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setProgress(0);
    setHealthChecks([]);
    setStorageConnected(null);

    try {
      console.log('🔍 Iniciando diagnóstico completo...');
      
      // Etapa 1: Testar conectividade com storage
      setProgress(25);
      const connected = await testStorageConnectivity();
      setStorageConnected(connected);
      
      if (!connected) {
        toast.error('Falha na conectividade com o storage');
      }

      // Etapa 2: Diagnosticar vídeos
      setProgress(50);
      const checks = await diagnosePanelVideoIssues(orderId);
      setHealthChecks(checks);
      
      setProgress(100);
      
      const healthyVideos = checks.filter(check => check.fileAccessible).length;
      const totalVideos = checks.length;
      
      if (healthyVideos === totalVideos) {
        toast.success(`Todos os ${totalVideos} vídeos estão funcionando corretamente!`);
      } else {
        toast.warning(`${healthyVideos}/${totalVideos} vídeos estão funcionando`);
      }
      
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error);
      toast.error('Erro ao executar diagnóstico');
    } finally {
      setIsRunning(false);
    }
  };

  const getHealthBadge = (check: VideoHealthCheck) => {
    if (check.fileAccessible) {
      return <Badge className="bg-green-500 text-white">Funcionando</Badge>;
    } else if (check.urlValid) {
      return <Badge className="bg-yellow-500 text-white">Problema de Acesso</Badge>;
    } else {
      return <Badge className="bg-red-500 text-white">URL Inválida</Badge>;
    }
  };

  const getHealthIcon = (check: VideoHealthCheck) => {
    if (check.fileAccessible) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileVideo className="h-5 w-5" />
          <span>Diagnóstico de Vídeos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botão de Diagnóstico */}
        <div className="flex items-center space-x-4">
          <Button 
            onClick={runDiagnostic} 
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Executando...' : 'Executar Diagnóstico'}</span>
          </Button>
          
          {isRunning && (
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        {/* Status da Conectividade */}
        {storageConnected !== null && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50">
            <Globe className="h-5 w-5" />
            <span className="font-medium">Conectividade Storage:</span>
            {storageConnected ? (
              <Badge className="bg-green-500 text-white">Conectado</Badge>
            ) : (
              <Badge className="bg-red-500 text-white">Falha na Conexão</Badge>
            )}
          </div>
        )}

        {/* Resultados dos Vídeos */}
        {healthChecks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Resultados por Vídeo ({healthChecks.length})</span>
            </h4>
            
            {healthChecks.map((check, index) => (
              <div key={check.videoId} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getHealthIcon(check)}
                    <span className="font-medium">Vídeo #{index + 1}</span>
                  </div>
                  {getHealthBadge(check)}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>ID:</strong> {check.videoId}</p>
                  <p><strong>URL:</strong> <span className="break-all">{check.url}</span></p>
                  
                  {check.errorDetails && (
                    <div className="flex items-start space-x-2 text-red-600">
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                      <span>{check.errorDetails}</span>
                    </div>
                  )}
                  
                  {check.suggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-medium text-blue-600">Sugestões:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-600">
                        {check.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-xs">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resumo */}
        {healthChecks.length > 0 && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {healthChecks.filter(c => c.fileAccessible).length}
                </div>
                <div className="text-sm text-gray-600">Funcionando</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {healthChecks.filter(c => c.urlValid && !c.fileAccessible).length}
                </div>
                <div className="text-sm text-gray-600">Com Problemas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {healthChecks.filter(c => !c.urlValid).length}
                </div>
                <div className="text-sm text-gray-600">URL Inválida</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
