
import React from 'react';
import Layout from '@/components/layout/Layout';
import BuildingStoreLayout from '@/components/building-store/BuildingStoreLayout';

const BuildingStore = () => {
  console.log('BuildingStore: Página da loja carregada');

  return (
    <Layout>
      <div className="mobile-scroll-container">
        <BuildingStoreLayout />
      </div>
    </Layout>
  );
};

export default BuildingStore;
