import { IncidentType, Priority } from '../types';
import type { IPriorityStrategy } from './IPriorityStrategy';

export class MinorIssuesStrategy implements IPriorityStrategy {
    readonly supportedTypes = [
        IncidentType.ROUTER_ISSUE,
        IncidentType.BILLING_QUESTION,
    ];

    calculate(_type: IncidentType): Priority {
        return Priority.LOW;
    }
}
