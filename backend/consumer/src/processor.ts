import { IncidentType, Priority, IncidentStatus } from './types';

export const determinePriority = (type: IncidentType): Priority => {
  switch (type) {
    case IncidentType.NO_SERVICE:
      return Priority.HIGH;
    case IncidentType.INTERMITTENT_SERVICE:
    case IncidentType.SLOW_CONNECTION:
      return Priority.MEDIUM;
    case IncidentType.ROUTER_ISSUE:
    case IncidentType.BILLING_QUESTION:
      return Priority.LOW;
    case IncidentType.OTHER:
    default:
      return Priority.PENDING;
  }
};

export const determineStatus = (priority: Priority): IncidentStatus => {
  if (priority === Priority.PENDING) {
    return IncidentStatus.RECEIVED;
  }
  return IncidentStatus.IN_PROGRESS;
};
