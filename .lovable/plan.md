

# Correção: Linha Fantasma no Topo das Páginas do PDF de Contrato

## Problema

Na quebra de página do PDF, aparece uma "linha fantasma" - texto cortado/borrado do final da página anterior sangrando no topo da próxima página.

## Causa Raiz

O algoritmo de paginação coleta `rect.bottom` (borda inferior dos elementos) como pontos de quebra. Quando o canvas e fatiado nesse ponto exato, o anti-aliasing e a renderizacao sub-pixel do `html2canvas` fazem com que ~2-4 pixels do texto anterior ainda aparecam no inicio da proxima fatia.

```text
Pagina 1: [...conteudo...] 11.3. A reativacao da veiculacao...
                            ↑ bottom = 1165px (ponto de quebra)
                            
Pagina 2: [ghost line borrada] ← 2-4px do texto anterior
          11.4. A suspensao da veiculacao...
```

## Solucao

Adicionar um **offset de seguranca** (padding) nos pontos de quebra: em vez de cortar exatamente no `rect.bottom`, cortar alguns pixels **depois** (`rect.bottom + gap`), e comecar a proxima pagina pulando esses mesmos pixels. Isso elimina a linha fantasma sem cortar texto real.

### Mudanca 1: `ContractPDFExporter.tsx` (admin) - Adicionar gap nos break points

Na coleta de break points (linhas 114-118), usar `rect.top` dos elementos em vez de `rect.bottom`. Isso garante que o corte aconteca **antes** do inicio do proximo elemento, nao depois do fim do anterior.

```typescript
breakableElements.forEach(el => {
  const rect = (el as HTMLElement).getBoundingClientRect();
  // Usar rect.top em vez de rect.bottom para cortar ANTES do elemento
  const relativeTop = rect.top - containerRect.top;
  if (relativeTop > 0) {
    elementBottoms.push(relativeTop);
  }
});
```

### Mudanca 2: `ContractFullPreview.tsx` (publico) - Mesma correcao

Na coleta de break points (linhas 298-304), aplicar a mesma mudanca para `rect.top`.

```typescript
breakableElements.forEach(el => {
  const rect = (el as HTMLElement).getBoundingClientRect();
  const relativeTop = rect.top - containerRect.top;
  if (relativeTop > 0) {
    elementBottoms.push(relativeTop);
  }
});
```

### Por que `rect.top` resolve?

```text
ANTES (rect.bottom):
  Corte em 1165px (= bottom do paragrafo 11.3)
  Proxima pagina comeca em 1165px → ainda pega pixels residuais do 11.3

DEPOIS (rect.top):
  Corte em 1168px (= top do paragrafo 11.4)
  Proxima pagina comeca em 1168px → comeca limpo no 11.4
  Pagina anterior termina em 1168px → inclui 11.3 completo com folga
```

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/admin/contracts/ContractPDFExporter.tsx` | Trocar `rect.bottom` por `rect.top` nos break points (linhas 114-118) |
| `src/components/public/ContractFullPreview.tsx` | Trocar `rect.bottom` por `rect.top` nos break points (linhas 298-304) |

Nenhuma outra funcionalidade sera alterada - apenas a logica de coleta dos pontos de quebra.

