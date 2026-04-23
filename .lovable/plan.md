

# Ajustes visuais no formulário `/interessesindico/formulario`

## Problemas reportados

1. **Fundo muito escuro** — preto puro `#0A0000` está pesado, precisa um pouco mais claro.
2. **Logo EXA ausente** — falta marca no topo para profissionalismo.
3. **Lupa sobreposta ao placeholder** no campo "Endereço do prédio" (ícone à esquerda mas o texto começa colado, padding insuficiente).

## Alterações

### 1. `src/components/interesse-sindico-form/styles.css` — linha 4-9
Trocar fundo preto puro por um cinza-grafite com leve calor (mais claro, mantém clima EXA dark premium):
```css
.exa-theme.sif-shell {
  background: radial-gradient(ellipse at top, #1a1416 0%, #15101200 60%), #15101 2;
  /* fallback sólido: #181214 */
  background-color: #181214;
  color: #fff;
  min-height: 100vh;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
```
Cor base final: `#181214` (mais claro que `#0A0000`, ainda escuro premium) com sutil radial glow no topo.

Também aumentar levemente a opacidade do `.sif-card` para destacar:
- `background: rgba(255, 255, 255, 0.04)` → `rgba(255, 255, 255, 0.05)`
- `border: 1px solid rgba(255, 255, 255, 0.10)`

### 2. `src/pages/InteresseSindicoFormulario.tsx` — adicionar logo EXA no topo
Inserir antes do `<header>` (linha 16):
```tsx
<div className="flex justify-center mb-6">
  <img
    src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=..."
    alt="EXA - Publicidade Inteligente"
    className="h-10 sm:h-12 w-auto"
  />
</div>
```
Usar a mesma URL `EXA_LOGO_URL` já presente em `HeaderLogo.tsx` (logo branca EXA isolada). Padding visual top reduzido para `py-6` para acomodar a logo.

### 3. `src/components/interesse-sindico-form/EnderecoAutocomplete.tsx` — corrigir lupa sobreposta
O problema: `pl-10` (40px) é insuficiente em telas com fonte densa, e o ícone fica em `left-3` (12px) com 18px de largura → fim do ícone em ~30px, encostando no texto.

Ajustar:
- Ícone: `left-3` → `left-3.5` (manter) mas tamanho `size={18}` mantido
- Input: `pl-10` → `pl-11` (44px de padding-left, garante respiro)

```tsx
<input ... className="sif-input pl-11" ... />
```

## Garantias

- Não altero lógica do Google Places, store, validação, rotas ou outras páginas.
- Apenas tokens visuais (cor de fundo, opacidade do card) e 2 ajustes pontuais (logo + padding do input).
- Landing `/interessesindico` permanece intacta (uso seletor escopado `.exa-theme.sif-shell`).

## Resultado esperado

- Fundo grafite suave com leve glow no topo (mais leve que o atual, ainda EXA dark).
- Logo EXA branca centralizada acima do título → profissionalismo de marca.
- Lupa com espaçamento correto, sem sobrepor o placeholder.

## Observação sobre Google Places

Você mencionou que o autocomplete "não está funcionando conforme o Google". Pelo código atual, o `EnderecoAutocomplete` já usa `AutocompleteService` + `PlacesService.getDetails` com auto-preenchimento via `onSelect(parsed)` — está correto. Se ao digitar não aparecem sugestões, pode ser:
- API key sem `Places API` habilitada
- Quota/billing do Google Cloud
- Erro silencioso no `loadGoogleMaps`

**Não vou alterar essa lógica agora** (você pediu foco nos 3 itens visuais). Se quiser que eu investigue o autocomplete depois, me avise — posso adicionar logs e checar o status do `loadGoogleMaps()` em outra rodada.

