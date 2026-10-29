import { createContext } from 'react';

/**
 * Pedido novo (OrderDetailsV2): o botão de calendário de um vídeo abre a Agenda nova
 * ("Nova programação" com o vídeo já escolhido) em vez da janela antiga "Agendar Vídeo".
 * Fora do pedido novo o contexto é nulo e o botão continua abrindo a janela antiga.
 */
export const AgendarNaAgenda = createContext<((pedidoVideoId: string) => void) | null>(null);
