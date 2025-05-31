
import React, { useState } from 'react';
import { useLeadsProdutoraData } from '@/hooks/useProdutoraData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coffee, Mail, Phone, Building, Video, MessageSquare, CheckCircle, Download, Users, Loader2, Database, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const LeadsProdutora = () => {
  const { leads, loading, markAsContacted } = useLeadsProdutoraData();
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted'>('all');

  const filteredLeads = leads.filter(lead => {
    if (filter === 'pending') return !lead.contato_realizado;
    if (filter === 'contacted') return lead.contato_realizado;
    return true;
  });

  const stats = {
    total: leads.length,
    pending: leads.filter(l => !l.contato_realizado).length,
    contacted: leads.filter(l => l.contato_realizado).length,
    withCafe: leads.filter(l => l.agendar_cafe).length
  };

  const exportToCSV = () => {
    if (filteredLeads.length === 0) {
      toast.warning('Nenhum lead para exportar');
      return;
    }

    const csvContent = [
      ['Nome', 'Empresa', 'WhatsApp', 'Email', 'Tipo de Vídeo', 'Objetivo', 'Quer Café?', 'Contatado?', 'Data'],
      ...filteredLeads.map(lead => [
        lead.nome,
        lead.empresa || '',
        lead.whatsapp,
        lead.email,
        lead.tipo_video || '',
        lead.objetivo || '',
        lead.agendar_cafe ? 'Sim' : 'Não',
        lead.contato_realizado ? 'Sim' : 'Não',
        format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads-produtora-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV exportado com sucesso!');
  };

  const handleMarkAsContacted = async (leadId: string) => {
    try {
      await markAsContacted(leadId);
    } catch (error) {
      console.error('Erro ao marcar lead como contatado:', error);
      toast.error('Erro ao marcar como contatado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-indexa-purple mx-auto mb-4" />
          <p className="text-gray-600">Carregando leads da produtora...</p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Database className="h-4 w-4 text-indexa-purple" />
            <span className="text-sm text-indexa-purple">Conectando ao Supabase...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads Produtora</h1>
          <p className="text-gray-600">
            Gerencie os leads capturados na página da produtora
            {leads.length > 0 && <span className="ml-2">({leads.length} leads)</span>}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            onClick={exportToCSV} 
            variant="outline"
            disabled={filteredLeads.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total de Leads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Contatados</p>
                <p className="text-2xl font-bold text-green-600">{stats.contacted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-indexa-mint" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Querem Café</p>
                <p className="text-2xl font-bold text-indexa-mint">{stats.withCafe}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todos ({stats.total})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pendentes ({stats.pending})
        </Button>
        <Button
          variant={filter === 'contacted' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('contacted')}
        >
          Contatados ({stats.contacted})
        </Button>
      </div>

      {/* Lista de Leads */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {leads.length === 0 ? 'Nenhum lead encontrado' : 'Nenhum resultado encontrado'}
          </h3>
          <p className="text-gray-500">
            {leads.length === 0 
              ? 'Os leads da produtora aparecerão aqui quando forem enviados através do formulário.'
              : 'Tente ajustar os filtros acima.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className={`transition-all duration-300 hover:shadow-lg ${
              lead.contato_realizado ? 'bg-green-50 border-green-200' : 'bg-white'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{lead.nome}</CardTitle>
                    {lead.empresa && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Building className="h-4 w-4 mr-1" />
                        {lead.empresa}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {lead.contato_realizado ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Contatado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Pendente
                      </Badge>
                    )}
                    
                    {lead.agendar_cafe && (
                      <Badge variant="outline" className="border-indexa-mint text-indexa-mint">
                        <Coffee className="h-3 w-3 mr-1" />
                        Quer Café
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Contatos */}
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <a 
                      href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      {lead.whatsapp}
                    </a>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <a 
                      href={`mailto:${lead.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {lead.email}
                    </a>
                  </div>
                </div>

                {/* Tipo de vídeo */}
                {lead.tipo_video && (
                  <div className="flex items-center text-sm">
                    <Video className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="capitalize">{lead.tipo_video}</span>
                  </div>
                )}

                {/* Objetivo */}
                {lead.objetivo && (
                  <div className="text-sm">
                    <p className="text-gray-600 font-medium mb-1">Objetivo:</p>
                    <p className="text-gray-800 line-clamp-3">{lead.objetivo}</p>
                  </div>
                )}

                {/* Data */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Recebido em {format(new Date(lead.created_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                </div>

                {/* Ações */}
                {!lead.contato_realizado && (
                  <div className="pt-3">
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsContacted(lead.id)}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Contatado
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadsProdutora;
