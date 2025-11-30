/**
 * Utility to export agent knowledge base to a formatted text file
 */

interface AgentSection {
  section_number: number;
  section_title: string;
  content: string;
}

interface KnowledgeItem {
  title: string;
  content_type: string;
  content: string;
  keywords?: string[] | null;
  description?: string | null;
}

export const exportKnowledgeBase = (
  agentName: string,
  sections: AgentSection[],
  knowledgeItems: KnowledgeItem[]
) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  let content = '';
  
  // Header
  content += '╔══════════════════════════════════════════════════════════════╗\n';
  content += `║  BASE DE CONHECIMENTO COMPLETA - ${agentName.toUpperCase().padEnd(23)} ║\n`;
  content += `║  Exportado em: ${dateStr} às ${timeStr}${' '.repeat(24 - dateStr.length - timeStr.length)}║\n`;
  content += '╚══════════════════════════════════════════════════════════════╝\n\n';
  
  // Sort sections by section_number
  const sortedSections = [...sections].sort((a, b) => a.section_number - b.section_number);
  
  // Sections 1-3
  sortedSections.forEach((section) => {
    content += '═'.repeat(70) + '\n';
    content += `[SEÇÃO ${section.section_number}] - ${section.section_title}\n`;
    content += '═'.repeat(70) + '\n\n';
    content += section.content + '\n\n';
  });
  
  // Section 4 - Knowledge Items
  if (knowledgeItems.length > 0) {
    content += '═'.repeat(70) + '\n';
    content += '[SEÇÃO 4] - ITENS DE CONHECIMENTO\n';
    content += '═'.repeat(70) + '\n\n';
    
    knowledgeItems.forEach((item, index) => {
      content += `─── Item ${index + 1} ───────────────────────────────────────\n`;
      content += `Título: ${item.title}\n`;
      content += `Tipo: ${item.content_type}\n`;
      
      if (item.keywords && item.keywords.length > 0) {
        content += `Keywords: ${item.keywords.join(', ')}\n`;
      }
      
      if (item.description) {
        content += `Descrição: ${item.description}\n`;
      }
      
      content += '\nConteúdo:\n';
      content += item.content + '\n\n';
    });
  }
  
  // Footer
  content += '═'.repeat(70) + '\n';
  content += 'FIM DO ARQUIVO - Total de seções: ' + sortedSections.length + '\n';
  content += 'Total de itens de conhecimento: ' + knowledgeItems.length + '\n';
  content += '═'.repeat(70) + '\n';
  
  // Create blob and download
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const fileName = `${agentName.toLowerCase().replace(/\s+/g, '_')}_base_conhecimento_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.txt`;
  
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
