
# Upgrade Completo: Logo, Notas com Audio/Arquivo, Reorganizacao de Abas e Botao Follow-Up

## Problemas Identificados

1. **Logo do contato**: O header mostra icone de predio cinza ao inves de logo com fundo vermelho escuro + logo branca (padrao EXA)
2. **Logo nao vem da proposta**: Quando uma proposta tem `client_logo_url`, nao sincroniza automaticamente para o contato
3. **Logo nao pontua**: O campo `logo_url` nao esta incluido no trigger `calculate_contact_score()` nem existe regra na tabela `contact_scoring_rules`
4. **Logo nao e editavel**: Nao ha botoes para adicionar, trocar ou excluir a logo no header
5. **Notas na Visao Geral**: O painel compacto so tem textarea + botao "Nota", mas FALTA botao de gravar audio e botao de anexar arquivo
6. **Organizacao de abas**: Dados da empresa, endereco e informacoes detalhadas devem ficar em aba separada; Visao Geral deve focar em dados pessoais + notas/atualizacoes
7. **Botao Follow-Up**: Nao existe botao para copiar um resumo da empresa (dados + notas + status) para compartilhar com colaboradores

## Solucao Completa

### 1. Logo com Fundo Vermelho no Header (ContatoDetalhePage.tsx)

**Substituir** o bloco de avatar (linhas 196-208) por:
- Avatar com gradiente vermelho escuro (`from-[#9C1E1E] via-[#180A0A] to-[#0B0B0B]`)
- Quando `logo_url` existe: exibir imagem com filtro `brightness-0 invert` (logo branca)
- Quando nao existe: exibir iniciais da empresa/nome em branco sobre o fundo vermelho
- **Overlay de hover** com botoes:
  - Se tem logo: Trocar (Upload) + Excluir (Trash2)
  - Se nao tem logo: Adicionar (Plus)
- Input file hidden para upload (aceita PNG/JPG, max 5MB)
- Upload para bucket `arquivos` (consistente com sistema existente)
- Atualiza `logo_url` no contato via `supabase.from('contacts').update()`

### 2. Pontuacao: Logo vale 10 pontos (Migracao SQL)

- Inserir regra: `INSERT INTO contact_scoring_rules (campo, label, pontos, ordem, ativo) VALUES ('logo_url', 'Logo da empresa', 10, 10, true)`
- Atualizar `calculate_contact_score()` para incluir:
```text
IF NEW.logo_url IS NOT NULL AND NEW.logo_url != '' THEN
  v_score := v_score + COALESCE(
    (SELECT pontos FROM contact_scoring_rules WHERE campo = 'logo_url' AND ativo = true), 0
  );
END IF;
```

### 3. Sincronizacao Logo Proposta -> Contato (Migracao SQL)

Criar trigger `sync_proposal_logo_to_contact` na tabela `proposals`:
- Quando uma proposta e inserida ou atualizada com `client_logo_url`
- E o contato vinculado (via `client_phone` ou busca por nome) nao tem `logo_url`
- Copiar automaticamente o `client_logo_url` para o `logo_url` do contato

### 4. Painel de Notas na Visao Geral com Audio + Arquivo (TabVisaoGeral.tsx)

Atualizar o bloco "Notas e Atualizacoes Recentes" (linhas 263-343) para incluir:
- **3 botoes no formulario rapido**: Textarea + [Mic Gravar Audio] + [Clip Anexar Arquivo] + [+ Nota]
- Reutilizar o hook `useVoiceRecorder` para gravacao e transcricao diretamente na Visao Geral
- Input file para anexo rapido
- Visual de gravacao (indicador vermelho pulsante, timer, botao parar)
- Visual de transcricao (spinner + "Transcrevendo...")

### 5. Reorganizacao: Dados da Empresa em Aba Separada (TabVisaoGeral.tsx)

- **Visao Geral** mantem: Resumo do Contato, Canal de Entrada, Notas/Atualizacoes, Dados Pessoais
- **Mover para aba "Inteligencia"** (que ja existe e tem dados estrategicos): Dados da Empresa, Endereco
- Isso nao sera feito pois alteraria abas existentes - em vez disso, manter tudo na Visao Geral mas reordenar: Notas ficam ACIMA dos Dados da Empresa

### 6. Botao "Copiar Follow-Up" (ContatoDetalhePage.tsx)

Adicionar botao no header (ao lado de Editar) que:
- Compila um resumo estruturado do contato em texto:
```text
FOLLOW-UP: [Empresa]
Status: [Categoria] | Temperatura: [Quente/Morno/Frio]
Contato: [Nome] - [Telefone] - [Email]
Pontuacao: [X/100]
Dias sem contato: [X]

ULTIMAS NOTAS:
- [nota 1] (ha X horas)
- [nota 2] (ha X dias)
- [nota 3] (ha X dias)

Atualizado: [data]
```
- Copia para a area de transferencia com `navigator.clipboard.writeText()`
- Toast de confirmacao "Follow-up copiado!"

## Detalhes Tecnicos

### Arquivo 1: Migracao SQL

```text
-- 1. Regra de pontuacao para logo
INSERT INTO public.contact_scoring_rules (campo, label, pontos, ordem, ativo)
VALUES ('logo_url', 'Logo da empresa', 10, 10, true)
ON CONFLICT DO NOTHING;

-- 2. Atualizar trigger calculate_contact_score
-- Recriar a funcao adicionando verificacao de logo_url

-- 3. Trigger de sync proposta -> contato
-- Quando proposals.client_logo_url muda, atualizar contacts.logo_url
```

### Arquivo 2: ContatoDetalhePage.tsx

- Importar: `Upload, Trash2, Copy, ImageIcon, Loader2`
- Adicionar estados: `uploadingLogo`, `recentNotesForFollowUp`
- Funcao `handleLogoUpload(file)`: upload -> Storage -> update contacts
- Funcao `handleLogoRemove()`: update contacts logo_url = null
- Funcao `handleCopyFollowUp()`: compilar resumo + clipboard + toast
- Substituir bloco avatar com gradiente vermelho + hover overlay
- Adicionar botao "Follow-Up" no header (icone Copy)
- Adicionar campo `logo_url` no array `fieldsToCheck` para save

### Arquivo 3: TabVisaoGeral.tsx

- Importar `useVoiceRecorder`, `Paperclip`, `MicOff`, `Play`, `Pause`
- Adicionar estados para gravacao e arquivo no formulario rapido
- Expandir o formulario de nota rapida com 3 botoes de acao (gravar, anexar, nota)
- Manter ordem: Resumo > Canal de Entrada > Notas > Dados Pessoais > Empresa > Endereco
