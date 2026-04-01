

# Plano: Auto-sincronizar Título com Contagem Real de Prédios

## Diagnóstico

Não há duplicação nem divergência de dados. O banco tem 11 prédios ativos, a proposta salvou 11, e a proposta pública exibe 11. O único erro é o título "Horizontal 15 predios - 6 Meses" que foi digitado manualmente sem validação.

A loja pública e o seletor da proposta usam a mesma tabela `buildings` — são consistentes.

## Correção

### Arquivo: `src/pages/admin/proposals/NovaPropostaPage.tsx`

1. **Auto-gerar título baseado nos prédios reais**: Adicionar `useEffect` que atualiza `tituloProposta` automaticamente quando `selectedBuildingsData.length` ou `durationMonths` mudam:
   - Formato: `"{Horizontal|Vertical Premium} {N} prédios - {M} Meses"`
   - Só auto-atualiza se o título atual seguir o padrão automático (via regex) ou estiver vazio
   - Se o vendedor editou o título manualmente para algo fora do padrão, não sobrescreve

2. **No momento do upsert**, forçar `predios_contratados` a ser `selectedBuildingsData.length` (já é assim, confirmado)

3. **Validação visual**: Exibir badge ao lado do campo título mostrando `"{N} prédios selecionados"` para que o vendedor veja a contagem real antes de publicar

## Impacto
- Apenas o campo título em `NovaPropostaPage.tsx`
- Nenhuma alteração na UI pública, base de dados ou fluxos existentes

