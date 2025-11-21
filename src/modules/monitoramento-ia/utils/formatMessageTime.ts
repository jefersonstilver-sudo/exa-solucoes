import { format } from "date-fns";

/**
 * Formata o tempo de uma mensagem:
 * - Se < 1 minuto: "há menos de 1 minuto"
 * - Se >= 1 minuto: hora exata "HH:mm"
 */
export const formatMessageTime = (date: string | Date | null | undefined): string => {
  if (!date) return "agora";
  
  const messageDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - messageDate.getTime();
  
  // Se menos de 1 minuto
  if (diffMs < 60000) {
    return "há menos de 1 minuto";
  }
  
  // Hora exata
  return format(messageDate, "HH:mm");
};
