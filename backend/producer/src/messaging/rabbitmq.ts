import amqp, { ChannelModel, Channel } from 'amqplib';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { TicketEventPayload } from '../types/ticket.types.js';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    logger.info('Connecting to RabbitMQ...', { url: config.rabbitmq.url });

    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    await channel.assertExchange(config.rabbitmq.exchange, 'topic', {
      durable: true,
    });

    logger.info('Connected to RabbitMQ successfully', {
      exchange: config.rabbitmq.exchange,
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error', { error: err.message });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to connect to RabbitMQ', { error: errorMessage });
    throw error;
  }
};

export const publishTicketEvent = async (payload: TicketEventPayload): Promise<boolean> => {
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
  try {
    if (channel) {
      await channel.close();
      logger.debug('RabbitMQ channel closed');
    }
    if (connection) {
      await connection.close();
      logger.info('RabbitMQ connection closed gracefully');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error closing RabbitMQ connection', { error: errorMessage });
  }
};
