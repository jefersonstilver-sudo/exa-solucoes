

# Plano: Alerta WhatsApp Verificado + Seção 2FA Premium

## Problema Identificado

1. **WhatsApp verificado**: O status aparece apenas como texto pequeno verde (`text-xs`) abaixo do input. O usuário quer um **alerta verde proeminente** quando verificado.
2. **Seção 2FA**: A seção de segurança está básica. O usuário quer uma seção premium, moderna, iPhone-friendly.
3. **DB mostra `telefone_verificado: false`**: O `WhatsAppVerificationModal` chama `onSuccess` mas pode não estar atualizando `telefone_verificado` no banco. Preciso verificar a edge function, mas também garantir que o `onSuccess` no `AdvertiserSettings` faça o update direto.

## Mudanças em `src/pages/advertiser/AdvertiserSettings.tsx`

### 1. Alerta verde proeminente para WhatsApp verificado
Substituir o pequeno texto verde (linhas 257-262) por um card/alert verde completo com icone `ShieldCheck`, texto "WhatsApp Verificado" e o numero mascarado. Estilo: `bg-green-50 border border-green-200 rounded-xl p-4`.

Quando **nao** verificado, mostrar alert amarelo com botao para verificar.

### 2. Seção Segurança redesenhada (linhas 340-410)
- Card de 2FA com design premium: icone de escudo, descrição clara, switch grande
- Visual iPhone-first: touch targets 44px, tipografia 15-17px
- Quando 2FA ativo: badge verde "Ativo"
- Quando inativo + phone verificado: switch habilitado com CTA
- Quando phone nao verificado: mensagem + botao para verificar primeiro

### 3. Garantir persistencia do `telefone_verificado`
No callback `onSuccess` do modal (linha 431-434), alem de `setPhoneVerified(true)`, fazer update direto: `supabase.from('users').update({ telefone_verificado: true, telefone_verificado_at: new Date().toISOString() }).eq('id', userId)`

## Arquivo a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/advertiser/AdvertiserSettings.tsx` | Alert verde WhatsApp + 2FA premium + persistencia telefone_verificado |

Nenhuma outra pagina ou componente sera alterado.

