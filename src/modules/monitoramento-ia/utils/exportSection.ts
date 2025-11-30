/**
 * Utility to export a single section to a formatted text file
 */

export const exportSection = (
  agentName: string,
  sectionNumber: number,
  sectionTitle: string,
  content: string
) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  let fileContent = '';
  
  // Header
  fileContent += '╔══════════════════════════════════════════════════════════════╗\n';
  fileContent += `║  SEÇÃO ${sectionNumber} - ${agentName.toUpperCase().padEnd(48)} ║\n`;
  fileContent += `║  Exportado em: ${dateStr} às ${timeStr}${' '.repeat(24 - dateStr.length - timeStr.length)}║\n`;
  fileContent += '╚══════════════════════════════════════════════════════════════╝\n\n';
  
  // Section title
  fileContent += '═'.repeat(70) + '\n';
  fileContent += `[SEÇÃO ${sectionNumber}] - ${sectionTitle}\n`;
  fileContent += '═'.repeat(70) + '\n\n';
  
  // Content
  fileContent += content + '\n\n';
  
  // Footer
  fileContent += '═'.repeat(70) + '\n';
  fileContent += `FIM DA SEÇÃO ${sectionNumber}\n`;
  fileContent += `Total de caracteres: ${content.length}\n`;
  fileContent += `Total de linhas: ${content.split('\n').length}\n`;
  fileContent += '═'.repeat(70) + '\n';
  
  // Create blob and download
  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const fileName = `${agentName.toLowerCase().replace(/\s+/g, '_')}_secao_${sectionNumber}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.txt`;
  
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
