import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectionTimeline } from "./ConnectionTimeline";
import { Monitor, Info, Clock, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ComputerDetailModalProps {
  computer: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ComputerDetailModal = ({ 
  computer, 
  isOpen, 
  onClose 
}: ComputerDetailModalProps) => {
  if (!computer) return null;

  const isOnline = computer.status === "online";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#0A0A0A] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <Monitor className="h-6 w-6 text-[#9C1E1E]" />
            {computer.custom_name || computer.hostname}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="info" className="data-[state=active]:bg-[#9C1E1E]">
              <Info className="h-4 w-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-[#9C1E1E]">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#9C1E1E]">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg backdrop-blur-xl">
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <Badge
                  className={cn(
                    "flex items-center gap-1 w-fit",
                    isOnline 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                      : "bg-[#9C1E1E]/20 text-red-400 border-[#9C1E1E]/30"
                  )}
                >
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>

              <div className="bg-white/5 p-4 rounded-lg backdrop-blur-xl">
                <p className="text-sm text-gray-400 mb-1">AnyDesk ID</p>
                <p className="text-lg font-mono text-white">{computer.anydesk_id}</p>
              </div>

              {computer.os && (
                <div className="bg-white/5 p-4 rounded-lg backdrop-blur-xl">
                  <p className="text-sm text-gray-400 mb-1">Sistema Operacional</p>
                  <p className="text-lg text-white">{computer.os}</p>
                </div>
              )}

              {computer.ip_public && (
                <div className="bg-white/5 p-4 rounded-lg backdrop-blur-xl">
                  <p className="text-sm text-gray-400 mb-1">IP Público</p>
                  <p className="text-lg text-white">{computer.ip_public}</p>
                </div>
              )}

              {computer.version && (
                <div className="bg-white/5 p-4 rounded-lg backdrop-blur-xl">
                  <p className="text-sm text-gray-400 mb-1">Versão</p>
                  <p className="text-lg text-white">{computer.version}</p>
                </div>
              )}

              {computer.platform && (
                <div className="bg-white/5 p-4 rounded-lg backdrop-blur-xl">
                  <p className="text-sm text-gray-400 mb-1">Plataforma</p>
                  <p className="text-lg text-white">{computer.platform}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <ConnectionTimeline computerId={computer.id} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="bg-white/5 p-6 rounded-lg backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Configurações de Alertas</h3>
              <p className="text-gray-400">Configurações de alertas e notificações</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};