export type TicketStatus = 'RECEIVED' | 'IN_PROGRESS' | 'RESOLVED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'PENDING';

export enum IncidentType {
  NO_SERVICE = 'NO_SERVICE',
  INTERMITTENT_SERVICE = 'INTERMITTENT_SERVICE',
  SLOW_CONNECTION = 'SLOW_CONNECTION',
  ROUTER_ISSUE = 'ROUTER_ISSUE',
  BILLING_QUESTION = 'BILLING_QUESTION',
  OTHER = 'OTHER',
}

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
  type: IncidentType;
  description: string | null;
  createdAt: string;
}
