import { RabbitMQConnectionManager } from './messaging/RabbitMQConnectionManager';
import { MessageHandler } from './messaging/MessageHandler';
import { InMemoryIncidentRepository } from './repositories/InMemoryIncidentRepository';
import { logger } from './utils/logger';

const connectionManager = RabbitMQConnectionManager.getInstance();
const incidentRepository = new InMemoryIncidentRepository();

const startConsumer = async () => {
  try {
    await connectionManager.connect();

    const channel = connectionManager.getChannel();
    if (!channel) {
      throw new Error('Channel not available after connect');
    }

    const handler = new MessageHandler(channel, incidentRepository);

    channel.consume('complaints.queue', (msg) => handler.handle(msg));

    logger.info('Consumer started and listening for messages');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error starting consumer', { error: errorMessage });
    setTimeout(startConsumer, 5000);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM. Shutting down...');
  await connectionManager.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Shutting down...');
  await connectionManager.close();
  process.exit(0);
});

startConsumer();
