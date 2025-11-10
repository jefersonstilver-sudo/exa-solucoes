/**
 * Utilities for generating and parsing building slugs
 * Format: nome-do-predio-codigo
 * Example: edificio-esmeralda-001
 */

/**
 * Generates a URL-friendly slug from building name
 */
export const generateBuildingSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

/**
 * Generates full public URL path for a building
 */
export const generateBuildingPath = (name: string, code: string): string => {
  const slug = generateBuildingSlug(name);
  return `/${slug}/${code}`;
};

/**
 * Generates full commercial display URL
 */
export const generateCommercialPath = (name: string, code: string): string => {
  const slug = generateBuildingSlug(name);
  return `/comercial/${slug}/${code}`;
};

/**
 * Generates full panel display URL (clean, no UI)
 */
export const generatePanelPath = (name: string, code: string): string => {
  const slug = generateBuildingSlug(name);
  return `/painel/${slug}/${code}`;
};

/**
 * Parse building info from URL params
 */
export interface BuildingUrlParams {
  buildingSlug: string;
  buildingCode: string;
}

export const parseBuildingParams = (params: any): BuildingUrlParams => {
  return {
    buildingSlug: params.buildingSlug || '',
    buildingCode: params.buildingCode || '',
  };
};
