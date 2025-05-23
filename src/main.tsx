
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
import Pedidos from './pages/Pedidos'

// Admin Pages
import Dashboard from './pages/admin/Dashboard'
import OrdersPage from './pages/admin/OrdersPage'
import OrderDetails from './pages/admin/OrderDetails'
import BuildingsPage from './pages/admin/BuildingsPage'
import PanelsPage from './pages/admin/PanelsPage'
import UserManagement from './pages/admin/UserManagement'
import AdminInitializerPage from './components/admin/setup/AdminInitializerPage'
import ConfiguracoesPage from './pages/admin/ConfiguracoesPage'

// Advertiser Pages
import AdvertiserDashboard from './pages/advertiser/AdvertiserDashboard'
import MyCampaigns from './pages/advertiser/MyCampaigns'
import CampaignDetails from './pages/advertiser/CampaignDetails'
import MyVideos from './pages/advertiser/MyVideos'

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
    path: '/pedidos',
    element: <Pedidos />
  },
  {
    path: '/meus-pedidos',
    element: <Pedidos />
  },
  // Admin routes
  {
    path: '/admin',
    element: <Dashboard />
  },
  {
    path: '/admin/pedidos',
    element: <OrdersPage />
  },
  {
    path: '/admin/pedidos/detalhes/:id',
    element: <OrderDetails />
  },
  {
    path: '/admin/predios',
    element: <BuildingsPage />
  },
  {
    path: '/admin/paineis',
    element: <PanelsPage />
  },
  {
    path: '/admin/usuarios',
    element: <UserManagement />
  },
  {
    path: '/admin/setup',
    element: <AdminInitializerPage />
  },
  {
    path: '/admin/configuracoes',
    element: <ConfiguracoesPage />
  },
  // Advertiser routes
  {
    path: '/anunciante',
    element: <AdvertiserDashboard />
  },
  {
    path: '/anunciante/campanhas',
    element: <MyCampaigns />
  },
  {
    path: '/anunciante/campanhas/:id',
    element: <CampaignDetails />
  },
  {
    path: '/anunciante/videos',
    element: <MyVideos />
  }
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
        {/* 
          Usando apenas o SonnerToaster como provider de toast principal
          para evitar duplicação de notificações
        */}
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
