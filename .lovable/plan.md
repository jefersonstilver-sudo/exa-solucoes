

# Plano: Slider deve escalar a logo, não o container vermelho

## Problema

O slider está escalando o **container vermelho** (div com background gradient) via `width/height` dinâmicos nas linhas 289-291. A logo dentro dele cresce proporcionalmente ao container, mas o efeito visual é que o "fundo vermelho" está crescendo — não a logo em si.

## Solução

Manter o container com tamanho **fixo** (`w-20 h-20` = 80px) e aplicar o `scale()` **apenas na imagem** (`<img>`). Remover os estilos inline dinâmicos do container.

### Mudança em `CompanyBrandSection.tsx`

**Container (linhas 287-292):** Voltar a tamanho fixo:
```tsx
className="rounded-2xl bg-gradient-to-br from-[#4a0f0f] via-[#6B1515] to-[#7D1818] w-20 h-20 flex items-center justify-center shadow-lg overflow-visible transition-all duration-200"
// Remover style={{ width, height, padding }}
```

**Imagem (linha 297):** Manter o `scale()` transform que já existe, e garantir `overflow-visible` no container para que a logo possa "transbordar" visualmente quando maior que 100%.

## Arquivo alterado
- `src/components/settings/CompanyBrandSection.tsx` — container fixo + `overflow-visible`

