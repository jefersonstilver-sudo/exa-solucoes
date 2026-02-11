

# Auditoria Completa: PDF da Proposta vs Proposta Online

## Problemas Identificados

### 1. TEXTOS EXPLICATIVOS AUSENTES NO PDF

O PDF nao inclui o "Resumo Executivo" (`ProposalSummaryText.tsx`) que aparece na proposta online. Este e o bloco com:
- "Esta proposta oferece X posicoes no formato Horizontal, com presenca em X predios e X telas..."
- "A midia em elevador e altamente eficaz: publico recorrente..."
- "Com o formato Horizontal e 2 marcas, sua empresa pode manter 8 videos simultaneos..."
- "Com 2 posicoes, sua marca ocupa 2x mais espaco..."

**Solucao**: Criar um novo metodo `drawSummaryText()` no `ProposalPDFExporter.tsx` que reproduza fielmente este bloco de texto, recebendo os mesmos parametros do componente React (tipoProduto, quantidadePosicoes, totalPredios, totalTelas, exibicoesMes, etc).

### 2. LOGO TICKER (MARCAS PARCEIRAS) AUSENTE NO PDF

A proposta online exibe um ticker de marcas parceiras (AASC, Black Bill, Portal da Cidade, Shopping China, Grupo Kammer, etc). O PDF nao inclui nenhuma secao de prova social.

**Solucao**: Criar um metodo `drawPartnerLogosSection()` que liste os nomes das marcas parceiras em formato textual (ex: "Marcas que confiam na EXA: AASC | Black Bill | Secovi-PR | Portal da Cidade | Shopping China | Grupo Kammer | Splendore Alimentos..."). Nao e necessario incluir imagens -- texto e suficiente para prova social em PDF impresso.

### 3. ERROS DE PORTUGUES E PONTUACAO NOS TEXTOS

Todos os textos do PDF passam pela funcao `normalizeText()` que remove acentos. Isso e necessario para o jsPDF. Porem, ha problemas de pontuacao e formatacao:

- `CONDICOES GERAIS` -> deveria ser `CONDICOES GERAIS` (ok, sem acento e correto pelo normalizeText)
- `Aprovacao do conteudo em ate 48 horas uteis` -> falta ponto final
- `Relatorio mensal de impressoes disponivel na plataforma` -> falta ponto final
- `Possibilidade de troca de video durante a campanha` -> falta ponto final
- `Exibicao em rotacao com outros anunciantes (~195s por ciclo)` -> falta ponto final
- `Suporte tecnico via WhatsApp em horario comercial` -> falta ponto final
- `Periodo: 1 mes` -> sem acento esta correto, mas deveria ter ponto final tambem

**Solucao**: Adicionar pontuacao correta (ponto final, ponto-e-virgula) a todos os itens da lista de condicoes gerais.

### 4. ITENS DE PERMUTA COM TEXTO TRUNCADO/CORTADO

Na imagem da "CONTRAPARTIDA ACORDADA", os itens 2-5 estao com texto cortado horizontalmente (ex: item 2 com fonte espaçada e texto saindo da area visivel). Isso e causado por:
- O texto dos itens nao usa `splitTextToSize()` para quebrar linhas longas
- O `boxHeight` e calculado fixo (`35 + (itemsCount * 11)`) sem considerar que itens longos precisam de mais espaco

**Solucao**: No metodo `drawPermutaConditions()`:
- Usar `this.doc.splitTextToSize()` para quebrar textos longos dos itens de permuta
- Calcular o `boxHeight` dinamicamente baseado na altura real de cada item apos a quebra de linha
- Normalizar o texto dos itens com `normalizeText()` para evitar caracteres Unicode corrompidos

### 5. SECAO "CONHECA A EXA MIDIA" - LINKS SEM CONTEXTO

A secao de links esta funcional mas falta contexto. Na proposta online ha um video embed e texto explicativo. No PDF, so aparecem os botoes de link sem descricao.

**Solucao**: Adicionar um subtitulo breve antes dos links: "Saiba mais sobre a EXA Midia e nosso portfolio de solucoes:"

### 6. INFORMACAO DE POSICOES/MARCAS NAO APARECE NO PDF

A proposta online mostra "2x Posicoes por Painel" com card explicativo e as metricas (16 Predios, 24 Telas, 2x Marcas, 534k Exibicoes/mes, 1 Meses). O PDF nao inclui esta informacao de multiplas posicoes/marcas.

**Solucao**: Adicionar a informacao de `quantidade_posicoes` no cabecalho da secao de produto ou como box adicional quando > 1.

## Arquivos a Modificar

1. **`src/components/admin/proposals/ProposalPDFExporter.tsx`**:
   - Criar metodo `drawSummaryText()` reproduzindo o conteudo de `ProposalSummaryText.tsx`
   - Criar metodo `drawPartnerLogosSection()` com nomes das marcas parceiras
   - Corrigir pontuacao em `drawGeneralConditions()`
   - Corrigir truncamento de texto em `drawPermutaConditions()` usando `splitTextToSize()`
   - Adicionar subtitulo em `drawVideoLinksSection()`
   - Adicionar info de multiplas posicoes em `drawProductShowcase()` ou como bloco separado
   - Atualizar `generateProposalPDF()` para chamar os novos metodos na ordem correta

## Ordem de Execucao no PDF (atualizada)

1. Header (logo EXA + logo cliente + titulo)
2. Identificacao da proposta (numero + status)
3. Dados do cliente
4. Produto escolhido (com info de posicoes quando aplicavel)
5. **NOVO**: Resumo executivo (texto explicativo completo)
6. Tabela de predios
7. Condicoes comerciais OU Acordo de permuta (com texto nao truncado)
8. **NOVO**: Marcas parceiras (prova social textual)
9. Conheca a EXA Midia (com subtitulo + links)
10. Condicoes gerais (com pontuacao corrigida)
11. Footer (QR Code + contatos)

