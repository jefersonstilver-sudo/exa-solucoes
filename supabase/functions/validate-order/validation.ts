import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validação de CPF brasileiro
const cpfRegex = /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

export const validateOrderSchema = z.object({
  order_id: z.string().uuid('ID de pedido inválido'),
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .max(14, 'CPF inválido')
    .refine((val) => cpfRegex.test(val), 'Formato de CPF inválido'),
});

export const validateOrderRequest = (body: any) => {
  return validateOrderSchema.parse(body);
};
