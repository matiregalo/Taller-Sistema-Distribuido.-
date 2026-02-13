import { IncidentType, Priority } from '../types';
import type { IPriorityStrategy } from './IPriorityStrategy';

export class DegradedServiceStrategy implements IPriorityStrategy {
    readonly supportedTypes = [
        IncidentType.INTERMITTENT_SERVICE,
        IncidentType.SLOW_CONNECTION,
    ];

    calculate(_type: IncidentType): Priority {
        return Priority.MEDIUM;
    }
}
