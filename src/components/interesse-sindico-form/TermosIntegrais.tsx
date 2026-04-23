import React from 'react';
import { TERMOS_MARKDOWN } from './termosTexto';

/**
 * Renderizador leve de markdown — suporta apenas:
 * - ### título (H3)
 * - **bold**
 * - listas com "- "
 * - parágrafos
 * Sem dependência externa para manter bundle enxuto.
 */
function renderInline(text: string): React.ReactNode {
  // Quebra por **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

export const TermosIntegrais: React.FC = () => {
  const lines = TERMOS_MARKDOWN.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`}>
        {listBuffer.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      blocks.push(
        <h3 key={`h-${key++}`}>{renderInline(line.replace(/^###\s+/, ''))}</h3>
      );
    } else if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2));
    } else {
      flushList();
      blocks.push(<p key={`p-${key++}`}>{renderInline(line)}</p>);
    }
  }
  flushList();

  return <div className="sif-termos-content">{blocks}</div>;
};

export default TermosIntegrais;
