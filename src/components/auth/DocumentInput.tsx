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
import DocumentUpload from '@/components/ui/document-upload';
import { FileText, Upload, Globe } from 'lucide-react';

interface DocumentInputProps {
  documentType: 'cpf' | 'documento_estrangeiro';
  document: string;
  country?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  onDocumentTypeChange: (type: 'cpf' | 'documento_estrangeiro') => void;
  onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCountryChange?: (country: string) => void;
  onDocumentFrontChange?: (url: string | null) => void;
  onDocumentBackChange?: (url: string | null) => void;
}

const DocumentInput: React.FC<DocumentInputProps> = ({
  documentType,
  document,
  country,
  documentFrontUrl,
  documentBackUrl,
  onDocumentTypeChange,
  onDocumentChange,
  onCountryChange,
  onDocumentFrontChange,
  onDocumentBackChange
}) => {
  const isDocumentoEstrangeiro = documentType === 'documento_estrangeiro';

  return (
    <div className="space-y-4">
      {/* Tipo de Documento */}
      <div className="space-y-2">
        <Label htmlFor="documentType" className="flex items-center text-gray-900">
          <FileText className="h-4 w-4 mr-2 text-indexa-purple" /> 
          Tipo de documento <span className="text-red-500 ml-1">*</span>
        </Label>
        <Select value={documentType} onValueChange={onDocumentTypeChange}>
          <SelectTrigger className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900">
            <SelectValue placeholder="Selecione o tipo de documento" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200">
            <SelectItem value="cpf" className="text-gray-900">CPF - Brasileiro</SelectItem>
            <SelectItem value="documento_estrangeiro" className="text-gray-900">Documento Estrangeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Seleção de País para Documento Estrangeiro */}
      {isDocumentoEstrangeiro && (
        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center text-gray-900">
            <Globe className="h-4 w-4 mr-2 text-indexa-purple" /> 
            País <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select value={country || ''} onValueChange={onCountryChange}>
            <SelectTrigger className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900">
              <SelectValue placeholder="Selecione o país" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200">
              <SelectItem value="paraguay" className="text-gray-900">Paraguai</SelectItem>
              <SelectItem value="argentina" className="text-gray-900">Argentina</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Campo de Número do Documento */}
      <div className="space-y-2">
        <Label htmlFor="document" className="flex items-center text-gray-900">
          <FileText className="h-4 w-4 mr-2 text-indexa-purple" /> 
          {documentType === 'cpf' ? 'CPF' : 'Número do Documento'}
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="document"
          type="text"
          placeholder={documentType === 'cpf' ? "000.000.000-00" : "Digite o número do documento"}
          value={document}
          onChange={onDocumentChange}
          required
          className="border-indexa-purple/20 focus:border-indexa-purple h-11 text-gray-900 placeholder-gray-500"
          maxLength={documentType === 'cpf' ? 14 : 30}
        />
        {documentType === 'cpf' && (
          <p className="text-xs text-gray-600">
            Digite apenas números. O sistema validará automaticamente.
          </p>
        )}
      </div>

      {/* Upload de Documentos para Estrangeiros */}
      {isDocumentoEstrangeiro && (
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-blue-800 mb-2">
            <Upload className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Upload dos Documentos</span>
          </div>
          
          <div className="space-y-3">
            <DocumentUpload
              label="Frente do Documento *"
              value={documentFrontUrl || ''}
              onChange={onDocumentFrontChange || (() => {})}
              bucketName="document-uploads"
              folder="front"
              accept="image/*,.pdf"
            />
            
            <DocumentUpload
              label="Verso do Documento *"
              value={documentBackUrl || ''}
              onChange={onDocumentBackChange || (() => {})}
              bucketName="document-uploads"
              folder="back"
              accept="image/*,.pdf"
            />
          </div>
          
          <p className="text-xs text-blue-700">
            📋 Para documentos estrangeiros é obrigatório enviar foto da frente e verso do documento.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentInput;