import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DirectorsList } from './DirectorsList';

export const AlertaCEOCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [ativo, setAtivo] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="border-2 border-[#9C1E1E]/30 hover:border-[#9C1E1E]/50 transition-all cursor-pointer hover:shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9C1E1E] to-[#D72638] flex items-center justify-center shadow-md">
                <span className="text-xl">👔</span>
              </div>
              <div>
                <h3 className="font-bold text-base bg-gradient-to-r from-[#9C1E1E] to-[#D72638] bg-clip-text text-transparent">
                  Alerta CEO
                </h3>
                <p className="text-xs text-muted-foreground">
                  Alertas críticos para diretoria
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="text-xs bg-gradient-to-r from-[#9C1E1E]/10 to-[#D72638]/10 border-[#9C1E1E]/30"
              >
                🎯 Máxima
              </Badge>
              <Switch 
                checked={ativo} 
                onCheckedChange={(checked) => {
                  setAtivo(checked);
                }}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#9C1E1E] data-[state=checked]:to-[#D72638]"
              />
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-4 pt-0">
              {/* Template Preview */}
              <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border-2 border-dashed border-[#9C1E1E]/20">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  📝 Template da Mensagem
                </p>
                <div className="bg-white dark:bg-gray-950 rounded-lg p-3 border border-border">
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    🔴 <span className="font-bold">Alerta de Alta Prioridade</span>
                    {'\n\n'}
                    <span className="text-muted-foreground">Painel:</span> {'{painel_nome}'}
                    {'\n'}
                    <span className="text-muted-foreground">Local:</span> {'{predio}'}
                    {'\n'}
                    <span className="text-muted-foreground">Status:</span> {'{status}'}
                    {'\n'}
                    <span className="text-muted-foreground">Tempo:</span> {'{tempo}'}
                    {'\n\n'}
                    ⚡ <span className="font-semibold">Ação imediata necessária.</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-medium">Variáveis disponíveis:</span> {'{painel_nome}'}, {'{predio}'}, {'{status}'}, {'{tempo}'}
                </p>
              </div>

              {/* Directors Section */}
              <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <span className="font-semibold">Gestão de Diretores</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-4">
                  <DirectorsList />
                </CollapsibleContent>
              </Collapsible>

              {/* Future: Advanced Settings Section */}
              <div className="bg-muted/30 rounded-lg p-4 border border-dashed border-muted-foreground/20">
                <p className="text-sm text-muted-foreground text-center">
                  🚀 Configurações avançadas em breve...
                </p>
              </div>
            </CardContent>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

