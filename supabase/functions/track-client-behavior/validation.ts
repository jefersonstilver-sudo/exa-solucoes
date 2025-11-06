import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Schema para evento de tracking
export const trackingEventSchema = z.object({
  user_id: z.string().uuid('ID de usuário inválido').optional(),
  session_id: z.string().min(1, 'Session ID obrigatório').max(255, 'Session ID muito longo'),
  event_type: z.enum(['page_view', 'building_view', 'video_watch', 'cart_add', 'checkout_start', 'cart_abandon'], {
    errorMap: () => ({ message: 'Tipo de evento inválido' })
  }),
  data: z.object({
    page: z.string().max(255, 'Nome de página muito longo').optional(),
    time_spent: z.number().int().nonnegative('Tempo não pode ser negativo').max(86400, 'Tempo máximo excedido').optional(),
    building_id: z.string().uuid('ID de prédio inválido').optional(),
    video_id: z.string().uuid('ID de vídeo inválido').optional(),
    watch_duration: z.number().int().nonnegative('Duração não pode ser negativa').max(3600, 'Duração máxima excedida').optional(),
    completed: z.boolean().optional(),
    device_type: z.enum(['desktop', 'mobile', 'tablet'], {
      errorMap: () => ({ message: 'Tipo de dispositivo inválido' })
    }).optional(),
  }),
});

export const validateTrackingEvent = (body: any) => {
  return trackingEventSchema.parse(body);
};
