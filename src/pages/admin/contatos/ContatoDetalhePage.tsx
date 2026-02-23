import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Phone, MessageCircle, Mail, Lock, Edit, Save, X, 
  Building2, ExternalLink, Star, Upload, Trash2, Copy, Plus, Loader2, ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Contact, CATEGORIAS_CONFIG } from '@/types/contatos';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CategoriaBadge, TemperaturaBadge, ScoreIndicator, OrigemBadge } from '@/components/contatos/common';
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoSignedUrl, setLogoSignedUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchContact();
    }
  }, [id]);

  // Generate signed URL for logo when contact changes
  useEffect(() => {
    if (!contact?.logo_url) {
      setLogoSignedUrl(null);
      return;
    }
    const resolveLogoUrl = async () => {
      const url = contact.logo_url!;
      // Check if it's a Supabase storage URL that needs signing
      if (url.includes('supabase.co/storage/')) {
        try {
          // Extract bucket and path from URL
          const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/);
          if (match) {
            const [, bucket, path] = match;
            const { data } = await supabase.storage.from(bucket).createSignedUrl(decodeURIComponent(path), 60 * 60 * 24);
            if (data?.signedUrl) {
              setLogoSignedUrl(data.signedUrl);
              return;
            }
          }
        } catch {}
      }
      setLogoSignedUrl(url);
    };
    resolveLogoUrl();
  }, [contact?.logo_url]);

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
      'categoria', 'tomador_decisao', 'tipo_negocio', 'ticket_estimado', 'instagram',
      'publico_alvo', 'dores_identificadas', 'observacoes_estrategicas',
      // Telefones adicionais
      'telefones_adicionais',
      // Logo
      'logo_url'
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

  const handleLogoUpload = async (file: File) => {
    if (!id || !contact) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida (PNG/JPG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB.');
      return;
    }
    try {
      setUploadingLogo(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Não autenticado');
      const ext = file.name.split('.').pop();
      const fileName = `contacts/${id}/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('arquivos').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      // Get signed URL for private bucket
      const { data: signedData } = await supabase.storage.from('arquivos').createSignedUrl(fileName, 60 * 60 * 24 * 365);
      const storageUrl = signedData?.signedUrl || '';
      // Save the storage path reference (not signed URL) for persistence
      const { data: publicData } = supabase.storage.from('arquivos').getPublicUrl(fileName);
      const persistUrl = publicData.publicUrl;
      const { error: updateError } = await supabase.from('contacts').update({ logo_url: persistUrl, updated_at: new Date().toISOString() }).eq('id', id);
      if (updateError) throw updateError;
      toast.success('Logo atualizada!');
      fetchContact();
    } catch (err: any) {
      console.error('Erro upload logo:', err);
      toast.error('Erro ao enviar logo: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!id) return;
    try {
      setUploadingLogo(true);
      const { error } = await supabase.from('contacts').update({ logo_url: null, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast.success('Logo removida');
      fetchContact();
    } catch (err: any) {
      toast.error('Erro ao remover logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCopyFollowUp = async () => {
    if (!contact) return;
    try {
      // Fetch recent notes for follow-up
      const { data: notes } = await supabase
        .from('contact_notes')
        .select('content, created_at')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(3);

      const notesText = notes && notes.length > 0
        ? notes.map(n => `- ${n.content.substring(0, 100)} (${formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })})`).join('\n')
        : '- Nenhuma nota registrada';

      const text = `FOLLOW-UP: ${contact.empresa || contact.nome}
Status: ${CATEGORIAS_CONFIG[contact.categoria]?.label || contact.categoria}${contact.temperatura ? ` | Temperatura: ${contact.temperatura}` : ''}
Contato: ${contact.nome}${contact.sobrenome ? ' ' + contact.sobrenome : ''} - ${contact.telefone}${contact.email ? ' - ' + contact.email : ''}
Pontuação: ${contact.pontuacao_atual || 0}
Dias sem contato: ${contact.dias_sem_contato || 0}

ÚLTIMAS NOTAS:
${notesText}

Atualizado: ${contact.updated_at ? format(new Date(contact.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}`;

      await navigator.clipboard.writeText(text);
      toast.success('Follow-up copiado!');
    } catch {
      toast.error('Erro ao copiar follow-up');
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
          {/* Logo / Avatar com gradiente vermelho */}
          <div className="flex-shrink-0 relative group">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
                e.target.value = '';
              }}
            />
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-[#9C1E1E] via-[#180A0A] to-[#0B0B0B] flex items-center justify-center overflow-hidden border border-white/10">
              {uploadingLogo ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : logoSignedUrl || contact.logo_url ? (
                <img 
                  src={logoSignedUrl || contact.logo_url!} 
                  alt={contact.empresa || contact.nome}
                  className="h-full w-full object-contain filter brightness-0 invert opacity-80"
                  onError={() => setLogoSignedUrl(null)}
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {(contact.empresa || contact.nome || '?').substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {/* Overlay de hover com ações */}
            <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {contact.logo_url ? (
                <>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                    title="Trocar logo"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleLogoRemove}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-red-500/60 text-white transition-colors"
                    title="Remover logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                  title="Adicionar logo"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Info Principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                  {(editing ? formData.empresa : contact.empresa) || 
                   `${editing ? formData.nome : contact.nome} ${editing ? (formData.sobrenome || '') : (contact.sobrenome || '')}`}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {editing ? formData.nome : contact.nome} {editing ? formData.sobrenome : contact.sobrenome}
                  {(editing ? formData.cargo_tomador : contact.cargo_tomador) && (
                    <span className="text-xs">• {editing ? formData.cargo_tomador : contact.cargo_tomador}</span>
                  )}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{editing ? formData.telefone : contact.telefone}</span>
                  {(editing ? formData.email : contact.email) && (
                    <>
                      <span className="mx-1">•</span>
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{editing ? formData.email : contact.email}</span>
                    </>
                  )}
                </div>
                {contact.origem && (
                  <div className="mt-1.5">
                    <OrigemBadge origem={contact.origem} size="sm" />
                  </div>
                )}
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
              <CategoriaBadge categoria={editing ? (formData.categoria || contact.categoria) : contact.categoria} />
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

              <Button variant="outline" size="sm" onClick={handleCopyFollowUp} className="h-8" title="Copiar resumo para follow-up">
                <Copy className="w-3.5 h-3.5 mr-1" />
                Follow-Up
              </Button>

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
