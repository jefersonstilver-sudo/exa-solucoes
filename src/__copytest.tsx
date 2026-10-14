import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/responsive-optimizations.css';
import './modules/monitoramento-ia/styles/theme.css';
import { PanelCard } from './modules/monitoramento-ia/components/PanelCard';

const device: any = {
  id: 'test-1',
  name: 'Teste Predio - sala',
  comments: 'Teste Predio - sala',
  status: 'online',
  provider: 'LIGGA',
  last_online_at: new Date().toISOString(),
  anydesk_client_id: '999888777',
  building_id: null,
  metadata: {},
};

(window as any).__cardClicked = false;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 40, width: 420 }}>
    <PanelCard device={device} onClick={() => { (window as any).__cardClicked = true; }} />
  </div>
);
