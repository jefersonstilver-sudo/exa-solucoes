
# Plano: Correções no Modal de Upload de Logo

## Problemas Identificados na Imagem

1. **Card "Original" com fundo cinza** - Deveria ter fundo vermelho igual ao card "Otimizada (IA)"
2. **Falta botão "Usar Original"** - Quando a logo já vem sem fundo (PNG branco), o usuário deveria poder usá-la diretamente sem processar com IA
3. **Logo sempre deve ser BRANCA** - O sistema não deve permitir logos coloridas; quando for colorida, a IA deve processar para converter em branco

---

## Alterações Propostas

### 1. Card "Original" com fundo vermelho (igual ao Processada)

**Linha 293-300 do `ClientLogoUploadModal.tsx`:**

De:
```tsx
bg-gradient-to-br from-slate-100 to-slate-200 border-2 transition-all
```

Para:
```tsx
bg-gradient-to-r from-[#4a0f0f] via-[#6B1515] to-[#7D1818] border-2 transition-all
```

E na imagem do original, aplicar o mesmo filtro branco:
```tsx
className="max-w-full max-h-full object-contain filter brightness-0 invert"
```

---

### 2. Adicionar botão "Usar Original" (ao lado do "Processar com IA")

Na seção de botões (linhas 463-471), quando houver arquivo selecionado e estado idle, mostrar **DOIS botões**:

```tsx
{selectedFile && processingState === 'idle' && (
  <>
    <Button 
      onClick={handleUseOriginal}
      variant="outline"
      className="flex-1 border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E]/10"
    >
      <Check className="h-4 w-4 mr-1.5" />
      Usar Original
    </Button>
    <Button 
      onClick={processLogoWithAI}
      className="flex-1 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
    >
      <Wand2 className="h-4 w-4 mr-1.5" />
      Otimizar com IA
    </Button>
  </>
)}
```

Nova função `handleUseOriginal`:
```tsx
const handleUseOriginal = async () => {
  if (!selectedFile || !previewUrl) return;
  
  setProcessingState('uploading');
  
  try {
    const { data, error } = await supabase.functions.invoke('process-client-logo', {
      body: {
        imageBase64: previewUrl,
        fileName: selectedFile.name,
        onlyUploadOriginal: true  // <-- Sinaliza para não processar com IA
      }
    });

    if (error || !data?.success) throw new Error(data?.error || 'Erro ao enviar');

    setOriginalUrl(data.originalUrl + `?v=${Date.now()}`);
    setSelectedVariant('original');
    setProcessingState('done');
    toast.success('Logo enviada com sucesso!');
  } catch (error: any) {
    setProcessingState('error');
    setErrorMessage(error.message);
    toast.error('Erro ao enviar logo');
  }
};
```

---

### 3. Forçar logo sempre BRANCA (filtro visual)

O filtro `brightness-0 invert` já transforma qualquer cor em branco para exibição.

Porém, a regra de negócio pede:
- **Logo colorida → IA DEVE processar para torná-la branca**

Para isso, precisamos **atualizar o prompt da Edge Function** para instruir a IA a converter para branco:

**Na Edge Function (`process-client-logo/index.ts`), linha 117-125:**

De:
```text
3. Keep the original logo colors and design intact
```

Para:
```text
3. Convert the logo to pure WHITE color only (all parts of the logo should be white)
4. The output should be white logo on transparent background
5. This is critical: the final logo must be completely white, no other colors
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/proposals/ClientLogoUploadModal.tsx` | Fundo vermelho no card Original + botão "Usar Original" + filtro branco |
| `supabase/functions/process-client-logo/index.ts` | Atualizar prompt para converter logo em branco |

---

## Resultado Visual Esperado

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Upload de Logo do Cliente                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐   ┌─────────────────────────┐                 │
│  │  ORIGINAL               │   │  OTIMIZADA (IA)         │                 │
│  │  ═══════════════════    │   │  ═══════════════════    │                 │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │                 │
│  │  ▓  FUNDO VERMELHO  ▓   │   │  ▓  FUNDO VERMELHO  ▓   │                 │
│  │  ▓    [LOGO]        ▓   │   │  ▓    [LOGO]        ▓   │                 │
│  │  ▓   BRANCA         ▓   │   │  ▓   BRANCA         ▓   │                 │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │                 │
│  └─────────────────────────┘   └─────────────────────────┘                 │
│                                                                             │
│              ╳ Escolher outra imagem                                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐   ┌────────────────────────┐                   │
│  │   ✓ Usar Original      │   │   ✨ Otimizar com IA   │                   │
│  │   (outline vermelho)   │   │   (vermelho sólido)    │                   │
│  └────────────────────────┘   └────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Checklist de Implementação

### Modal (`ClientLogoUploadModal.tsx`)
- [ ] Mudar fundo do card Original para gradiente vermelho `from-[#4a0f0f] via-[#6B1515] to-[#7D1818]`
- [ ] Aplicar filtro branco `filter brightness-0 invert` na imagem original
- [ ] Adicionar função `handleUseOriginal` que chama Edge Function com `onlyUploadOriginal: true`
- [ ] Mostrar dois botões lado a lado: "Usar Original" (outline) e "Otimizar com IA" (sólido)
- [ ] Ajustar mensagens de erro para branco (texto legível sobre fundo vermelho)

### Edge Function (`process-client-logo`)
- [ ] Atualizar prompt para instruir IA a converter logo para BRANCO
- [ ] Garantir que o fluxo `onlyUploadOriginal` continua funcionando

### Testes
- [ ] Upload de logo PNG branca sem fundo → aparece corretamente nos dois cards
- [ ] Upload de logo colorida → IA processa e converte para branco
- [ ] Botão "Usar Original" funciona e salva a logo
- [ ] Botão "Otimizar com IA" funciona e salva a logo processada
