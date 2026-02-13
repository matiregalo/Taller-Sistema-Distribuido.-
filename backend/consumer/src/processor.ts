import { IncidentType, Priority, IncidentStatus } from './types';
import { PriorityResolver } from './strategies/PriorityResolver';

// Single PriorityResolver instance (can be injected for tests)
const resolver = new PriorityResolver();

export const determinePriority = (type: IncidentType): Priority => {
  return resolver.resolve(type);
};

export const determineStatus = (priority: Priority): IncidentStatus => {
  return priority === Priority.PENDING
    ? IncidentStatus.RECEIVED
    : IncidentStatus.IN_PROGRESS;
};
