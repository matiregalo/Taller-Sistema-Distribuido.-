export type TicketStatus = 'RECEIVED' | 'IN_PROGRESS' | 'RESOLVED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'PENDING';

export type IncidentType = 
  | 'NO_SERVICE'
  | 'SLOW_CONNECTION'
  | 'INTERMITTENT_SERVICE'
  | 'OTHER';

export interface Ticket {
  ticketId: string;
  lineNumber: string;
  email: string;
  incidentType: IncidentType;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
}

export interface CreateTicketRequest {
  lineNumber: string;
  email: string;
  incidentType: IncidentType;
  description?: string;
}

export interface TicketEventPayload {
  ticketId: string;
  lineNumber: string;
  incidentType: IncidentType;
  description: string | null;
  createdAt: string;
}
