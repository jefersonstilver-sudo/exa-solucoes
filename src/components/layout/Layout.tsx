
import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-indexa-gradient">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
