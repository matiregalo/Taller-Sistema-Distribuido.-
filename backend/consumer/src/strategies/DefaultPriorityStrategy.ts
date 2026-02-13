import { IncidentType, Priority } from '../types';
import type { IPriorityStrategy } from './IPriorityStrategy';

export class DefaultPriorityStrategy implements IPriorityStrategy {
    // OTHER and any unknown types fall through to here
    readonly supportedTypes = [IncidentType.OTHER];

    calculate(_type: IncidentType): Priority {
        return Priority.PENDING;
    }
}
