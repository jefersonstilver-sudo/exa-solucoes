/**
 * Page: Base de Conhecimento
 * Mock UI para gerenciar documentos e FAQs
 */

import { useState } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KnowledgeCard } from '../components/KnowledgeCard';
import { mockKnowledgeDocuments, mockFAQs, mockKnowledgeStats } from '../utils/mockAIData';
import { toast } from 'sonner';

export const BaseConhecimentoPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (id: number) => {
    toast.info(`Editando documento ${id}...`);
  };

  const handleDelete = (id: number) => {
    toast.success(`Documento ${id} removido!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              <BookOpen className="w-7 h-7" />
              Base de Conhecimento da Agente
            </h1>
            <p className="text-module-secondary">
              Documentos e informações que a IA pode usar para responder
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-module-tertiary" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-module-input border border-module rounded-lg pl-10 pr-4 py-2 text-module-primary placeholder-module-muted focus:outline-none focus:ring-2 focus:ring-module-accent"
              />
            </div>
            <Button className="bg-module-accent hover:bg-module-accent-hover">
              <Plus className="w-4 h-4 mr-2" />
              Novo Documento
            </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-module-card border border-module rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-module-accent mb-1">
            {mockKnowledgeStats.documents}
          </p>
          <p className="text-module-secondary text-sm">Documentos</p>
        </div>
        <div className="bg-module-card border border-module rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-module-accent mb-1">
            {mockKnowledgeStats.faqs}
          </p>
          <p className="text-module-secondary text-sm">FAQs</p>
        </div>
        <div className="bg-module-card border border-module rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-module-accent mb-1">
            {mockKnowledgeStats.policies}
          </p>
          <p className="text-module-secondary text-sm">Políticas</p>
        </div>
      </div>

      {/* Documentos Internos */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <h2 className="text-lg font-bold text-module-primary mb-4">Documentos Internos</h2>
        <div className="space-y-3">
          {mockKnowledgeDocuments.map((doc) => (
            <KnowledgeCard
              key={doc.id}
              title={doc.title}
              type={doc.type}
              updatedAt={doc.updatedAt}
              tags={doc.tags}
              onEdit={() => handleEdit(doc.id)}
              onDelete={() => handleDelete(doc.id)}
            />
          ))}
        </div>
      </div>

      {/* Perguntas Frequentes (FAQs) */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-module-primary">Perguntas Frequentes (FAQs)</h2>
          <Button variant="ghost" size="sm" className="text-module-accent">
            Ver Todas ({mockKnowledgeStats.faqs})
          </Button>
        </div>
        <div className="space-y-3">
          {mockFAQs.map((faq) => (
            <div 
              key={faq.id}
              className="bg-module-input border border-module rounded-lg p-4 hover:border-module-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-module-primary font-medium mb-2 flex items-start gap-2">
                    <span className="text-module-accent">❓</span>
                    {faq.question}
                  </p>
                  <p className="text-module-secondary text-sm ml-6">
                    Resposta: {faq.answer}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(faq.id)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(faq.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
