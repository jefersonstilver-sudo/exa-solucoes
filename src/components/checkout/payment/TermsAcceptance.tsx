
import { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TermsAcceptanceProps {
  acceptTerms: boolean;
  setAcceptTerms: (value: boolean) => void;
}

const TermsAcceptance = ({ acceptTerms, setAcceptTerms }: TermsAcceptanceProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Checkbox 
          id="terms" 
          checked={acceptTerms} 
          onCheckedChange={(checked) => setAcceptTerms(!!checked)} 
          className="mt-1"
        />
        <div>
          <Label 
            htmlFor="terms" 
            className="font-medium cursor-pointer"
          >
            Aceito os termos e condições
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Ao confirmar este pedido, concordo com os <a href="#" className="text-indexa-purple hover:underline">Termos de Uso</a> e <a href="#" className="text-indexa-purple hover:underline">Política de Privacidade</a> da Indexa. 
            Estou ciente de que meu pagamento será processado pelo Mercado Pago e que não será possível cancelar campanhas ativas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptance;
