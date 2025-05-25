
import React from 'react';
import BasicInfoForm from './BasicInfoForm';
import ContactInfoForm from './ContactInfoForm';
import CommercialDataForm from './CommercialDataForm';
import CharacteristicsSelector from './CharacteristicsSelector';
import ImageGallery from './ImageGallery';
import PanelManagementSection from './PanelManagementSection';

interface BuildingFormLayoutProps {
  formData: any;
  building?: any;
  panels?: any[];
  onFormUpdate: (updates: any) => void;
  onCharacteristicToggle: (caracteristica: string) => void;
  onSuccess: () => void;
  onPanelsChange?: (panels: any[]) => void;
}

const BuildingFormLayout: React.FC<BuildingFormLayoutProps> = ({
  formData,
  building,
  panels = [],
  onFormUpdate,
  onCharacteristicToggle,
  onSuccess,
  onPanelsChange
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Primeira coluna - Informações básicas, contato e dados comerciais */}
      <div className="space-y-4">
        <BasicInfoForm
          formData={{
            nome: formData.nome,
            endereco: formData.endereco,
            bairro: formData.bairro,
            venue_type: formData.venue_type,
            padrao_publico: formData.padrao_publico,
            latitude: formData.latitude,
            longitude: formData.longitude
          }}
          onUpdate={onFormUpdate}
        />

        <ContactInfoForm
          formData={{
            nome_sindico: formData.nome_sindico,
            contato_sindico: formData.contato_sindico,
            nome_vice_sindico: formData.nome_vice_sindico,
            contato_vice_sindico: formData.contato_vice_sindico,
            nome_contato_predio: formData.nome_contato_predio,
            numero_contato_predio: formData.numero_contato_predio
          }}
          onUpdate={onFormUpdate}
        />

        <CommercialDataForm
          formData={{
            numero_unidades: formData.numero_unidades,
            preco_base: formData.preco_base,
            status: formData.status,
            monthly_traffic: formData.monthly_traffic
          }}
          onUpdate={onFormUpdate}
        />
      </div>

      {/* Segunda coluna - Características, galeria de fotos e gestão de painéis */}
      <div className="space-y-4">
        <CharacteristicsSelector
          selectedCharacteristics={formData.caracteristicas}
          onToggle={onCharacteristicToggle}
        />

        <ImageGallery
          building={building}
          onSuccess={onSuccess}
        />

        {/* Só mostrar PanelManagementSection se temos buildingId (editando) */}
        {building?.id && (
          <PanelManagementSection
            panels={panels}
            buildingId={building.id}
            buildingName={formData.nome || building?.nome}
            onPanelsChange={onPanelsChange || (() => {})}
          />
        )}
      </div>
    </div>
  );
};

export default BuildingFormLayout;
