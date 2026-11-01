import './compat';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './tela.css';

createRoot(document.getElementById('tela')!).render(<App />);
// avisa a página (intro) e o app Android que o player montou
(window as any).__telaMontada = true;
