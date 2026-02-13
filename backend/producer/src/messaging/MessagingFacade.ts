import type { Ticket } from '../types/ticket.types.js';
import type { IConnectionManager } from './IConnectionManager.js';
import type { IMessageSerializer } from './IMessageSerializer.js';
import type { IMessagingFacade } from './IMessagingFacade.js';
import { MessagingError } from '../errors/messaging.error.js';
import { logger } from '../utils/logger.js';

export class MessagingFacade implements IMessagingFacade {
    constructor(
        private readonly connectionManager: IConnectionManager,
        private readonly serializer: IMessageSerializer,
        private readonly config: { exchange: string; routingKey: string }
    ) { }

    async publishTicketCreated(ticket: Ticket): Promise<void> {
        const channel = this.connectionManager.getChannel();

        if (!channel) {
            throw new MessagingError(
                'Canal de mensajería no disponible',
                ticket.ticketId
            );
        }

        const message = this.serializer.serializeTicketCreated(ticket);

        const published = channel.publish(
            this.config.exchange,
            this.config.routingKey,
            message,
            { persistent: true, contentType: 'application/json', correlationId: ticket.ticketId }
        );

        if (!published) {
            throw new MessagingError(
                'Mensaje no confirmado por el broker',
                ticket.ticketId
            );
        }

        logger.info('Ticket event published', { ticketId: ticket.ticketId });
    }
}
