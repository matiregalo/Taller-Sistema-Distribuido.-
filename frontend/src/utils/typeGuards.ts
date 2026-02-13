import { IncidentType } from '../types/incident';

const VALID_INCIDENT_TYPES = new Set<string>(Object.values(IncidentType));

/**
 * Runtime type guard for IncidentType (LSP §3.5).
 */
export const isIncidentType = (value: unknown): value is IncidentType =>
  typeof value === 'string' && VALID_INCIDENT_TYPES.has(value);

/**
 * Safely extract a string from FormData, returning empty string if null.
 */
export const getFormString = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
};
