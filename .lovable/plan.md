

# Plano: Correção Completa do Modal de Upload de Logo

## Problemas Identificados na Imagem

1. **Card Original mostra "Erro ao carregar"** - A imagem do preview local (`previewUrl`) está sendo ignorada e tentando carregar `originalUrl` que ainda não existe
2. **Card Processada mostra "IA não retornou imagem"** - O estado `processingState === 'done'` mas sem `processedUrl` cai no fallback errado
3. **"Preview na Proposta" ainda está visível** - A seção deveria ter sido removida completamente mas aparece na imagem
4. **Layout desajustado com scroll** - Os cards ainda parecem grandes demais

---

## Causa Raiz dos Erros

### Erro 1: Original não carrega

Na linha 356, o código usa:
```tsx
src={originalUrl || previewUrl}
```

O problema é que quando `originalUrl` é `null` e o componente renderiza, ele tenta mostrar `previewUrl`. Porém, se houver um erro no carregamento anterior (state persiste), mostra "Erro ao carregar".

**Solução**: Sempre usar `previewUrl` para o preview local no card Original, e apenas substituir por `originalUrl` quando ele existir e for válido.

### Erro 2: "IA não retornou imagem"

Na linha 434-438, o fallback para quando `processingState === 'done'` mas não tem `processedUrl`:
```tsx
} else {
  <div className="text-white/60 text-center p-4">
    <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
    <p className="text-sm">IA não retornou imagem</p>
  </div>
}
```

Isso aparece mesmo quando o usuário ainda não tentou processar. A lógica precisa considerar se o usuário já tentou processar ou não.

### Erro 3: Preview na Proposta ainda visível

A imagem mostra o "Preview na Proposta" ainda aparecendo, o que indica que a remoção não foi aplicada corretamente ou há outro componente renderizando isso.

---

## Correções Necessárias

### 1. Corrigir lógica do Card Original (linhas 354-361)

**De:**
```tsx
{previewUrl && (
  <img 
    src={originalUrl || previewUrl} 
    alt="Original" 
    className="max-w-full max-h-full object-contain filter brightness-0 invert"
    onError={() => setOriginalImageError(true)}
  />
)}
{originalImageError && (
```

**Para:**
```tsx
{previewUrl && !originalImageError && (
  <img 
    src={previewUrl} 
    alt="Original" 
    className="max-w-full max-h-full object-contain filter brightness-0 invert"
    onError={() => setOriginalImageError(true)}
  />
)}
{originalImageError && (
```

O preview local **sempre deve ser visível** porque é a imagem que o usuário selecionou do computador. Não depende de upload.

### 2. Corrigir lógica do Card Processada (linhas 401-438)

O estado `processingState === 'done'` mas sem `processedUrl` só deve mostrar "IA não retornou" se realmente tentou processar. Adicionar um state para rastrear se tentou processar:

**Novo state:**
```tsx
const [attemptedProcessing, setAttemptedProcessing] = useState(false);
```

E atualizar a lógica:
- Quando `processingState === 'idle'` e não tentou processar: mostrar "Clique para otimizar"
- Quando `processingState === 'done'` e `attemptedProcessing` mas sem `processedUrl`: mostrar "IA não retornou"
- Quando tem `processedUrl`: mostrar a imagem

### 3. Remover seção "Preview na Proposta"

A linha 449 mostra apenas um comentário, mas a seção original pode não ter sido removida. Verificar se há código adicional no arquivo que precisa ser removido.

### 4. Garantir layout compacto sem scroll

- Cards com `h-36` (já aplicado)
- Espaçamentos `gap-4` e `space-y-4` (já aplicados)
- Modal `sm:max-w-3xl` (já aplicado)

---

## Estrutura Final do Modal

```text
┌─────────────────────────────────────────────────────────────────┐
│  ✨ Upload de Logo do Cliente                                   │
│  Faça upload da logo...                                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐   ┌────────────────────────┐       │
│  │  Original   [○ Usar]   │   │  ✨ Otimizada [○ Usar] │       │
│  │  ▓▓▓ FUNDO VERMELHO ▓▓ │   │  ▓▓▓ FUNDO VERMELHO ▓▓ │ h-36 │
│  │  ▓   [LOGO BRANCA]   ▓ │   │  ▓  Clique Processar  ▓ │       │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │       │
│  └────────────────────────┘   └────────────────────────┘       │
│                                                                 │
│              ╳ Escolher outra imagem                            │
├─────────────────────────────────────────────────────────────────┤
│  [Cancelar]  [✓ Usar Original]  [✨ Otimizar com IA]           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Checklist de Implementação

### ClientLogoUploadModal.tsx

1. **Linha 354-361**: Corrigir para sempre usar `previewUrl` no card Original (não tentar carregar `originalUrl`)
2. **Adicionar state**: `attemptedProcessing` para rastrear se tentou processar com IA
3. **Linha 127**: No início de `processLogoWithAI`, setar `setAttemptedProcessing(true)`
4. **Linha 43**: No `resetState`, adicionar `setAttemptedProcessing(false)`
5. **Linhas 418-438**: Ajustar lógica para usar `attemptedProcessing` em vez de mostrar "IA não retornou" quando nem tentou
6. **Verificar remoção completa** da seção "Preview na Proposta"
7. **Adicionar key única** nos elementos de imagem para forçar re-render quando URLs mudam

---

## Resultado Esperado

- Card Original sempre mostra a imagem selecionada (preview local)
- Card Processada mostra "Clique para processar" quando ainda não tentou
- Card Processada mostra "IA não retornou" apenas se realmente tentou e falhou
- Card Processada mostra a logo processada quando tem sucesso
- Sem scroll no modal
- Layout minimalista glass
- Sem a seção "Preview na Proposta"

