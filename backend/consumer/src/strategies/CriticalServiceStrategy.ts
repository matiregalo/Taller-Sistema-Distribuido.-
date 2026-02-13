import { IncidentType, Priority } from '../types';
import type { IPriorityStrategy } from './IPriorityStrategy';

export class CriticalServiceStrategy implements IPriorityStrategy {
    readonly supportedTypes = [IncidentType.NO_SERVICE];

    calculate(_type: IncidentType): Priority {
        return Priority.HIGH;
    }
}
