/**
 * Exporta um item de conhecimento individual para arquivo .txt
 */
export const exportKnowledgeItem = (
  agentName: string,
  itemNumber: number,
  title: string,
  content: string,
  keywords: string[],
  description?: string,
  instruction?: string
) => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Monta o conteúdo formatado
  let fileContent = `═══════════════════════════════════════════════════════════
🤖 AGENTE: ${agentName}
📋 ITEM DE CONHECIMENTO 4.${itemNumber}
📅 Exportado em: ${timestamp}
═══════════════════════════════════════════════════════════

🏷️ TÍTULO
${title}

`;

  if (description) {
    fileContent += `📝 DESCRIÇÃO
${description}

`;
  }

  if (keywords.length > 0) {
    fileContent += `🔑 PALAVRAS-CHAVE
${keywords.join(', ')}

`;
  }

  if (instruction) {
    fileContent += `📌 INSTRUÇÃO ESPECÍFICA
${instruction}

`;
  }

  fileContent += `📄 CONTEÚDO
${content}

═══════════════════════════════════════════════════════════
Fim do documento
═══════════════════════════════════════════════════════════`;

  // Cria o blob e faz download
  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Nome do arquivo: agente_4.X_titulo-sanitizado_data.txt
  const sanitizedTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  link.download = `${agentName.toLowerCase()}_4.${itemNumber}_${sanitizedTitle}_${timestamp}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
