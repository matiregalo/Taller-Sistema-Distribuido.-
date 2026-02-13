import { Channel, ConsumeMessage } from 'amqplib';
import { IncidentType, Incident } from '../types';
import { determinePriority, determineStatus } from '../processor';
import { logger } from '../utils/logger';
import type { IIncidentRepository } from '../repositories/IIncidentRepository';

export class MessageHandler {
    constructor(
        private readonly channel: Channel,
        private readonly repository: IIncidentRepository
    ) { }

    async handle(msg: ConsumeMessage | null): Promise<void> {
        if (msg === null) {
            return;
        }

        const correlationId = msg.properties.correlationId ?? 'unknown';

        try {
            const content = JSON.parse(msg.content.toString());
            logger.info('Message received', { ticketId: content.ticketId, correlationId });

            if (!content.type) {
                logger.warn('Invalid message structure: missing incident type', {
                    ticketId: content.ticketId,
                    correlationId,
                });
                // Send to DLQ — unparseable/invalid structure
                this.channel.nack(msg, false, false);
                return;
            }

            const incidentType = content.type as IncidentType;

            if (incidentType === IncidentType.OTHER && !content.description) {
                logger.warn('Invalid message: description required for OTHER type', {
                    ticketId: content.ticketId,
                    correlationId,
                });
                this.channel.nack(msg, false, false);
                return;
            }

            const priority = determinePriority(incidentType);
            const status = determineStatus(priority);

            const processedIncident: Incident = {
                ticketId: content.ticketId,
                lineNumber: content.lineNumber,
                type: incidentType,
                description: content.description,
                priority,
                status,
                createdAt: content.createdAt,
                processedAt: new Date(),
            };

            // Persist in Consumer repository (§2.2 decision)
            this.repository.save(processedIncident);

            logger.info('Incident processed and persisted', {
                ticketId: processedIncident.ticketId,
                priority: processedIncident.priority,
                status: processedIncident.status,
                correlationId,
            });

            this.channel.ack(msg);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error processing message', { error: errorMessage, correlationId });
            // Unparseable JSON → DLQ
            this.channel.nack(msg, false, false);
        }
    }
}
