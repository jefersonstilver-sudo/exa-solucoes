
import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-indexa-gradient flex-grow">
        <Header />
        <main className="container mx-auto px-6 py-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
