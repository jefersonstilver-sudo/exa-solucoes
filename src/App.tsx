
import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Layout from './components/layout/Layout';
import SuperAdminPage from './pages/SuperAdminPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from 'react-error-boundary';

// Adicionar import da página Marketing
const Marketing = lazy(() => import('./pages/Marketing'));
const Index = lazy(() => import('./pages/Index'));
const Produtora = lazy(() => import('./pages/Produtora'));
const BuildingStore = lazy(() => import('./pages/BuildingStore'));
const PaineisPublicitarios = lazy(() => import('./pages/PaineisPublicitarios'));
const SouSindico = lazy(() => import('./pages/SouSindico'));
const PanelStore = lazy(() => import('./pages/PanelStore'));
const PainelStore = lazy(() => import('./pages/PainelStore'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

const LayoutWrapper = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                {/* Rotas com Layout */}
                <Route path="/" element={<LayoutWrapper />}>
                  <Route index element={<Index />} />
                  <Route path="marketing" element={<Marketing />} />
                  <Route path="produtora" element={<Produtora />} />
                  <Route path="loja" element={<BuildingStore />} />
                  <Route path="paineis-publicitarios" element={<PaineisPublicitarios />} />
                  <Route path="sou-sindico" element={<SouSindico />} />
                  <Route path="panel-store" element={<PanelStore />} />
                  <Route path="painel-store" element={<PainelStore />} />
                </Route>

                {/* Rotas sem Layout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/super_admin/*" element={<SuperAdminPage />} />
                <Route path="/admin/*" element={<AdminPage />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
