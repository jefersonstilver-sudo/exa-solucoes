export const MonitoramentoIADashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#0A0A0A] mb-2">
          IA & Monitoramento EXA
        </h1>
        <p className="text-gray-600">
          Módulo administrativo criado. Conteúdo funcional será implementado em etapas seguintes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#FFD000]">
          <h3 className="font-semibold text-[#0A0A0A] mb-2">Status do Sistema</h3>
          <p className="text-sm text-gray-600">Operacional</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#FFD000]">
          <h3 className="font-semibold text-[#0A0A0A] mb-2">Painéis Ativos</h3>
          <p className="text-sm text-gray-600">0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#FFD000]">
          <h3 className="font-semibold text-[#0A0A0A] mb-2">Alertas Pendentes</h3>
          <p className="text-sm text-gray-600">0</p>
        </div>
      </div>
    </div>
  );
};
