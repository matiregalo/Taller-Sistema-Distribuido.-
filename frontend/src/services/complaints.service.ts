import { httpClient } from './http-client';
import type { CreateIncidentRequest } from '../types/incident';

/**
 * Ticket response from the API.
 */
export interface TicketResponse {
  ticketId: string;
  lineNumber: string;
  email: string;
  incidentType: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
}

/**
 * Service for managing complaints.
 * Uses the HTTP client for API communication.
 */
export const complaintsService = {
  /**
   * Creates a new complaint (publishes event via Producer).
   * @throws Error if the request fails
   */
  createComplaint: async (data: CreateIncidentRequest): Promise<TicketResponse> => {
    return httpClient.post<CreateIncidentRequest, TicketResponse>('/complaints', data);
  },
};
