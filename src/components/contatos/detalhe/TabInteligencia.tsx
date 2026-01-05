import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Target, Briefcase, Instagram, DollarSign, Globe, Phone, MessageCircle, Plus, X, Lock } from 'lucide-react';
import { Contact, isWhatsAppOrigin } from '@/types/contatos';

interface TabInteligenciaProps {
  contact: Contact;
  editing: boolean;
  formData: Partial<Contact>;
  setFormData: (data: Partial<Contact>) => void;
}

export const TabInteligencia: React.FC<TabInteligenciaProps> = ({ 
  contact, 
  editing, 
  formData, 
  setFormData 
}) => {
  const handleChange = (field: keyof Contact, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const displayValue = (field: keyof Contact) => {
    return editing ? (formData[field] as string) || '' : (contact[field] as string) || '';
  };

  return (
    <div className="space-y-4">
      {/* Tomador de Decisão */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4" />
            Tomador de Decisão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Nome do Decisor</Label>
              <Input
                value={displayValue('tomador_decisao')}
                onChange={(e) => handleChange('tomador_decisao', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Quem decide a compra?"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cargo</Label>
              <Input
                value={displayValue('cargo_tomador')}
                onChange={(e) => handleChange('cargo_tomador', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Ex: Diretor, Gerente, Proprietário"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Comerciais */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Informações Comerciais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp Principal */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-green-600" />
                WhatsApp Principal
                {isWhatsAppOrigin(contact.origem) && (
                  <Lock className="w-3 h-3 text-muted-foreground ml-1" />
                )}
              </Label>
              <div className="relative">
                <Input
                  value={editing && !isWhatsAppOrigin(contact.origem) ? formData.telefone || '' : contact.telefone || ''}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  readOnly={!editing || isWhatsAppOrigin(contact.origem)}
                  className={(!editing || isWhatsAppOrigin(contact.origem)) ? 'bg-muted pl-8' : 'pl-8'}
                  placeholder="(00) 00000-0000"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-green-600">📱</span>
              </div>
              {isWhatsAppOrigin(contact.origem) && (
                <Badge variant="secondary" className="text-xs font-normal">
                  Origem WhatsApp - não editável
                </Badge>
              )}
            </div>

            {/* Telefones Adicionais */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Telefones Adicionais
              </Label>
              <div className="space-y-2">
                {(editing ? formData.telefones_adicionais : contact.telefones_adicionais)?.map((tel, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={tel}
                      onChange={(e) => {
                        const newTels = [...(formData.telefones_adicionais || [])];
                        newTels[idx] = e.target.value;
                        handleChange('telefones_adicionais', newTels);
                      }}
                      readOnly={!editing}
                      className={!editing ? 'bg-muted flex-1' : 'flex-1'}
                      placeholder="(00) 00000-0000"
                    />
                    {editing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          const newTels = (formData.telefones_adicionais || []).filter((_, i) => i !== idx);
                          handleChange('telefones_adicionais', newTels);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {editing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const currentTels = formData.telefones_adicionais || [];
                      handleChange('telefones_adicionais', [...currentTels, '']);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar telefone
                  </Button>
                )}
                {!editing && (!contact.telefones_adicionais || contact.telefones_adicionais.length === 0) && (
                  <p className="text-sm text-muted-foreground">Nenhum telefone adicional</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Tipo de Negócio</Label>
              <Input
                value={displayValue('tipo_negocio')}
                onChange={(e) => handleChange('tipo_negocio', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Ex: Restaurante, Loja, Clínica"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Ticket Estimado
              </Label>
              <Input
                type="number"
                value={editing ? formData.ticket_estimado || '' : contact.ticket_estimado || ''}
                onChange={(e) => handleChange('ticket_estimado', e.target.value ? Number(e.target.value) : undefined)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Valor mensal estimado"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presença Digital */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Presença Digital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Instagram className="w-3 h-3" />
                Instagram
              </Label>
              <Input
                value={displayValue('instagram')}
                onChange={(e) => handleChange('instagram', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="@usuario"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Website</Label>
              <Input
                value={displayValue('website')}
                onChange={(e) => handleChange('website', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onde Anuncia Hoje */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Target className="w-4 h-4" />
            Onde Anuncia Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contact.onde_anuncia_hoje && contact.onde_anuncia_hoje.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {contact.onde_anuncia_hoje.map((canal, idx) => (
                <Badge key={idx} variant="secondary">{canal}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum canal informado</p>
          )}
        </CardContent>
      </Card>

      {/* Público-alvo e Dores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Público-Alvo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={displayValue('publico_alvo')}
              onChange={(e) => handleChange('publico_alvo', e.target.value)}
              readOnly={!editing}
              className={!editing ? 'bg-muted min-h-[80px]' : 'min-h-[80px]'}
              placeholder="Descreva o público-alvo do cliente"
            />
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Dores Identificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={displayValue('dores_identificadas')}
              onChange={(e) => handleChange('dores_identificadas', e.target.value)}
              readOnly={!editing}
              className={!editing ? 'bg-muted min-h-[80px]' : 'min-h-[80px]'}
              placeholder="Quais problemas o cliente quer resolver?"
            />
          </CardContent>
        </Card>
      </div>

      {/* Observações Estratégicas */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Observações Estratégicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={displayValue('observacoes_estrategicas')}
            onChange={(e) => handleChange('observacoes_estrategicas', e.target.value)}
            readOnly={!editing}
            className={!editing ? 'bg-muted min-h-[100px]' : 'min-h-[100px]'}
            placeholder="Anotações importantes para a negociação"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TabInteligencia;
