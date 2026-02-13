import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { TicketEventPayload } from '../types/ticket.types.js';
import { RabbitMQConnectionManager } from './RabbitMQConnectionManager.js';

export const connectRabbitMQ = async (): Promise<void> => {
  await RabbitMQConnectionManager.getInstance().connect();
};

export const publishTicketEvent = async (payload: TicketEventPayload): Promise<boolean> => {
  const channel = RabbitMQConnectionManager.getInstance().getChannel();

  if (!channel) {
    logger.error('Cannot publish: RabbitMQ channel not available');
    return false;
  }

  try {
    const message = Buffer.from(JSON.stringify(payload));

    const published = channel.publish(
      config.rabbitmq.exchange,
      config.rabbitmq.routingKey,
      message,
      {
        persistent: true,
        contentType: 'application/json',
      }
    );

    if (published) {
      logger.info('Ticket event published to RabbitMQ', {
        ticketId: payload.ticketId,
        routingKey: config.rabbitmq.routingKey,
      });
    } else {
      logger.warn('Message was not confirmed by RabbitMQ', {
        ticketId: payload.ticketId,
      });
    }

    return published;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to publish ticket event', {
      ticketId: payload.ticketId,
      error: errorMessage,
    });
    return false;
  }
};

export const closeRabbitMQ = async (): Promise<void> => {
  await RabbitMQConnectionManager.getInstance().close();
};
