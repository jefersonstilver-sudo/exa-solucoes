

# Reposicionar Logo Ticker na Proposta Publica

## O que sera feito

1. **Remover** o bloco atual do ticker (linhas 2715-2721) que esta no final da pagina com o container vermelho grande, titulo "Empresas que confiam na EXA" e padding excessivo.

2. **Inserir** o `LogoTicker` logo apos o `</header>` (linha 1858), antes do conteudo principal da proposta, e **acima** do card "Valida ate". Ele ficara posicionado:
   - Abaixo dos badges de status e data
   - Acima do "Valida ate"
   - Com fundo vermelho escuro (`bg-[#9C1E1E]`) consistente com o cabecalho

3. **Estilo**: Sem titulo, sem container arredondado, sem padding grande. Apenas uma barra fina e elegante de logos em branco sobre vermelho escuro, como uma extensao natural do cabecalho.

## Detalhe tecnico

### Arquivo: `src/pages/public/PropostaPublicaPage.tsx`

**Remover** (linhas 2715-2721):
```tsx
{/* Empresas que confiam na EXA - Logo Ticker */}
<div className="w-full py-10 bg-[#9C1E1E] rounded-xl mt-8 overflow-hidden">
  <h3 ...>Empresas que confiam na EXA</h3>
  <LogoTicker speed={50} />
</div>
```

**Inserir** logo apos o `</header>` (linha 1858), antes do `<div className="max-w-4xl ...">`:
```tsx
{/* Logo Ticker - Prova Social */}
<div className="w-full bg-[#9C1E1E] overflow-hidden">
  <LogoTicker speed={50} />
</div>
```

Resultado: barra fina de logos em branco sobre vermelho escuro, diretamente abaixo do cabecalho, sem titulo, sem bordas arredondadas, sem caixa grande. Visual limpo e profissional.

## Arquivos modificados

1. `src/pages/public/PropostaPublicaPage.tsx` -- mover ticker e simplificar layout

