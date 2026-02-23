
# Corrigir Scroll e Seleção de Texto na Proposta Pública

## Problema Identificado

Duas causas raiz encontradas nos CSS globais:

1. **`src/styles/pwa-native.css` (linhas 11-12)**: Aplica `user-select: none` no `body` inteiro, bloqueando toda seleção de texto em TODAS as páginas, incluindo a proposta pública
2. **`src/styles/pwa-native.css` (linhas 41-43)**: Aplica `touch-action: manipulation` em TODOS os elementos (`*`), o que pode interferir com scroll nativo em alguns navegadores/dispositivos

Esses estilos fazem sentido para o painel admin (PWA), mas quebram a experiência do cliente na página pública da proposta.

## Solução

### Arquivo 1: `src/styles/pwa-native.css`

- **Remover** `user-select: none` do `body` global (linhas 11-12)
- **Mover** essa regra para dentro de `@media all and (display-mode: standalone)` para que só se aplique quando o app está instalado como PWA (onde faz sentido bloquear seleção)
- **Restringir** `touch-action: manipulation` para não afetar o scroll nativo removendo-o do seletor `*` global e aplicando apenas a botões e links

### Arquivo 2: `src/pages/public/PropostaPublicaPage.tsx`

- Adicionar classe `select-text` no container principal da proposta pública (linha 1757) para garantir que texto seja selecionável mesmo em contextos PWA
- A classe usará `user-select: text !important` como override de segurança

### Arquivo 3: `src/styles/base.css` (ou utilitário)

- Adicionar classe utilitária `.select-text` com `user-select: text !important` para uso em páginas públicas

## Detalhes Técnicos

### pwa-native.css - Mudanças

**Antes (problemático)**:
```text
body {
  overscroll-behavior-y: contain;
  -webkit-user-select: none;
  user-select: none;
}

* {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

**Depois (corrigido)**:
```text
body {
  overscroll-behavior-y: contain;
}

/* user-select: none apenas em PWA standalone */
@media all and (display-mode: standalone) {
  body {
    -webkit-user-select: none;
    user-select: none;
  }
}

/* touch-action apenas em elementos interativos, não em tudo */
button, a, [role="button"], [type="button"], [type="submit"] {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

### PropostaPublicaPage.tsx

Adicionar `select-text` ao container principal para garantir seleção de texto:
```text
<div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 select-text">
```

### Classe utilitária

```text
.select-text {
  -webkit-user-select: text !important;
  user-select: text !important;
}

.select-text * {
  -webkit-user-select: text !important;
  user-select: text !important;
}
```

## Resultado Esperado

- Scroll com rodinha do mouse funciona normalmente na proposta pública
- Texto pode ser selecionado e copiado pelo cliente
- Painel admin PWA mantém comportamento nativo (sem seleção de texto quando instalado)
- Nenhuma alteração visual ou funcional em outras partes do sistema
