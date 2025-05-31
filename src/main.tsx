
// 🔧 MODIFICAÇÃO DE PERFORMANCE/SEGURANÇA
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from './components/ui/theme-provider'
import { Toaster } from '@/components/ui/toaster'

// Importar sistema de segurança
import './utils/securityUtils'

// Create a client otimizado
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('does not exist')) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
})

// Performance monitoring (apenas desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🚀 App: Inicializando em modo desenvolvimento');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <App />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
