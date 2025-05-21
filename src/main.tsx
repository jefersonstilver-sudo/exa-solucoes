
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Pages
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Forbidden from './pages/Forbidden'
import Cadastro from './pages/Cadastro'
import Checkout from './pages/Checkout'
import PanelStore from './pages/PanelStore'
import PlanSelection from './pages/PlanSelection'
import OrderConfirmation from './pages/OrderConfirmation'
import Confirmacao from './pages/Confirmacao'
import PixPayment from './pages/PixPayment'
import MeusPedidos from './pages/MeusPedidos'
import Pedidos2 from './pages/Pedidos2'

// Providers
import { ThemeProvider } from './components/ui/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'

// Create a client
const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
    errorElement: <NotFound />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/cadastro',
    element: <Cadastro />
  },
  {
    path: '/confirmacao',
    element: <Confirmacao />
  },
  {
    path: '/forbidden',
    element: <Forbidden />
  },
  {
    path: '/paineis-digitais/loja',
    element: <PanelStore />
  },
  {
    path: '/selecionar-plano',
    element: <PlanSelection />
  },
  {
    path: '/checkout',
    element: <Checkout />
  },
  {
    path: '/pedido-confirmado',
    element: <OrderConfirmation />
  },
  {
    path: '/pix-payment',
    element: <PixPayment />
  },
  {
    path: '/meus-pedidos',
    element: <MeusPedidos />
  },
  {
    path: '/pedidos2',
    element: <Pedidos2 />
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
        <Toaster />
        <SonnerToaster position="top-center" expand={true} richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
