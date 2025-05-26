
/**
 * Formats a number as currency in BRL
 * @param value Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formats a large number into a readable format (K, M)
 * @param num Number to format
 * @returns Formatted string
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
};

/**
 * Formats building address for display
 * @param endereco Full address
 * @param bairro Neighborhood
 * @returns Formatted address
 */
export const formatBuildingAddress = (endereco: string, bairro: string): string => {
  // Se o endereço já inclui o bairro, retornar apenas o endereço
  if (endereco.toLowerCase().includes(bairro.toLowerCase())) {
    return endereco;
  }
  
  // Caso contrário, combinar endereço + bairro
  return `${endereco}, ${bairro}`;
};

/**
 * Formats distance in meters to readable format
 * @param distanceInMeters Distance in meters
 * @returns Formatted distance string
 */
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters >= 1000) {
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distanceInMeters)} m`;
};

/**
 * Gets appropriate color class for building standard
 * @param padrao Building standard
 * @returns Tailwind color classes
 */
export const getBuildingStandardColor = (padrao: string): string => {
  const colors = {
    alto: 'bg-purple-100 text-purple-800 border-purple-300',
    medio: 'bg-blue-100 text-blue-800 border-blue-300',
    normal: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return colors[padrao as keyof typeof colors] || colors.normal;
};
