import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Schema para webhook do MercadoPago
export const mercadopagoWebhookSchema = z.object({
  action: z.string().optional(),
  data: z.object({
    id: z.union([z.string(), z.number()]).transform(val => String(val)),
    status: z.string().optional(),
    external_reference: z.string().optional().nullable(),
    transaction_amount: z.number().positive('Valor deve ser positivo').optional(),
  }).optional(),
  // Permitir campos adicionais no nível raiz para compatibilidade
}).passthrough().transform((payload) => {
  // Se data não existir, usar campos do nível raiz
  if (!payload.data) {
    return {
      action: payload.action,
      data: {
        id: payload.id,
        status: payload.status,
        external_reference: payload.external_reference,
        transaction_amount: payload.transaction_amount,
      }
    };
  }
  return payload;
});

export const validateWebhookPayload = (body: any) => {
  return mercadopagoWebhookSchema.parse(body);
};
