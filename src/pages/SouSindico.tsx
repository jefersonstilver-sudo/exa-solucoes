
import React from 'react';
import Layout from '@/components/layout/Layout';
import OptimizedSindicoPageContainer from '@/components/sou-sindico/OptimizedSindicoPageContainer';

const SouSindico = () => {
  return (
    <Layout>
      <div className="mobile-scroll-container">
        <OptimizedSindicoPageContainer />
      </div>
    </Layout>
  );
};

export default SouSindico;
