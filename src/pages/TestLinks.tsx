import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateCommercialPath, generatePanelPath, generateEmbedPath } from '@/utils/buildingSlugUtils';
import { generatePublicUrl } from '@/config/domain';

interface BuildingLink {
  id: string;
  nome: string;
  codigo_predio: string;
  status: string;
  comercial_url: string;
  painel_url: string;
  embed_code: string;
}

const TestLinks = () => {
  const [buildings, setBuildings] = useState<BuildingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    console.log('🔍 [TEST LINKS] Buscando prédios...');
    
    const { data, error } = await supabase
      .rpc('get_admin_buildings_safe');

    if (error) {
      console.error('❌ [TEST LINKS] Erro:', error);
      toast.error('Erro ao carregar prédios');
      setLoading(false);
      return;
    }

    console.log('📊 [TEST LINKS] Dados recebidos:', data);

    const buildingsWithLinks = data.map((building: any) => {
      const codigo = building.codigo_predio || '000';
      const nome = building.nome || 'predio';
      
      return {
        id: building.id,
        nome: nome,
        codigo_predio: codigo,
        status: building.status,
        comercial_url: generatePublicUrl(generateCommercialPath(nome, codigo)),
        painel_url: generatePublicUrl(generatePanelPath(nome, codigo)),
        embed_code: `<iframe src="${generatePublicUrl(generateEmbedPath(nome, codigo))}" width="100%" height="600" frameborder="0"></iframe>`
      };
    });

    console.log('✅ [TEST LINKS] Links gerados:', buildingsWithLinks);
    setBuildings(buildingsWithLinks);
    setLoading(false);
  };

  const testLink = async (url: string, buildingId: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const success = response.ok;
      setTestResults(prev => ({ ...prev, [buildingId]: success }));
      
      if (success) {
        toast.success('Link funcionando!');
      } else {
        toast.error(`Link com erro: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao testar link:', error);
      setTestResults(prev => ({ ...prev, [buildingId]: false }));
      toast.error('Erro ao testar link');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando prédios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teste de Links dos Prédios</h1>
          <p className="text-muted-foreground mt-2">
            Página de debug para verificar links comerciais e códigos dos prédios
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {buildings.length} Prédios
        </Badge>
      </div>

      <div className="grid gap-4">
        {buildings.map((building) => (
          <Card key={building.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>{building.nome}</CardTitle>
                  <Badge variant={building.status === 'ativo' ? 'default' : 'secondary'}>
                    {building.status}
                  </Badge>
                  <Badge variant="outline">
                    Código: {building.codigo_predio}
                  </Badge>
                </div>
                {testResults[building.id] !== undefined && (
                  testResults[building.id] ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Link Comercial */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>Link Comercial:</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    {building.comercial_url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(building.comercial_url, 'Link Comercial')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(building.comercial_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => testLink(building.comercial_url, building.id)}
                  >
                    Testar
                  </Button>
                </div>
              </div>

              {/* Link Painel */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>Link Painel Limpo:</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    {building.painel_url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(building.painel_url, 'Link Painel')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(building.painel_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Embed Code */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>Código Embed:</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    {building.embed_code}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(building.embed_code, 'Código Embed')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Debug Info */}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Debug Info
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded-md overflow-x-auto">
                  {JSON.stringify(
                    {
                      id: building.id,
                      nome: building.nome,
                      codigo_predio: building.codigo_predio,
                      status: building.status
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TestLinks;
