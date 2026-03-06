

# Plano: Redesign Verificação WhatsApp + Reset ao Mudar Número

## Problemas Identificados

1. **Visual azul genérico** — bg-blue-50, border-blue-200, text-blue-900 — não segue a paleta EXA corporativa
2. **Emoji 📱 e ⏱️** — violam o design system minimalista Apple/EXA (proibido emojis em UI)
3. **Quando o número muda**, o componente mantém o estado interno (timer, código, sessionId) do número antigo — não reseta

## Solução

### 1. Reset ao mudar número (PhoneVerificationInline.tsx)

Adicionar `useEffect` que observa `phone` e reseta todo o estado:

```ts
useEffect(() => {
  setVerificationStarted(false);
  setPhoneVerified(false);
  setCode('');
  setSessionId('');
  setTimer(300);
  setCanResend(false);
}, [phone]);
```

Isso garante que ao editar o número, o componente volta ao estado inicial (botão "Verificar WhatsApp") forçando reenvio do código para o número correto.

### 2. Redesign visual corporativo (PhoneVerificationInline.tsx)

Substituir toda a paleta azul e emojis por design EXA:

| Elemento | De | Para |
|----------|-----|------|
| Container código | `bg-blue-50 border-blue-200` | `bg-stone-50 border-stone-200` |
| Título | `text-blue-900` + emoji 📱 | `text-stone-900`, sem emoji |
| Subtítulo | `text-blue-700` | `text-stone-600` |
| Timer | `text-blue-600` + ⏱️ | `text-stone-500`, sem emoji |
| Timer crítico | `text-red-600` | `text-[#C7141A]` |
| Botão enviar | `bg-green-600` | `bg-[#9C1E1E] hover:bg-[#B40D1A]` |
| Badge verificado | `bg-green-50 border-green-200` | `bg-emerald-50/50 border-emerald-200/60` (manter verde sutil para status "OK") |
| Link reenviar | `text-blue-600` | `text-[#9C1E1E]` |
| Texto auxiliar | `text-gray-500` | `text-stone-400` |

Remover todos os emojis (📱, ⏱️). Usar ícones Lucide quando necessário (ex: `Clock` para timer).

### 3. WhatsAppCodeInput — slots na cor EXA

No `WhatsAppCodeInput.tsx`, os slots de OTP usam `focus:border-[#9C1E1E]` — já está na paleta correta. Manter.

## Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/auth/PhoneVerificationInline.tsx` | Reset ao mudar phone + redesign visual EXA minimalista |

## Garantias
- Nenhum outro componente ou funcionalidade alterado
- Lógica de envio/verificação de código intacta
- Apenas visual e comportamento de reset do phone

