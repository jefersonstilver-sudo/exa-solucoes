import { differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

/**
 * Calcula o tempo sem resposta de uma conversa
 * @param lastMessageAt - Data da última mensagem
 * @returns Objeto com o tempo formatado e se está crítico (> 5 min)
 */
export const getUnrespondedTime = (lastMessageAt: string) => {
  const now = new Date();
  const lastMessage = new Date(lastMessageAt);
  
  const minutesDiff = differenceInMinutes(now, lastMessage);
  const hoursDiff = differenceInHours(now, lastMessage);
  const daysDiff = differenceInDays(now, lastMessage);
  
  let formattedTime = '';
  let isCritical = minutesDiff > 5;
  
  if (daysDiff > 0) {
    formattedTime = `${daysDiff}d`;
  } else if (hoursDiff > 0) {
    formattedTime = `${hoursDiff}h`;
  } else if (minutesDiff > 0) {
    formattedTime = `${minutesDiff}m`;
  } else {
    formattedTime = 'agora';
    isCritical = false;
  }
  
  return {
    formattedTime,
    isCritical,
    minutes: minutesDiff
  };
};
