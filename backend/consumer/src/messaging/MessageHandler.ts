import { Channel, ConsumeMessage } from 'amqplib';
import { IncidentType, Incident } from '../types';
import { determinePriority, determineStatus } from '../processor';
import { logger } from '../utils/logger';

export class MessageHandler {
    constructor(private readonly channel: Channel) { }

    async handle(msg: ConsumeMessage | null): Promise<void> {
        if (msg === null) {
            return;
        }

        try {
            const content = JSON.parse(msg.content.toString());
            logger.info('Message received', { ticketId: content.ticketId });

            if (!content.type) {
                logger.warn('Invalid message structure: missing incident type', {
                    ticketId: content.ticketId,
                });
                this.channel.ack(msg);
                return;
            }

            const incidentType = content.type as IncidentType;

            if (incidentType === IncidentType.OTHER && !content.description) {
                logger.warn('Invalid message: description required for OTHER type', {
                    ticketId: content.ticketId,
                });
                this.channel.ack(msg);
                return;
            }

            const priority = determinePriority(incidentType);
            const status = determineStatus(priority);

            const processedIncident: Incident = {
                ...content,
                priority,
                status,
                processedAt: new Date(),
            };

            logger.info('Incident processed', {
                ticketId: processedIncident.ticketId,
                priority: processedIncident.priority,
                status: processedIncident.status,
            });

            this.channel.ack(msg);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error processing message', { error: errorMessage });
            this.channel.ack(msg);
        }
    }
}
