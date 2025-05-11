
import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  cartItems?: {panel: any, duration: number}[];
  onRemoveFromCart?: (id: string) => void;
  onClearCart?: () => void;
  onChangeDuration?: (id: string, duration: number) => void;
  useGradientBackground?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  cartItems = [], 
  onRemoveFromCart = () => {}, 
  onClearCart = () => {}, 
  onChangeDuration = () => {},
  useGradientBackground = false
}) => {
  return (
    <div className={`min-h-screen flex flex-col ${useGradientBackground ? 'bg-gradient-to-br from-indexa-purple-light via-indexa-purple to-indexa-purple-dark' : 'bg-white'}`}>
      <Header 
        cartItems={cartItems}
        onRemoveFromCart={onRemoveFromCart}
        onClearCart={onClearCart}
        onChangeDuration={onChangeDuration}
      />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
