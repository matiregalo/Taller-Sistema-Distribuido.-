// Ticket Status
export type TicketStatus = 'RECEIVED' | 'IN_PROGRESS' | 'RESOLVED';

// Ticket Priority
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'PENDING';

// Incident Types
export type IncidentType = 
  | 'NO_SERVICE'
  | 'SLOW_CONNECTION'
  | 'INTERMITTENT_SERVICE'
  | 'OTHER';

// Ticket Entity
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

// Request DTO for creating a ticket
export interface CreateTicketRequest {
  lineNumber: string;
  email: string;
  incidentType: IncidentType;
  description?: string;
}

// Payload for RabbitMQ message
export interface TicketEventPayload {
  ticketId: string;
  lineNumber: string;
  incidentType: IncidentType;
  description: string | null;
  createdAt: string; // ISO string format
}
