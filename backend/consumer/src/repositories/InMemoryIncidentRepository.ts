import { Incident } from '../types';
import type { IIncidentRepository } from './IIncidentRepository';
import { logger } from '../utils/logger';

export class InMemoryIncidentRepository implements IIncidentRepository {
    private readonly incidents: Map<string, Incident> = new Map();

    save(incident: Incident): Incident {
        this.incidents.set(incident.ticketId, incident);
        logger.debug('Incident persisted', { ticketId: incident.ticketId });
        return incident;
    }

    findById(ticketId: string): Incident | undefined {
        return this.incidents.get(ticketId);
    }
}
