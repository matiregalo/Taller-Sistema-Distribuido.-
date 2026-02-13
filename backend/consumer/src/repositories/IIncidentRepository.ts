import { Incident } from '../types';

export interface IIncidentRepository {
    save(incident: Incident): Incident;
    findById(ticketId: string): Incident | undefined;
}
