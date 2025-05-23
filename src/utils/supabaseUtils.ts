
/**
 * Utility functions for working with Supabase responses
 */

/**
 * Safe check to determine if a Supabase response contains data
 * @param response The response from a Supabase query
 * @returns True if the response contains data and no error
 */
export const hasData = (response: { data: any, error: any }): boolean => {
  return !!response && !!response.data && !response.error;
};

/**
 * Type-safe way to convert a string to a typed ID for database operations
 * Works around TypeScript limitations with Supabase's strongly typed queries
 * 
 * @param id The ID string to convert
 * @returns The same ID but type-cast to work with Supabase typed queries
 */
export const toTypedId = <T>(id: string): T => {
  return id as unknown as T;
};
