import { useState, useCallback } from 'react';
import { complaintsService } from '../services/complaints.service';
import { IncidentType } from '../types/incident';
import { incidentSchema } from '../utils/validation';
import { z } from 'zod';

export interface UseIncidentFormReturn {
  selectedType: IncidentType;
  setSelectedType: (type: IncidentType) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  submitIncident: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Custom hook for incident form logic.
 * Separates state management and API calls from presentation.
 * Uses Zod v4 for validation.
 */
export function useIncidentForm(initialType: IncidentType): UseIncidentFormReturn {
  const [selectedType, setSelectedType] = useState<IncidentType>(initialType);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitIncident = useCallback(async (formData: FormData) => {
    setErrors({});

    const rawData = {
      email: formData.get('email'),
      lineNumber: formData.get('lineNumber'),
      incidentType: selectedType,
      description: formData.get('description'),
    };

    try {
      const validatedData = incidentSchema.parse(rawData);
      await complaintsService.createComplaint(validatedData);
      return { success: true };

    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        // Zod v4 uses .issues, not .errors
        const issues = (err as any).issues ?? (err as any).errors ?? [];
        issues.forEach((issue: any) => {
          if (issue.path && issue.path.length > 0) {
            fieldErrors[String(issue.path[0])] = issue.message;
          }
        });
        setErrors(fieldErrors);
        return { success: false, error: 'Por favor, corrige los errores en el formulario.' };
      }

      const message = err instanceof Error ? err.message : 'Error desconocido';
      setErrors({ form: message });
      return { success: false, error: message };
    }
  }, [selectedType]);

  return {
    selectedType,
    setSelectedType,
    errors,
    setErrors,
    submitIncident,
  };
}
