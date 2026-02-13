import { useState, useCallback } from 'react';
import { complaintsService } from '../services/complaints.service';
import type { CreateIncidentRequest, IncidentType } from '../types/incident';

export interface UseIncidentFormReturn {
  selectedType: IncidentType;
  setSelectedType: (type: IncidentType) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isModalOpen: boolean;
  closeModal: () => void;
  submitIncident: (data: CreateIncidentRequest) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Custom hook for incident form logic.
 * Separates state management and API calls from presentation.
 */
export function useIncidentForm(initialType: IncidentType): UseIncidentFormReturn {
  const [selectedType, setSelectedType] = useState<IncidentType>(initialType);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setError(null);
  }, []);

  const submitIncident = useCallback(async (data: CreateIncidentRequest) => {
    setError(null);

    // Client-side validation for 'OTHER' type
    if (data.incidentType === 'OTHER' && (!data.description || data.description.trim() === '')) {
      const message = 'La descripción es obligatoria cuando seleccionas "Otro"';
      setError(message);
      return { success: false, error: message };
    }

    try {
      await complaintsService.createComplaint(data);
      setIsModalOpen(true);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  return {
    selectedType,
    setSelectedType,
    error,
    setError,
    isModalOpen,
    closeModal,
    submitIncident,
  };
}
