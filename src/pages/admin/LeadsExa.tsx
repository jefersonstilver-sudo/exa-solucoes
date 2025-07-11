import React, { useState } from 'react';
import { useLeadsExa } from '@/hooks/useLeadsExa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Mail, Phone, Building, Target, CheckCircle, Download, Users, Loader2, Database } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const LeadsExa = () => {
  const { leads, loading, markAsContacted } = useLeadsExa();
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted'>('all');

  const filteredLeads = leads.filter(lead => {
    if (filter === 'pending') return !lead.contato_realizado;
    if (filter === 'contacted') return lead.contato_realizado;
    return true;
  });

  const stats = {
    total: leads.length,
    pending: leads.filter(l => !l.contato_realizado).length,
    contacted: leads.filter(l => l.contato_realizado).length
  };

  const handleMarkAsContacted = async (leadId: string) => {
    try {
      await markAsContacted(leadId);
    } catch (error) {
      console.error('Erro ao marcar lead como contatado:', error);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.error('Nenhum lead para exportar');
      return;
    }

    const headers = [
      'Nome Completo',
      'Empresa',
      'Cargo',
      'WhatsApp',
      'Objetivo',
      'Status',
      'Contatado',
      'Data de Criação'
    ];

    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.nome_completo}"`,
        `"${lead.nome_empresa}"`,
        `"${lead.cargo}"`,
        `"${lead.whatsapp}"`,
        `"${lead.objetivo || ''}"`,
        `"${lead.status}"`,
        lead.contato_realizado ? 'Sim' : 'Não',
        `"${format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_exa_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exportados com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-indexa-purple" />
          <span className="text-lg font-medium">Carregando leads EXA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500" />
            Leads EXA - Publicidade Inteligente
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os leads interessados em publicidade inteligente com painéis digitais
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center space-x-2"
            disabled={leads.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">{stats.total}</p>
                <p className="text-yellow-600 text-sm font-medium">Total de Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
                <p className="text-blue-600 text-sm font-medium">Aguardando Contato</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.contacted}</p>
                <p className="text-green-600 text-sm font-medium">Já Contatados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todos ({stats.total})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pendentes ({stats.pending})
        </Button>
        <Button
          variant={filter === 'contacted' ? 'default' : 'outline'}
          onClick={() => setFilter('contacted')}
        >
          Contatados ({stats.contacted})
        </Button>
      </div>

      {/* Lista de Leads */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum lead encontrado
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Ainda não há leads de EXA registrados no sistema.'
                : `Não há leads ${filter === 'pending' ? 'pendentes' : 'contatados'} no momento.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {lead.nome_completo}
                  </CardTitle>
                  <Badge
                    variant={lead.contato_realizado ? 'default' : 'secondary'}
                    className={
                      lead.contato_realizado
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }
                  >
                    {lead.contato_realizado ? 'Contatado' : 'Aguardando'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.nome_empresa}</p>
                      <p className="text-sm text-gray-600">{lead.cargo}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.whatsapp}</p>
                      <p className="text-sm text-gray-600">WhatsApp</p>
                    </div>
                  </div>
                </div>

                {lead.objetivo && (
                  <div className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg">
                    <Target className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Objetivo:</p>
                      <p className="text-sm text-gray-700">{lead.objetivo}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    <p>
                      Cadastrado em: {format(new Date(lead.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {!lead.contato_realizado && (
                    <Button
                      onClick={() => handleMarkAsContacted(lead.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Contatado
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadsExa;