import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Thermometer, HardDrive, MemoryStick, ShieldCheck, Wifi, Video, Clock, CircleCheck, CircleAlert, CircleX } from "lucide-react";

/**
 * AuditoriaCard — exibe os dados coletados pela auditoria da frota (super código v6/v6.1),
 * gravados em devices.metadata.auditoria. Todos os campos são opcionais (painéis auditados
 * em versões diferentes do código trazem conjuntos diferentes de dados).
 */

interface AuditoriaCardProps {
  metadata?: Record<string, any> | null;
}

// pega o primeiro valor definido entre várias chaves possíveis (nomes variaram entre v6 e v6.1)
const pick = (o: any, ...keys: string[]) => {
  for (const k of keys) {
    if (o && o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  }
  return undefined;
};

// transforma "57C", "57", 57 -> 57 (number) para comparar faixas de temperatura
const tempNum = (v: any): number | null => {
  if (v === undefined || v === null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
};

// transforma "25%", "25", 25 -> 25 (number) para avaliar perda de pacote
const lossNum = (v: any): number | null => {
  if (v === undefined || v === null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
};

const Stat = ({ icon: Icon, label, value, valueClass = "" }: { icon: any; label: string; value?: any; valueClass?: string }) => (
  <div>
    <p className="text-xs text-module-secondary mb-1 flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </p>
    <p className={`text-sm font-semibold text-module-primary ${valueClass}`}>{value ?? "—"}</p>
  </div>
);

export const AuditoriaCard = ({ metadata }: AuditoriaCardProps) => {
  const a = metadata?.auditoria;
  if (!a) return null;

  // hardware / família
  const vendor = pick(a, "vendor");
  const product = pick(a, "product");
  const cpu = pick(a, "cpu");
  const cores = pick(a, "cores");
  const ram = pick(a, "ram");
  const disk = pick(a, "disk");
  const uptime = pick(a, "uptime");
  const familia = vendor === "JOOG" ? "JOOG Solvix 2"
    : (vendor && String(vendor).includes("AZW")) || product === "MINI S" ? "Beelink MINI S"
    : (vendor && String(vendor).includes("Intel")) ? "Intel NUC"
    : [vendor, product].filter(Boolean).join(" ") || "—";

  // temperatura com faixa de cor
  const temp = tempNum(pick(a, "temp"));
  const tempLabel = pick(a, "temp");
  const tempClass = temp === null ? "" : temp >= 73 ? "text-red-600" : temp >= 60 ? "text-amber-600" : "text-green-600";

  // blindagem
  const shutdownBlocked = pick(a, "poweroff_target") === "masked";
  const antiPopup = pick(a, "packagekit") === "masked" || pick(a, "guardiao_aviso") === "1" || pick(a, "guardiao_aviso") === 1;

  // rede / link
  const pGw = lossNum(pick(a, "perda_gw", "perda_gateway"));
  const pCam = lossNum(pick(a, "perda_cam", "perda_cam_srv"));
  const pNet = lossNum(pick(a, "perda_net", "perda_internet"));
  const jitter = pick(a, "jitter_cam");
  const vereditoLink = pick(a, "veredito_link");

  const lossClass = (v: number | null) => v === null ? "text-module-primary" : v >= 5 ? "text-red-600" : "text-green-600";
  const fmtLoss = (v: any) => (v === undefined ? "—" : String(v));

  // câmera
  const cam = pick(a, "veredito_camera") || "";
  const camOff = /off|comprometid|instavel|instável|morto|decoder|ruim/i.test(String(cam));
  const camOk = /\bok\b|funcionando|provavel ok|provável ok/i.test(String(cam)) && !camOff;
  const CamIcon = camOff ? CircleX : camOk ? CircleCheck : CircleAlert;
  const camIconClass = camOff ? "text-red-600" : camOk ? "text-green-600" : "text-amber-600";

  const data = pick(a, "data_auditoria");
  const versao = pick(a, "versao_codigo");

  return (
    <Card className="mb-6 bg-module-card border-module shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-module-primary">
          <Cpu className="h-4 w-4 text-module-accent" />
          Auditoria de Hardware &amp; Rede
          {data && (
            <Badge variant="outline" className="ml-auto text-[10px] text-module-secondary border-module bg-module-secondary">
              {data}{versao ? ` · ${versao}` : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hardware */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={Cpu} label="Família / Hardware" value={familia} />
          <Stat icon={Cpu} label="CPU" value={cpu ? `${cpu}${cores ? ` (${cores}c)` : ""}` : undefined} />
          <Stat icon={MemoryStick} label="Memória" value={ram} />
          <Stat icon={HardDrive} label="Disco" value={disk} />
          <Stat icon={Thermometer} label="Temperatura" value={tempLabel} valueClass={tempClass} />
          <Stat icon={Clock} label="Uptime" value={uptime} />
        </div>

        {/* Blindagem */}
        <div>
          <p className="text-xs text-module-secondary mb-2 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Blindagem
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className={shutdownBlocked ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-600 border-gray-300"}>
              {shutdownBlocked ? "✔ Desligamento 01h bloqueado" : "Desligamento 01h não confirmado"}
            </Badge>
            <Badge className={antiPopup ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-600 border-gray-300"}>
              {antiPopup ? "✔ Anti-aviso de atualização" : "Anti-aviso pendente"}
            </Badge>
          </div>
        </div>

        {/* Rede / Link */}
        {(pGw !== null || pCam !== null || pNet !== null || vereditoLink) && (
          <div>
            <p className="text-xs text-module-secondary mb-2 flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Link / Rede
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-module-secondary mb-1">Perda p/ gateway</p>
                <p className={`text-sm font-semibold ${lossClass(pGw)}`}>{fmtLoss(pick(a, "perda_gw", "perda_gateway"))}</p>
              </div>
              <div>
                <p className="text-xs text-module-secondary mb-1">Perda p/ câmera</p>
                <p className={`text-sm font-semibold ${lossClass(pCam)}`}>{fmtLoss(pick(a, "perda_cam", "perda_cam_srv"))}</p>
              </div>
              <div>
                <p className="text-xs text-module-secondary mb-1">Perda p/ internet</p>
                <p className={`text-sm font-semibold ${lossClass(pNet)}`}>{fmtLoss(pick(a, "perda_net", "perda_internet"))}</p>
              </div>
              <div>
                <p className="text-xs text-module-secondary mb-1">Jitter (câmera)</p>
                <p className="text-sm font-semibold text-module-primary">{jitter ?? "—"}</p>
              </div>
            </div>
            {vereditoLink && (
              <p className={`text-xs mt-2 ${/ruim|instavel|instável/i.test(String(vereditoLink)) ? "text-red-600" : "text-module-secondary"}`}>
                <strong>Veredito do link:</strong> {vereditoLink}
              </p>
            )}
          </div>
        )}

        {/* Câmera */}
        {cam && (
          <div>
            <p className="text-xs text-module-secondary mb-1 flex items-center gap-1">
              <Video className="h-3 w-3" />
              Câmera
            </p>
            <div className="flex items-start gap-2">
              <CamIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${camIconClass}`} />
              <p className="text-sm text-module-primary">{cam}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
