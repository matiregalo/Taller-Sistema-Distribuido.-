import { IncidentType, Priority } from '../types';

export interface IPriorityStrategy {
    readonly supportedTypes: IncidentType[];
    calculate(type: IncidentType): Priority;
}
