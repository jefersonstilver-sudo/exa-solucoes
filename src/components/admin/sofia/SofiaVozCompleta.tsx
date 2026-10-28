import React from 'react';
import { SofiaProvider } from '@/contexts/SofiaContext';
import { SofiaVoiceButton } from './SofiaVoiceButton';

/** Carregado sob demanda pelo SofiaLauncher: contexto de voz + botão completo, já iniciando a chamada. */
const SofiaVozCompleta: React.FC = () => (
  <SofiaProvider>
    <SofiaVoiceButton autoIniciar />
  </SofiaProvider>
);

export default SofiaVozCompleta;
