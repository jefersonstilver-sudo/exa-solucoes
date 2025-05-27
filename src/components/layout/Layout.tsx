
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import UserDropdown from './UserDropdown';
import { Home, Building2, Search, ShoppingCart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isLoggedIn } = useUserSession();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#3C1361] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">I</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Indexa</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-[#3C1361] bg-purple-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Início</span>
              </Link>

              <Link
                to="/predios-loja"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/predios-loja') 
                    ? 'text-[#3C1361] bg-purple-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Prédios</span>
              </Link>

              <Link
                to="/planos"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/planos') 
                    ? 'text-[#3C1361] bg-purple-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Search className="h-4 w-4" />
                <span>Planos</span>
              </Link>
            </nav>

            {/* User actions */}
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <UserDropdown />
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild>
                    <Link to="/login">Entrar</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/login">Cadastrar</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#3C1361] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">I</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Indexa</span>
              </div>
              <p className="text-gray-600 text-sm">
                Plataforma de publicidade em painéis digitais para maximizar o alcance da sua marca.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Produtos</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/predios-loja" className="hover:text-gray-900">Prédios</Link></li>
                <li><Link to="/planos" className="hover:text-gray-900">Planos</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/ajuda" className="hover:text-gray-900">Central de Ajuda</Link></li>
                <li><Link to="/contato" className="hover:text-gray-900">Contato</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/privacidade" className="hover:text-gray-900">Privacidade</Link></li>
                <li><Link to="/termos" className="hover:text-gray-900">Termos de Uso</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 Indexa. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
