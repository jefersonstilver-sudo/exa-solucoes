import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContatos, useScoringRules } from '@/hooks/contatos';
import { CategoriaBadge, ScoreProgressBar } from '@/components/contatos/common';
import { CATEGORIAS_CONFIG } from '@/types/contatos';

const BloqueiosPage = () => {
  const navigate = useNavigate();
  const { contacts, loading } = useContatos({ bloqueado: true });
  const { rules, getConfigForCategory, getMaxScore } = useScoringRules();

  const getMissingFields = (contact: any) => {
    const missing: { field: string; pontos: number }[] = [];
    
    rules.filter(r => r.ativo).forEach(rule => {
      const value = contact[rule.campo];
      if (!value || value === '') {
        missing.push({ field: rule.label, pontos: rule.pontos });
      }
    });

    return missing.sort((a, b) => b.pontos - a.pontos).slice(0, 3);
  };

  const getPontosRestantes = (contact: any) => {
    const config = getConfigForCategory(contact.categoria);
    if (!config) return 0;
    return Math.max(0, config.pontuacao_minima - (contact.pontuacao_atual || 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/super_admin/contatos')}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Contatos Bloqueados
            </h1>
            <p className="text-sm text-muted-foreground">
              Contatos que precisam de mais dados para liberar ações
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="text-2xl font-bold text-foreground">{contacts.length}</div>
          <div className="text-sm text-muted-foreground">Total Bloqueados</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="text-2xl font-bold text-red-600">
            {contacts.filter(c => (c.pontuacao_atual || 0) < 25).length}
          </div>
          <div className="text-sm text-muted-foreground">Score Crítico (&lt;25%)</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="text-2xl font-bold text-amber-600">
            {contacts.filter(c => (c.pontuacao_atual || 0) >= 25 && (c.pontuacao_atual || 0) < 50).length}
          </div>
          <div className="text-sm text-muted-foreground">Quase Lá (25-49%)</div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {contacts.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <p className="text-muted-foreground">Nenhum contato bloqueado 🎉</p>
          </div>
        ) : (
          contacts.map((contact) => {
            const config = getConfigForCategory(contact.categoria);
            const minScore = config?.pontuacao_minima || 50;
            const maxScore = getMaxScore();
            const pontosRestantes = getPontosRestantes(contact);
            const missingFields = getMissingFields(contact);

            return (
              <div
                key={contact.id}
                className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CategoriaBadge categoria={contact.categoria} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {contact.pontuacao_atual || 0}/{minScore} pts
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {contact.empresa || `${contact.nome} ${contact.sobrenome || ''}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {contact.telefone}
                    </p>

                    <div className="mt-4">
                      <ScoreProgressBar 
                        score={contact.pontuacao_atual || 0} 
                        minScore={minScore}
                        maxScore={maxScore}
                        showStatus={false}
                      />
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-red-600 mb-2">
                        ❌ Faltam {pontosRestantes} pontos para liberar
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">O que preencher:</p>
                        <ul className="space-y-1">
                          {missingFields.map((field, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {field.field} (+{field.pontos} pts)
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => navigate(`/super_admin/contatos/${contact.id}`)}
                  >
                    Completar Dados
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BloqueiosPage;
