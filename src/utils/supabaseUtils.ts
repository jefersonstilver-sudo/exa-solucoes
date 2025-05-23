
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

/**
 * Safe data accessor for Supabase query results
 * Properly handles the response object, checking for errors and null values
 * 
 * @param response Supabase query response
 * @returns The first item in the data array, or null if not found or error
 */
export const getFirstItem = <T>(response: { data: T[] | null, error: any }): T | null => {
  if (response.error || !response.data || response.data.length === 0) {
    return null;
  }
  return response.data[0];
};

/**
 * Safe type assertion for database operations
 * Use this when TypeScript compiler complains about expected types
 * 
 * @param value Value to be type asserted
 * @returns The same value with the specified type
 */
export const dbCast = <T>(value: any): T => {
  return value as T;
};
