

# Plano: WhatsApp verificado no cadastro deve refletir no perfil

## Diagnóstico

Quando o WhatsApp é verificado durante o cadastro (`Cadastro.tsx`), o status **não aparece corretamente** no perfil do anunciante porque:

1. **`users.telefone` nunca é preenchido no cadastro** — apenas `telefone_verificado` é atualizado, mas o campo `telefone` fica `null`
2. **Race condition**: O `update` em `users` (linha 242-248) pode falhar silenciosamente se o trigger `handle_new_user` ainda não criou a row na tabela `users`
3. **AdvertiserSettings já lê corretamente** `telefone_verificado` da tabela `users` (linha 107) — o problema está na **escrita** durante o cadastro

## Solução

### 1. Cadastro.tsx — Incluir `telefone` no update e adicionar retry

No bloco de atualização pós-signup (linhas 241-252), incluir o campo `telefone` junto com `telefone_verificado`, e adicionar um retry com delay para aguardar o trigger criar a row:

```ts
// Marcar telefone como verificado (com retry para aguardar trigger)
const fullPhone = `${phoneCode}${phone.replace(/\D/g, '')}`;
const maxRetries = 3;
for (let attempt = 0; attempt < maxRetries; attempt++) {
  const { error: markError } = await supabase
    .from('users')
    .update({ 
      telefone: fullPhone,
      telefone_verificado: true,
      telefone_verificado_at: new Date().toISOString()
    })
    .eq('id', data.user.id);
  
  if (!markError) break;
  if (attempt < maxRetries - 1) {
    await new Promise(r => setTimeout(r, 1000)); // aguarda 1s
  }
}
```

### 2. AdvertiserSettings.tsx — Fallback para phone do users table

Na linha 91, adicionar fallback para `userData?.telefone` caso `user_metadata.phone` esteja vazio:

```ts
phone: authUser.user.user_metadata?.phone || userData?.telefone || '',
```

## Arquivos Alterados (2)

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Cadastro.tsx` | Incluir `telefone` no update + retry com delay |
| `src/pages/advertiser/AdvertiserSettings.tsx` | Fallback phone para `userData?.telefone` |

## Garantias
- Nenhuma UI alterada
- Lógica de verificação (edge function) intacta
- Apenas corrige persistência e leitura de dados

