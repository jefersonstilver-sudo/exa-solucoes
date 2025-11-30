import React from 'react';
import { useNavigate } from 'react-router-dom';
const PlanLoginNotification: React.FC = () => {
  const navigate = useNavigate();
  return <div className="container mx-auto px-4 py-12">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto my-[100px]">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Login necessário</h2>
        <p className="text-yellow-700 mb-4">
          Para prosseguir com sua compra, é necessário fazer login ou criar uma conta.
        </p>
        <div className="flex space-x-4">
          <button onClick={() => navigate('/login?redirect=/selecionar-plano')} className="px-4 py-2 bg-[#3C1361] text-white rounded-md hover:bg-[#3C1361]/90">
            Fazer login
          </button>
          <button onClick={() => navigate('/cadastro?redirect=/selecionar-plano')} className="px-4 py-2 border border-[#3C1361] text-[#3C1361] rounded-md hover:bg-[#3C1361]/10">
            Criar conta
          </button>
        </div>
      </div>
    </div>;
};
export default PlanLoginNotification;