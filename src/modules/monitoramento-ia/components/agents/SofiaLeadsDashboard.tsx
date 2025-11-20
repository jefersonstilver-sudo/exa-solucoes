import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Flame, TrendingUp, Users, AlertTriangle } from 'lucide-react';

interface Lead {
  id: string;
  contact_name: string | null;
  contact_number: string;
  score: number;
  profile_type: string | null;
  classification: string;
  risk_of_loss: boolean;
  created_at: string;
}

export const SofiaLeadsDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  const fetchLeads = async () => {
    let query = supabase
      .from('lead_qualifications')
      .select('*')
      .eq('qualified_by', 'sofia')
      .order('created_at', { ascending: false });

    if (filter === 'quente') {
      query = query.gte('score', 71).lt('score', 90);
    } else if (filter === 'muito_quente') {
      query = query.gte('score', 90);
    } else if (filter === 'risco') {
      query = query.eq('risk_of_loss', true);
    }

    const { data } = await query;
    setLeads(data || []);
  };

  const stats = {
    total: leads.length,
    quentes: leads.filter(l => l.score >= 71 && l.score < 90).length,
    muitoQuentes: leads.filter(l => l.score >= 90).length,
    risco: leads.filter(l => l.risk_of_loss).length
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-red-500';
    if (score >= 71) return 'bg-orange-500';
    if (score >= 41) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quentes</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quentes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Muito Quentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.muitoQuentes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.risco}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="quente">Quentes (71-89)</TabsTrigger>
          <TabsTrigger value="muito_quente">Muito Quentes (90+)</TabsTrigger>
          <TabsTrigger value="risco">Em Risco</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.contact_name || 'Sem nome'}</p>
                      <p className="text-sm text-muted-foreground">{lead.contact_number}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getScoreBadge(lead.score)}>{lead.score}</Badge>
                  </TableCell>
                  <TableCell>{lead.profile_type || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="outline">{lead.classification}</Badge>
                      {lead.risk_of_loss && (
                        <Badge variant="destructive">Risco</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(lead.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
