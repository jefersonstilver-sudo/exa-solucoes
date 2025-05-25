
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartManager } from '@/hooks/useCartManager';
import UserAccessButton from '@/components/auth/UserAccessButton';
import { cn } from '@/lib/utils';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCartManager();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const totalCartItems = cartItems.length;

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/paineis-digitais/loja", label: "Loja Online" },
    { to: "/planos", label: "Planos" },
    { to: "/sobre", label: "Sobre" },
    { to: "/contato", label: "Contato" }
  ];

  const handleCartClick = () => {
    navigate('/paineis-digitais/loja');
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    open: {
      opacity: 1,
      x: "0%",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const overlayVariants = {
    closed: {
      opacity: 0,
      transition: {
        duration: 0.3
      }
    },
    open: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <>
      <header className="bg-gradient-to-r from-indexa-purple to-indexa-purple/95 text-white shadow-xl relative z-40">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo - Mobile optimized sizing */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center">
                <img 
                  src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
                  alt="Indexa Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-base md:text-2xl font-bold tracking-tight">
                INDEXA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "text-sm font-medium transition-all duration-200 relative group px-2 py-1",
                    location.pathname === item.to
                      ? "text-indexa-mint"
                      : "text-white/90 hover:text-white"
                  )}
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indexa-mint transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>

            {/* Right Side - Cart + User + Mobile Menu */}
            <div className="flex items-center space-x-1 md:space-x-3">
              {/* Cart Button - Mobile optimized */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/20 rounded-full h-10 w-10 md:h-12 md:w-12 transition-all duration-200"
                onClick={handleCartClick}
                aria-label={`Carrinho com ${totalCartItems} itens`}
              >
                <ShoppingCart className="h-4 w-4 md:h-6 md:w-6" />
                {totalCartItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-indexa-mint text-indexa-purple text-xs font-bold rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center min-w-[20px] md:min-w-[24px]"
                  >
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </motion.span>
                )}
              </Button>

              {/* User Access Button */}
              <UserAccessButton />

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-white/20 rounded-full h-10 w-10"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menu de navegação"
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay and Panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Mobile Menu Panel */}
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-indexa-purple to-indexa-purple-dark shadow-2xl z-50 lg:hidden"
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img 
                      src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
                      alt="Indexa Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-lg font-bold text-white">Menu</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex flex-col p-4 space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: index * 0.1 }
                    }}
                  >
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center py-3 px-4 rounded-xl text-base font-medium transition-all duration-200",
                        location.pathname === item.to
                          ? "bg-white/20 text-indexa-mint border-l-4 border-indexa-mint"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                      {item.to === "/paineis-digitais/loja" && (
                        <span className="ml-auto bg-indexa-mint text-indexa-purple text-xs px-2 py-1 rounded-full font-bold">
                          Loja
                        </span>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Mobile Menu Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-white/60 text-sm mb-2">
                    Transformando ideias em resultados
                  </p>
                  <div className="flex justify-center space-x-4">
                    <div className="w-2 h-2 bg-indexa-mint rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-indexa-mint rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-indexa-mint rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
