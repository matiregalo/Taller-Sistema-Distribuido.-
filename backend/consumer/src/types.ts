export enum IncidentType {
  NO_SERVICE = 'NO_SERVICE',
  INTERMITTENT_SERVICE = 'INTERMITTENT_SERVICE',
  SLOW_CONNECTION = 'SLOW_CONNECTION',
  ROUTER_ISSUE = 'ROUTER_ISSUE',
  BILLING_QUESTION = 'BILLING_QUESTION',
  OTHER = 'OTHER'
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  PENDING = 'PENDING'
}

export enum IncidentStatus {
  RECEIVED = 'RECEIVED',
  IN_PROGRESS = 'IN_PROGRESS'
}

export interface Incident {
  id: string;
  type: IncidentType;
  description?: string;
  priority?: Priority;
  status?: IncidentStatus;
  customerId: string;
  createdAt: Date;
}
