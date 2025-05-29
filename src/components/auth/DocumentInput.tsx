
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from 'lucide-react';

interface DocumentInputProps {
  documentType: 'cpf' | 'cnpj';
  document: string;
  onDocumentTypeChange: (type: 'cpf' | 'cnpj') => void;
  onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DocumentInput: React.FC<DocumentInputProps> = ({
  documentType,
  document,
  onDocumentTypeChange,
  onDocumentChange
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="documentType" className="flex items-center text-gray-700">
          <FileText className="h-4 w-4 mr-2 text-indexa-purple" /> Tipo de documento
        </Label>
        <Select value={documentType} onValueChange={onDocumentTypeChange}>
          <SelectTrigger className="border-indexa-purple/20 focus:border-indexa-purple h-11">
            <SelectValue placeholder="Selecione o tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cpf">CPF</SelectItem>
            <SelectItem value="cnpj">CNPJ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="document" className="flex items-center text-gray-700">
          <FileText className="h-4 w-4 mr-2 text-indexa-purple" /> {documentType.toUpperCase()}
        </Label>
        <Input
          id="document"
          type="text"
          placeholder={documentType === 'cpf' ? "000.000.000-00" : "00.000.000/0000-00"}
          value={document}
          onChange={onDocumentChange}
          required
          className="border-indexa-purple/20 focus:border-indexa-purple h-11"
          maxLength={documentType === 'cpf' ? 14 : 18}
        />
      </div>
    </>
  );
};

export default DocumentInput;
