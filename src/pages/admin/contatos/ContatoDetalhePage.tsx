import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Phone, MessageCircle, Mail, Lock, Unlock, 
  Building, User, MapPin, Edit, Save, X, Thermometer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Contact, CATEGORIAS_CONFIG, CATEGORIAS_ORDER, CategoriaContato } from '@/types/contatos';
import { CategoriaBadge, TemperaturaBadge, ScoreProgressBar } from '@/components/contatos/common';
import { useScoringRules } from '@/hooks/contatos';

const ContatoDetalhePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { rules, getConfigForCategory, getMaxScore } = useScoringRules();
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});

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
      setContact(data as Contact);
      setFormData(data as Contact);
    } catch (error) {
      console.error('Erro ao buscar contato:', error);
      toast.error('Contato não encontrado');
      navigate('/super_admin/contatos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
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
        window.open(`tel:${phone}`, '_blank');
        break;
      case 'email':
        if (contact.email) window.open(`mailto:${contact.email}`, '_blank');
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!contact) return null;

  const config = CATEGORIAS_CONFIG[contact.categoria];
  const hasPontuacao = config?.hasPontuacao;
  const scoringConfig = getConfigForCategory(contact.categoria);
  const maxScore = getMaxScore();
  const minScore = scoringConfig?.pontuacao_minima || 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/super_admin/contatos')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Card */}
        {hasPontuacao && (
          <div className="lg:col-span-3 bg-card rounded-xl shadow-sm p-6 flex flex-col items-center justify-center border border-border">
            <div className="relative h-32 w-32 md:h-40 md:w-40">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="stroke-muted"
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="8"
                />
                <circle
                  className={contact.bloqueado ? 'stroke-red-500' : 'stroke-green-500'}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - (contact.pontuacao_atual || 0) / maxScore)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl md:text-4xl font-bold text-foreground">
                  {Math.round(((contact.pontuacao_atual || 0) / maxScore) * 100)}%
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Pontuação de<br />Contato
                </span>
              </div>
            </div>
            <div className={`mt-4 flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              contact.bloqueado 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${contact.bloqueado ? 'bg-red-500' : 'bg-green-500'}`} />
              {contact.bloqueado ? 'Score Baixo' : 'Liberado'}
            </div>
          </div>
        )}

        {/* Header Card */}
        <div className={`${hasPontuacao ? 'lg:col-span-9' : 'lg:col-span-12'} bg-card rounded-xl shadow-sm p-6 md:p-8 border border-border`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                  contact.status === 'ativo' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {contact.status}
                </span>
                <span className="text-xs text-muted-foreground">ID: #{contact.id.slice(0, 8)}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {contact.empresa || `${contact.nome} ${contact.sobrenome || ''}`}
              </h2>
              {contact.cnpj && (
                <p className="text-muted-foreground text-sm">CNPJ: {contact.cnpj}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <CategoriaBadge categoria={contact.categoria} />
                <TemperaturaBadge temperatura={contact.temperatura} />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => { setEditing(false); setFormData(contact); }}>
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-1" />
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="group relative">
              <Button
                className={contact.bloqueado 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-75' 
                  : 'bg-green-500 hover:bg-green-600 text-white'}
                disabled={contact.bloqueado}
                onClick={() => handleAction('whatsapp')}
              >
                {contact.bloqueado && <Lock className="w-4 h-4 mr-2" />}
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              {contact.bloqueado && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-popover text-popover-foreground text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border">
                  Bloqueado: Pontuação Mínima não atingida
                </div>
              )}
            </div>
            
            <div className="group relative">
              <Button
                className={contact.bloqueado 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-75' 
                  : 'bg-green-600 hover:bg-green-700 text-white'}
                disabled={contact.bloqueado}
                onClick={() => handleAction('phone')}
              >
                {contact.bloqueado && <Lock className="w-4 h-4 mr-2" />}
                <Phone className="w-4 h-4 mr-2" />
                Ligação
              </Button>
              {contact.bloqueado && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-popover text-popover-foreground text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border">
                  Bloqueado: Pontuação Mínima não atingida
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => handleAction('email')}
              disabled={!contact.email}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="identidade" className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="inteligencia">Inteligência</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="observacoes">Observações</TabsTrigger>
        </TabsList>

        <TabsContent value="identidade">
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-6">
              Dados de Identidade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Nome</Label>
                <Input
                  value={editing ? formData.nome : contact.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Sobrenome</Label>
                <Input
                  value={editing ? formData.sobrenome || '' : contact.sobrenome || ''}
                  onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Empresa</Label>
                <Input
                  value={editing ? formData.empresa || '' : contact.empresa || ''}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Categoria</Label>
                {editing ? (
                  <Select
                    value={formData.categoria}
                    onValueChange={(v) => setFormData({ ...formData, categoria: v as CategoriaContato })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_ORDER.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORIAS_CONFIG[cat].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={CATEGORIAS_CONFIG[contact.categoria].label} readOnly className="bg-muted" />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Telefone</Label>
                <Input
                  value={editing ? formData.telefone : contact.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                <Input
                  value={editing ? formData.email || '' : contact.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">CNPJ</Label>
                <Input
                  value={editing ? formData.cnpj || '' : contact.cnpj || ''}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Website</Label>
                <Input
                  value={editing ? formData.website || '' : contact.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Endereço</Label>
                <Input
                  value={editing ? formData.endereco || '' : contact.endereco || ''}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Bairro</Label>
                <Input
                  value={editing ? formData.bairro || '' : contact.bairro || ''}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Cidade / Estado</Label>
                <div className="flex gap-2">
                  <Input
                    value={editing ? formData.cidade || '' : contact.cidade || ''}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    readOnly={!editing}
                    className={!editing ? 'bg-muted flex-1' : 'flex-1'}
                  />
                  <Input
                    value={editing ? formData.estado || '' : contact.estado || ''}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    readOnly={!editing}
                    className={!editing ? 'bg-muted w-20' : 'w-20'}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inteligencia">
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-6">
              Inteligência Comercial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Tomador de Decisão</Label>
                <Input
                  value={editing ? formData.tomador_decisao || '' : contact.tomador_decisao || ''}
                  onChange={(e) => setFormData({ ...formData, tomador_decisao: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                  placeholder="Nome do decisor"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Cargo</Label>
                <Input
                  value={editing ? formData.cargo_tomador || '' : contact.cargo_tomador || ''}
                  onChange={(e) => setFormData({ ...formData, cargo_tomador: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                  placeholder="Cargo do decisor"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Público-Alvo</Label>
                <Textarea
                  value={editing ? formData.publico_alvo || '' : contact.publico_alvo || ''}
                  onChange={(e) => setFormData({ ...formData, publico_alvo: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                  placeholder="Descreva o público-alvo da empresa"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">Dores Identificadas</Label>
                <Textarea
                  value={editing ? formData.dores_identificadas || '' : contact.dores_identificadas || ''}
                  onChange={(e) => setFormData({ ...formData, dores_identificadas: e.target.value })}
                  readOnly={!editing}
                  className={!editing ? 'bg-muted' : ''}
                  placeholder="Principais dores e desafios"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-6">
              Histórico de Conversas
            </h3>
            <p className="text-muted-foreground text-sm">
              Histórico de conversas WhatsApp será integrado aqui.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="observacoes">
          <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-6">
              Observações Internas
            </h3>
            <Textarea
              value={editing ? formData.observacoes_estrategicas || '' : contact.observacoes_estrategicas || ''}
              onChange={(e) => setFormData({ ...formData, observacoes_estrategicas: e.target.value })}
              readOnly={!editing}
              className={`min-h-[200px] ${!editing ? 'bg-muted' : ''}`}
              placeholder="Observações estratégicas sobre o contato..."
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContatoDetalhePage;
