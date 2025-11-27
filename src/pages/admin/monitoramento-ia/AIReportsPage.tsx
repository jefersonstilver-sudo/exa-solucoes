import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { GenerateReportNow } from '@/modules/monitoramento-ia/components/reports/GenerateReportNow';
import { AIReportsConfig } from '@/modules/monitoramento-ia/components/reports/AIReportsConfig';
import { motion } from 'framer-motion';

const AIReportsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-gradient-to-r from-[#9C1E1E]/95 to-[#D72638]/95 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-white/10 rounded-full text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">Relatórios IA</h1>
            <p className="text-xs text-white/80">Análises avançadas com IA</p>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-gradient-to-r from-[#9C1E1E] to-[#D72638] border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-white/10 rounded-full text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Relatórios IA</h1>
              <p className="text-sm text-white/90">Configure e gere relatórios com análise de IA avançada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Generate Report Now Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GenerateReportNow />
        </motion.div>

        {/* Daily Reports Configuration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <AIReportsConfig />
        </motion.div>
      </div>
    </div>
  );
};

export default AIReportsPage;
