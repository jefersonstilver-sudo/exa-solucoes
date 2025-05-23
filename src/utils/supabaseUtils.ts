
/**
 * Utility functions for working with Supabase responses
 */

import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

/**
 * Safe check to determine if a Supabase response contains data
 * @param response The response from a Supabase query
 * @returns True if the response contains data and no error
 */
export const hasData = (response: { data: any, error: any }): boolean => {
  return !!response && !!response.data && !response.error;
};

/**
 * Type-safe way to cast a string to a database ID
 * Works around TypeScript limitations with Supabase's strongly typed queries
 * 
 * @param id The ID string to convert
 * @returns The same ID but properly typed to work with Supabase typed queries
 */
export const toTypedId = <T>(id: string | null | undefined): T => {
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

/**
 * Safely extract data from a Supabase single response
 * Ensures the response has data and isn't an error before accessing properties
 * 
 * @param response The Supabase single response object
 * @returns The data if it exists, null otherwise
 */
export const extractSingleData = <T>(response: PostgrestSingleResponse<T>): T | null => {
  if (response.error || !response.data) {
    return null;
  }
  return response.data;
};

/**
 * Assert that a value is not null or undefined
 * Useful when TypeScript knows a value might be null but you've checked it
 * 
 * @param value The value to check
 * @param message Optional error message
 * @returns The non-null value
 * @throws Error if value is null or undefined
 */
export const assertDefined = <T>(value: T | null | undefined, message = 'Value is null or undefined'): T => {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
};

/**
 * Safe accessor for database record properties
 * Returns undefined if the record or property doesn't exist
 * 
 * @param record The database record
 * @param prop Property name to access
 * @returns The property value or undefined
 */
export const safeGet = <T, K extends keyof T>(record: T | null | undefined, prop: K): T[K] | undefined => {
  if (!record) return undefined;
  return record[prop];
};

/**
 * Type-safe way to prepare data for database inserts
 * 
 * @param data The data object to prepare for insert
 * @returns The same data object with proper typing for database inserts
 */
export const prepareForInsert = <T>(data: any): T => {
  return data as unknown as T;
};

/**
 * Type-safe way to prepare data for database updates
 * 
 * @param data The data object to prepare for update
 * @returns The same data object with proper typing for database updates
 */
export const prepareForUpdate = <T>(data: any): T => {
  return data as unknown as T;
};

/**
 * Type-safe way to check and unwrap data from a Supabase response
 * 
 * @param data The data from a Supabase response
 * @returns The data object or null if it's an error
 */
export const unwrapData = <T>(data: T | any): T | null => {
  // Check if the data is an error object
  if (data && (data.error || typeof data.error === 'object')) {
    return null;
  }
  return data as T;
};

/**
 * Type-safe equality filter for Supabase queries
 * 
 * @param column The column name to filter on
 * @param value The value to filter for
 * @returns The typed value for filter
 */
export const filterEq = <T>(value: string): T => {
  return value as unknown as T;
};

/**
 * Safely handle array results from database functions
 * Ensures the result is an array before attempting to use array methods
 * 
 * @param result Result from a database function
 * @returns The result as an array, or an empty array if the result is not an array
 */
export const ensureArray = <T>(result: any): T[] => {
  if (!result) return [];
  if (Array.isArray(result)) return result as T[];
  return [result] as T[];
};
