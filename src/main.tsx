
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from './App'

// Providers
import { ThemeProvider } from './components/ui/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'

// Create a client
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <App />
        <Toaster />
        <SonnerToaster 
          position="top-center" 
          expand={true} 
          richColors 
          closeButton
          toastOptions={{
            duration: 3000,
            className: "toast-class"
          }} 
        />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
