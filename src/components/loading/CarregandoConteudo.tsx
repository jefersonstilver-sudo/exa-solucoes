import React from 'react';
import { BlocoCarregando } from './MarcaCarregando';

/**
 * Carregamento DENTRO do painel (menu e cabeçalho continuam na tela), com a marca EXA animada
 * na versão clara. Só aparece depois de 200 ms, para trocas rápidas de página não "piscarem".
 */
const GENERICAS = /^\s*carregando\s*(\.\.\.|…)?\s*$/i;

const CarregandoConteudo: React.FC<{ message?: string }> = ({ message }) => (
  <BlocoCarregando mensagem={message && !GENERICAS.test(message) ? message : undefined} />
);

export default CarregandoConteudo;
