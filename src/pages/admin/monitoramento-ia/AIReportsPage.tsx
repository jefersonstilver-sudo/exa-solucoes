import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { GenerateReportNow } from '@/modules/monitoramento-ia/components/reports/GenerateReportNow';
import { AIReportsConfig } from '@/modules/monitoramento-ia/components/reports/AIReportsConfig';
import { motion } from 'framer-motion';

const AIReportsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Mobile & Desktop Unified Header - FIXO */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#9C1E1E] to-[#D72638] backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center gap-3 lg:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-white/10 rounded-full text-white h-9 w-9 lg:h-10 lg:w-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg lg:text-2xl font-bold text-white">Relatórios IA</h1>
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-300 animate-pulse" />
              </div>
              <p className="text-xs lg:text-sm text-white/90 mt-0.5">
                Análises avançadas com inteligência artificial
              </p>
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
