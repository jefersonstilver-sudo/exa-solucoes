

# Corrigir Busca de Lead por Nome e Empresa

## Problema
A busca de lead/contato nos modais de criacao e edicao de tarefas nao retorna resultados ao buscar pelo nome da empresa ou pelo nome completo do lead. O campo de busca diz "Buscar por nome, empresa ou telefone..." mas a query no banco nao cobre todos os campos necessarios de forma robusta.

## Causa Raiz
A query atual usa:
```text
.or(`nome.ilike.${termo},empresa.ilike.${termo},telefone.ilike.${termo}`)
```

Problemas identificados:
1. **Falta `sobrenome`** -- se o usuario buscar pelo sobrenome, nao encontra nada
2. **Falta `email`** -- outro campo util para busca que nao esta incluido
3. A sintaxe esta correta para o Supabase JS client, mas a cobertura de campos e insuficiente

## Solucao

Expandir a query `.or()` para incluir **5 campos**: `nome`, `sobrenome`, `empresa`, `telefone` e `email`. Isso garante que o usuario possa encontrar o contato buscando por qualquer informacao conhecida.

## Alteracoes

### 1. `src/components/admin/agenda/CreateTaskModal.tsx` (linha 178)

**De:**
```text
.or(`nome.ilike.${termo},empresa.ilike.${termo},telefone.ilike.${termo}`)
```

**Para:**
```text
.or(`nome.ilike.${termo},sobrenome.ilike.${termo},empresa.ilike.${termo},telefone.ilike.${termo},email.ilike.${termo}`)
```

### 2. `src/components/admin/agenda/EditTaskModal.tsx` (linha 224)

Mesma alteracao -- expandir a query de busca para incluir `sobrenome` e `email`.

**De:**
```text
.or(`nome.ilike.${termo},empresa.ilike.${termo},telefone.ilike.${termo}`)
```

**Para:**
```text
.or(`nome.ilike.${termo},sobrenome.ilike.${termo},empresa.ilike.${termo},telefone.ilike.${termo},email.ilike.${termo}`)
```

### 3. Atualizar placeholder do campo de busca (ambos arquivos)

Atualizar o texto placeholder para refletir as novas opcoes:
```text
"Buscar por nome, empresa, telefone ou email..."
```

## O que NAO muda
- Nenhuma interface, funcionalidade ou workflow existente e alterado
- A logica de selecao, propostas, predios permanece intacta
- Apenas 2 arquivos alterados, somente na linha da query e placeholder

## Resumo
- **2 arquivos** alterados
- **2 linhas de query** expandidas (adicionar `sobrenome` e `email`)
- **2 placeholders** atualizados
- Zero risco de impacto em outras funcionalidades

