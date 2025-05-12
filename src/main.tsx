
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Make sure the DOM is fully loaded before mounting React
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    const rootEl = document.getElementById("root");
    if (rootEl) {
      createRoot(rootEl).render(<App />);
    }
  });
}
