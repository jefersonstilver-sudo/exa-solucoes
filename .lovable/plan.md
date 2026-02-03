

# Reconstrucao Completa do PDF de Proposta Comercial

## Problema Principal: Logo do Cliente AUSENTE

O arquivo `ProposalPDFExporter.tsx` **nao inclui** o campo `client_logo_url` na interface `ProposalData` (linhas 10-47) e nenhum metodo renderiza a logo do cliente no PDF. O campo existe no banco de dados e na pagina publica, mas foi ignorado no exportador de PDF.

---

## Diagnostico Tecnico Completo

### 1. Logo do Cliente Faltando

| Local | Status |
|-------|--------|
| Banco de dados (`proposals.client_logo_url`) | Existe |
| Pagina publica (`PropostaPublicaPage.tsx`) | Funcionando |
| Interface PDF (`ProposalData` linha 10-47) | **FALTANDO** |
| Header do PDF (`drawElegantHeader`) | **FALTANDO** |

### 2. Erros de Acentuacao (jsPDF)

O jsPDF nao suporta caracteres Unicode nativamente. Textos como "Duracao", "Exibicoes/mes", "Aprovacao" aparecem corrompidos.

### 3. Layout Desorganizado

- Imagem `drawVerticalPremiumShowcase()` ocupa espaco desnecessario
- Cards de pagamento com alturas inconsistentes
- Tabela de predios com colunas truncadas

---

## Solucao Proposta

### Novo Layout do Header (com Logo do Cliente)

```text
+--------------------------------------------------+
|                                                  |
|  [LOGO EXA]   PROPOSTA COMERCIAL   [LOGO CLIENTE]|
|               Publicidade Elevadores             |
|                                                  |
|  Emitido: 03/02/2026          Vendedor: Joao     |
|  ------------------------------------------------|
```

A logo do cliente sera exibida no canto superior direito, em preto (para impressao), ao lado da logo EXA que fica no canto esquerdo.

---

## Alteracoes Tecnicas

### Arquivo: `src/components/admin/proposals/ProposalPDFExporter.tsx`

#### 1. Adicionar campo na interface ProposalData (linha 27)

```typescript
interface ProposalData {
  // ... campos existentes ...
  client_logo_url?: string | null;  // ADICIONAR
}
```

#### 2. Modificar drawElegantHeader para incluir logo do cliente

No metodo `drawElegantHeader` (linha 275), adicionar logica para carregar e renderizar a logo do cliente no canto direito do header, usando signed URL para buckets privados.

```typescript
private async drawElegantHeader(proposal: ProposalData, sellerName: string, isCortesia: boolean = false): Promise<void> {
  // ... logo EXA no lado esquerdo (ja existe) ...
  
  // NOVO: Logo do cliente no lado direito
  if (proposal.client_logo_url) {
    try {
      // Gerar signed URL se for Supabase Storage
      let logoUrl = proposal.client_logo_url;
      const storagePattern = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;
      const match = logoUrl.match(storagePattern);
      
      if (match) {
        const bucketName = match[1];
        const filePath = match[2].split('?')[0];
        const { data: signedData } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 3600);
        if (signedData?.signedUrl) {
          logoUrl = signedData.signedUrl;
        }
      }
      
      const clientLogoData = await this.loadImageAsDataURLBlack(logoUrl);
      // Posicionar no canto direito, antes do titulo
      this.doc.addImage(clientLogoData, 'PNG', this.pageWidth - this.margin - 25, 10, 22, 18);
    } catch (err) {
      console.error('Erro ao carregar logo do cliente:', err);
    }
  }
  
  // ... resto do header ...
}
```

#### 3. Criar funcao de normalizacao de acentos

```typescript
private normalizeText(text: string): string {
  const accentsMap: Record<string, string> = {
    'a': 'a', 'a': 'a', 'a': 'a', 'a': 'a',
    'e': 'e', 'e': 'e', 'e': 'e',
    'i': 'i', 'i': 'i', 'i': 'i',
    'o': 'o', 'o': 'o', 'o': 'o', 'o': 'o',
    'u': 'u', 'u': 'u', 'u': 'u',
    'c': 'c', 'n': 'n',
    // maiusculas
    'A': 'A', 'A': 'A', 'A': 'A', 'A': 'A',
    'E': 'E', 'E': 'E', 'E': 'E',
    'I': 'I', 'I': 'I', 'I': 'I',
    'O': 'O', 'O': 'O', 'O': 'O', 'O': 'O',
    'U': 'U', 'U': 'U', 'U': 'U',
    'C': 'C', 'N': 'N'
  };
  return text.split('').map(char => accentsMap[char] || char).join('');
}
```

#### 4. Remover imagem grande desnecessaria

No metodo `generateProposalPDF` (linha 1160), remover ou comentar:

```typescript
// REMOVER esta linha:
// await this.drawVerticalPremiumShowcase();
```

#### 5. Aplicar normalizacao em todos os textos

Substituir textos estaticos por versoes normalizadas:
- "Duracao" (ja sem acento)
- "Exibicoes/mes" 
- "Aprovacao do conteudo em ate 48 horas uteis"
- Etc.

#### 6. Ajustar larguras da tabela de predios

```typescript
const cols = [
  { label: '#', x: this.margin + 2, w: 8 },           // NOVO: numeracao
  { label: 'PREDIO', x: this.margin + 11, w: 55 },    // Ajustado
  { label: 'BAIRRO', x: this.margin + 68, w: 32 },    // Ajustado
  { label: 'ENDERECO', x: this.margin + 102, w: 42 }, // Ajustado
  { label: 'TELAS', x: this.margin + 146, w: 14 },
  { label: 'IMP/MES', x: this.margin + 162, w: 20 }
];
```

---

## Nova Ordem das Secoes

1. Header (Logo EXA esquerda + Logo Cliente direita)
2. Identificacao da Proposta
3. Dados do Cliente (compacto, 2 colunas)
4. Produto Escolhido (mockup + specs)
5. Locais Contratados (tabela com numeracao)
6. Investimento (cards alinhados)
7. Termos e Condicoes (lista compacta)
8. Footer (QR Code + Contato Vendedor)

**REMOVIDO**: `drawVerticalPremiumShowcase()` (imagem grande)

---

## Checklist de Implementacao

### Interface e Dados
- [ ] Adicionar `client_logo_url` na interface `ProposalData`

### Logo do Cliente
- [ ] Implementar logica de signed URL no `drawElegantHeader`
- [ ] Carregar logo em preto usando `loadImageAsDataURLBlack`
- [ ] Posicionar no canto superior direito (antes do titulo)

### Normalizacao de Texto
- [ ] Criar metodo `normalizeText()`
- [ ] Aplicar em titulos de secao
- [ ] Aplicar em condicoes gerais
- [ ] Aplicar em labels da tabela

### Layout
- [ ] Remover `drawVerticalPremiumShowcase()`
- [ ] Ajustar colunas da tabela de predios
- [ ] Adicionar coluna de numeracao (#)
- [ ] Uniformizar altura dos cards de pagamento

### Testes
- [ ] Gerar PDF com logo do cliente
- [ ] Gerar PDF sem logo do cliente (fallback)
- [ ] Verificar que textos nao estao corrompidos
- [ ] Verificar que cabe em 1-2 paginas

---

## Resultado Esperado

PDF profissional com:
- Logo do cliente no header (preto, lado direito)
- Logo EXA no header (preto, lado esquerdo)
- Textos sem caracteres corrompidos
- Layout compacto (1-2 paginas)
- Predios em lista/tabela com numeracao
- Espacamentos consistentes

