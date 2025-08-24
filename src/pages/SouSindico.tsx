
import React from 'react';
import Layout from '@/components/layout/Layout';
import SindicoPageContainer from '@/components/sou-sindico/SindicoPageContainer';

const SouSindico = () => {
  return (
    <Layout>
      <div className="mobile-scroll-container">
        <SindicoPageContainer />
      </div>
    </Layout>
  );
};

export default SouSindico;
