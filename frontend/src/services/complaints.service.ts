import { httpClient } from './http-client';
import type { CreateIncidentRequest } from '../types/incident';

/**
 * Service for managing complaints.
 * Uses the HTTP client for API communication.
 */
export const complaintsService = {
  /**
   * Creates a new complaint (publishes event via Producer).
   * @throws Error if the request fails
   */
  createComplaint: async (data: CreateIncidentRequest): Promise<void> => {
    await httpClient.post<CreateIncidentRequest, void>('/complaints', data);
  },
};

