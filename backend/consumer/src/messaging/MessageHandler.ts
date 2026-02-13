import { Channel, ConsumeMessage } from 'amqplib';
import { IncidentType, Incident } from '../types';
import { isIncidentType } from '../utils/typeGuards';
import { determinePriority, determineStatus } from '../processor';
import { logger as defaultLogger } from '../utils/logger';
import type { ILogger } from '../utils/ILogger';
import type { IIncidentRepository } from '../repositories/IIncidentRepository';

export class MessageHandler {
    constructor(
        private readonly channel: Channel,
        private readonly repository: IIncidentRepository,
        private readonly logger: ILogger = defaultLogger
    ) { }

    async handle(msg: ConsumeMessage | null): Promise<void> {
        if (msg === null) {
            return;
        }

        const correlationId = msg.properties.correlationId ?? 'unknown';

        try {
            const content = JSON.parse(msg.content.toString());
            this.logger.info('Message received', { ticketId: content.ticketId, correlationId });

            if (!content.type || !isIncidentType(content.type)) {
                this.logger.warn('Invalid message structure: missing or invalid incident type', {
                    ticketId: content.ticketId,
                    correlationId,
                });
                // Send to DLQ — unparseable/invalid structure
                this.channel.nack(msg, false, false);
                return;
            }

            const incidentType: IncidentType = content.type;

            if (incidentType === IncidentType.OTHER && !content.description) {
                this.logger.warn('Invalid message: description required for OTHER type', {
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

            this.logger.info('Incident processed and persisted', {
                ticketId: processedIncident.ticketId,
                priority: processedIncident.priority,
                status: processedIncident.status,
                correlationId,
            });

            this.channel.ack(msg);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Error processing message', { error: errorMessage, correlationId });
            // Unparseable JSON → DLQ
            this.channel.nack(msg, false, false);
        }
    }
}
