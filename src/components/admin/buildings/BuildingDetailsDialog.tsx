
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  MapPin, 
  Users, 
  Monitor, 
  DollarSign,
  Calendar,
  Activity,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BuildingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
}

const BuildingDetailsDialog: React.FC<BuildingDetailsDialogProps> = ({
  open,
  onOpenChange,
  building
}) => {
  const [actionLogs, setActionLogs] = useState([]);
  const [sales, setSales] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (building && open) {
      fetchBuildingData();
    }
  }, [building, open]);

  const fetchBuildingData = async () => {
    if (!building) return;
    
    setLoading(true);
    try {
      // Buscar logs de ações
      const { data: logsData } = await supabase
        .from('building_action_logs')
        .select(`
          *,
          users:user_id (email)
        `)
        .eq('building_id', building.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setActionLogs(logsData || []);

      // Buscar vendas/pedidos relacionados ao prédio
      const { data: salesData } = await supabase
        .from('pedidos')
        .select('*')
        .contains('lista_paineis', [building.id])
        .order('created_at', { ascending: false });

      setSales(salesData || []);

      // Buscar painéis do prédio
      const { data: panelsData } = await supabase
        .from('painels')
        .select('*')
        .eq('building_id', building.id);

      setPanels(panelsData || []);

    } catch (error) {
      console.error('Erro ao carregar dados do prédio:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (!building) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building2 className="h-6 w-6 mr-2 text-indexa-purple" />
            {building.nome}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas e histórico completo do prédio
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="panels">Painéis</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="logs">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Localização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <strong>Endereço:</strong>
                    <p className="text-gray-600">{building.endereco}</p>
                  </div>
                  <div>
                    <strong>Bairro:</strong>
                    <Badge variant="outline">{building.bairro}</Badge>
                  </div>
                  {building.latitude && building.longitude && (
                    <div>
                      <strong>Coordenadas:</strong>
                      <p className="text-gray-600 text-sm">
                        {building.latitude}, {building.longitude}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Métricas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Métricas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-600">{building.numero_unidades}</div>
                      <div className="text-xs text-blue-600">Unidades</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Eye className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                      <div className="text-2xl font-bold text-purple-600">{building.publico_estimado}</div>
                      <div className="text-xs text-purple-600">Público</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-600" />
                      <div className="text-lg font-bold text-green-600">{formatPrice(building.preco_base)}</div>
                      <div className="text-xs text-green-600">Preço Base</div>
                    </div>
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <Monitor className="h-6 w-6 mx-auto mb-1 text-indigo-600" />
                      <div className="text-2xl font-bold text-indigo-600">{building.quantidade_telas}</div>
                      <div className="text-xs text-indigo-600">Painéis</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Características */}
            {building.amenities && building.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Características de Lazer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {building.amenities.map((amenity: string) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="panels">
            <Card>
              <CardHeader>
                <CardTitle>Painéis Associados ({panels.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {panels.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Resolução</TableHead>
                        <TableHead>Última Sync</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {panels.map((panel: any) => (
                        <TableRow key={panel.id}>
                          <TableCell className="font-medium">{panel.code}</TableCell>
                          <TableCell>
                            <Badge variant={panel.status === 'online' ? 'default' : 'secondary'}>
                              {panel.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{panel.resolucao || 'N/A'}</TableCell>
                          <TableCell>
                            {panel.ultima_sync ? formatDate(panel.ultima_sync) : 'Nunca'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Nenhum painel associado a este prédio
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>Vendas Realizadas ({sales.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {sales.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Duração</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale: any) => (
                        <TableRow key={sale.id}>
                          <TableCell>{formatDate(sale.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{sale.status}</Badge>
                          </TableCell>
                          <TableCell>{formatPrice(sale.valor_total)}</TableCell>
                          <TableCell>{sale.plano_meses} meses</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma venda registrada para este prédio
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Histórico de Ações ({actionLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {actionLogs.length > 0 ? (
                  <div className="space-y-4">
                    {actionLogs.map((log: any) => (
                      <div key={log.id} className="border-l-4 border-indexa-purple pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{log.action_description}</h4>
                            <p className="text-sm text-gray-600">
                              Tipo: <Badge variant="outline" className="text-xs">{log.action_type}</Badge>
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{formatDate(log.created_at)}</p>
                            <p>{log.users?.email || 'Sistema'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma ação registrada para este prédio
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BuildingDetailsDialog;
