import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Phone, MessageCircle, Mail, Lock, Edit, Save, X, 
  Building2, ExternalLink, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Contact, CATEGORIAS_CONFIG } from '@/types/contatos';
import { CategoriaBadge, TemperaturaBadge, ScoreIndicator } from '@/components/contatos/common';
import { useScoringRules } from '@/hooks/contatos';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { Skeleton } from '@/components/ui/skeleton';

// Componentes das Abas
import { TabVisaoGeral } from '@/components/contatos/detalhe/TabVisaoGeral';
import { TabPontuacao } from '@/components/contatos/detalhe/TabPontuacao';
import { TabInteligencia } from '@/components/contatos/detalhe/TabInteligencia';
import { TabConversas } from '@/components/contatos/detalhe/TabConversas';
import { TabPedidos } from '@/components/contatos/detalhe/TabPedidos';
import { TabPropostas } from '@/components/contatos/detalhe/TabPropostas';
import { TabContratos } from '@/components/contatos/detalhe/TabContratos';
import { TabAgenda } from '@/components/contatos/detalhe/TabAgenda';
import { TabArquivos } from '@/components/contatos/detalhe/TabArquivos';
import { TabNotas } from '@/components/contatos/detalhe/TabNotas';
import { TabConfiguracoes } from '@/components/contatos/detalhe/TabConfiguracoes';
import { DuplicatesSection } from '@/components/contatos/detalhe/DuplicatesSection';

const ContatoDetalhePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { getConfigForCategory, getMaxScore } = useScoringRules();
  const { logUpdate } = useActivityLogger();
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const originalContactRef = useRef<Contact | null>(null);
  const [activeTab, setActiveTab] = useState('visao-geral');

  useEffect(() => {
    if (id) {
      fetchContact();
    }
  }, [id]);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      const contactData = data as Contact;
      setContact(contactData);
      setFormData(contactData);
      originalContactRef.current = contactData;
    } catch (error) {
      console.error('Erro ao buscar contato:', error);
      toast.error('Contato não encontrado');
      navigate(buildPath('contatos'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !contact) return;
    
    // Identify changed fields
    const changedFields: string[] = [];
    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};
    
    const fieldsToCheck = [
      'nome', 'sobrenome', 'empresa', 'telefone', 'email', 'website',
      'cargo_tomador', 'endereco', 'cidade', 'estado', 'cep', 'bairro',
      'cnpj', 'ramo_atividade', 'segmento', 'tamanho_empresa', 'faturamento_anual',
      'fonte_lead', 'campanha_origem', 'interesse_servicos', 'observacoes',
      'resumo_ia', 'intencao_compra', 'necessidades_identificadas',
      'proximos_passos', 'objecoes_registradas', 'data_ultimo_contato',
      // Campos da TabInteligencia
      'tomador_decisao', 'tipo_negocio', 'ticket_estimado', 'instagram',
      'publico_alvo', 'dores_identificadas', 'observacoes_estrategicas',
      // Telefones adicionais
      'telefones_adicionais'
    ] as const;

    for (const field of fieldsToCheck) {
      if (formData[field] !== contact[field]) {
        changedFields.push(field);
        oldValues[field] = contact[field];
        newValues[field] = formData[field];
      }
    }
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Log changes if any fields were modified
      if (changedFields.length > 0) {
        await logUpdate('contact', id, {
          action: 'fields_updated',
          changed_fields: changedFields,
          old_values: oldValues,
          new_values: newValues,
          contact_name: contact.empresa || contact.nome
        });
      }
      
      toast.success('Contato atualizado');
      setEditing(false);
      fetchContact();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    }
  };

  const handleAction = (type: 'whatsapp' | 'phone' | 'email') => {
    if (!contact) return;
    
    if (contact.bloqueado && type !== 'email') {
      toast.error('Ação bloqueada: Pontuação mínima não atingida');
      return;
    }

    const phone = contact.telefone.replace(/\D/g, '');
    
    switch (type) {
      case 'whatsapp':
        window.open(`https://wa.me/55${phone}`, '_blank');
        break;
      case 'phone':
        window.open(`tel:${phone}`, '_self');
        break;
      case 'email':
        if (contact.email) window.open(`mailto:${contact.email}`, '_self');
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-3 md:p-4 space-y-4">
        <Skeleton className="h-8 w-24" />
        <div className="bg-white/80 rounded-2xl p-4 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!contact) return null;

  const config = CATEGORIAS_CONFIG[contact.categoria];
  const hasPontuacao = config?.hasPontuacao;
  const isAnunciante = contact.categoria === 'anunciante';
  const maxScore = getMaxScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-3 md:p-4 space-y-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(buildPath('contatos'))}
        className="h-8 text-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Voltar
      </Button>

      {/* Header Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-4 md:p-6 border border-border/50">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Logo / Avatar */}
          <div className="flex-shrink-0">
            {contact.logo_url ? (
              <img 
                src={contact.logo_url} 
                alt={contact.empresa || contact.nome}
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary/60" />
              </div>
            )}
          </div>

          {/* Info Principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                  {contact.empresa || `${contact.nome} ${contact.sobrenome || ''}`}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {contact.nome} {contact.sobrenome}
                  {contact.cargo_tomador && (
                    <span className="text-xs">• {contact.cargo_tomador}</span>
                  )}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{contact.telefone}</span>
                  {contact.email && (
                    <>
                      <span className="mx-1">•</span>
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{contact.email}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Score / Satisfação */}
              <div className="flex-shrink-0">
                {hasPontuacao ? (
                  <ScoreIndicator 
                    score={contact.pontuacao_atual || 0}
                    blocked={contact.bloqueado}
                    size="lg"
                    showLabel
                    maxScore={maxScore}
                  />
                ) : isAnunciante && (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`w-4 h-4 ${
                            (contact.satisfacao || 0) >= star 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Satisfação
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <CategoriaBadge categoria={contact.categoria} />
              {contact.temperatura && (
                <TemperaturaBadge temperatura={contact.temperatura} />
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                contact.status === 'ativo' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {contact.status}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button
                size="sm"
                className={contact.bloqueado 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed h-8' 
                  : 'bg-green-500 hover:bg-green-600 text-white h-8'}
                disabled={contact.bloqueado}
                onClick={() => handleAction('whatsapp')}
              >
                {contact.bloqueado && <Lock className="w-3 h-3 mr-1" />}
                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                WhatsApp
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className={contact.bloqueado 
                  ? 'cursor-not-allowed opacity-50 h-8' 
                  : 'h-8'}
                disabled={contact.bloqueado}
                onClick={() => handleAction('phone')}
              >
                {contact.bloqueado && <Lock className="w-3 h-3 mr-1" />}
                <Phone className="w-3.5 h-3.5 mr-1" />
                Ligar
              </Button>

              {contact.email && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => handleAction('email')}
                >
                  <Mail className="w-3.5 h-3.5 mr-1" />
                  Email
                </Button>
              )}

              {contact.website && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => window.open(contact.website!, '_blank')}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Site
                </Button>
              )}

              <div className="flex-1" />

              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => {
                  setEditing(true);
                  setActiveTab('inteligencia');
                  toast.info('Modo de edição ativado. Edite os campos e clique em Salvar.');
                }} className="h-8">
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(false); setFormData(contact); }} className="h-8">
                    <X className="w-3.5 h-3.5 mr-1" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} className="h-8">
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Duplicados - aparece apenas quando há duplicados */}
      {contact.is_potential_duplicate && (
        <DuplicatesSection contact={contact} onUpdate={fetchContact} />
      )}

      {/* Tabs - 11 Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-border/50 p-1 inline-flex w-auto min-w-full">
            <TabsTrigger value="visao-geral" className="text-xs whitespace-nowrap">
              Visão Geral
            </TabsTrigger>
            {hasPontuacao && (
              <TabsTrigger value="pontuacao" className="text-xs whitespace-nowrap">
                Pontuação
              </TabsTrigger>
            )}
            <TabsTrigger value="inteligencia" className="text-xs whitespace-nowrap">
              Inteligência
            </TabsTrigger>
            <TabsTrigger value="conversas" className="text-xs whitespace-nowrap">
              Conversas
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="text-xs whitespace-nowrap">
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="propostas" className="text-xs whitespace-nowrap">
              Propostas
            </TabsTrigger>
            <TabsTrigger value="contratos" className="text-xs whitespace-nowrap">
              Contratos
            </TabsTrigger>
            <TabsTrigger value="agenda" className="text-xs whitespace-nowrap">
              Agenda
            </TabsTrigger>
            <TabsTrigger value="arquivos" className="text-xs whitespace-nowrap">
              Arquivos
            </TabsTrigger>
            <TabsTrigger value="notas" className="text-xs whitespace-nowrap">
              Notas
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="text-xs whitespace-nowrap">
              Configurações
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="visao-geral">
          <TabVisaoGeral 
            contact={contact} 
            editing={editing}
            formData={formData}
            setFormData={setFormData}
          />
        </TabsContent>

        {hasPontuacao && (
          <TabsContent value="pontuacao">
            <TabPontuacao contact={contact} />
          </TabsContent>
        )}

        <TabsContent value="inteligencia">
          <TabInteligencia 
            contact={contact} 
            editing={editing}
            formData={formData}
            setFormData={setFormData}
          />
        </TabsContent>

        <TabsContent value="conversas">
          <TabConversas contact={contact} />
        </TabsContent>

        <TabsContent value="pedidos">
          <TabPedidos contact={contact} />
        </TabsContent>

        <TabsContent value="propostas">
          <TabPropostas contact={contact} />
        </TabsContent>

        <TabsContent value="contratos">
          <TabContratos contact={contact} />
        </TabsContent>

        <TabsContent value="agenda">
          <TabAgenda contact={contact} />
        </TabsContent>

        <TabsContent value="arquivos">
          <TabArquivos contact={contact} />
        </TabsContent>

        <TabsContent value="notas">
          <TabNotas contact={contact} />
        </TabsContent>

        <TabsContent value="configuracoes">
          <TabConfiguracoes 
            contact={contact} 
            onUpdate={fetchContact}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContatoDetalhePage;
