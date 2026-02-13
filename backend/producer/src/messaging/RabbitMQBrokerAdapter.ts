import type { IConnectionManager } from './IConnectionManager.js';
import type { IMessageBroker } from './IMessageBroker.js';
import type { TicketEventPayload } from '../types/ticket.types.js';
import { MessagingError } from '../errors/messaging.error.js';
import { logger } from '../utils/logger.js';

export class RabbitMQBrokerAdapter implements IMessageBroker {
    constructor(
        private readonly connectionManager: IConnectionManager,
        private readonly config: { exchange: string; routingKey: string }
    ) { }

    async publish(payload: TicketEventPayload): Promise<void> {
        const channel = this.connectionManager.getChannel();

        if (!channel) {
            throw new MessagingError(
                'Canal de mensajería no disponible',
                payload.ticketId
            );
        }

        try {
            const message = Buffer.from(JSON.stringify(payload));

            const published = channel.publish(
                this.config.exchange,
                this.config.routingKey,
                message,
                { persistent: true, contentType: 'application/json' }
            );

            if (!published) {
                throw new MessagingError(
                    'Mensaje no confirmado por el broker',
                    payload.ticketId
                );
            }

            logger.info('Ticket event published to RabbitMQ', {
                ticketId: payload.ticketId,
                routingKey: this.config.routingKey,
            });
        } catch (error) {
            if (error instanceof MessagingError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new MessagingError(
                `Error publicando evento: ${errorMessage}`,
                payload.ticketId
            );
        }
    }
}
