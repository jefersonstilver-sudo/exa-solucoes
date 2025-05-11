
import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  cartItems?: {panel: any, duration: number}[];
  onRemoveFromCart?: (id: string) => void;
  onClearCart?: () => void;
  onChangeDuration?: (id: string, duration: number) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  cartItems = [], 
  onRemoveFromCart = () => {}, 
  onClearCart = () => {}, 
  onChangeDuration = () => {} 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
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
