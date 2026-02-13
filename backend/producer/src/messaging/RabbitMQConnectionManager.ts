import amqp, { ChannelModel, Channel } from 'amqplib';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { IConnectionManager } from './IConnectionManager.js';

class RabbitMQConnectionManager implements IConnectionManager {
    private static instance: RabbitMQConnectionManager | null = null;
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;

    // Private constructor prevents external instantiation
    private constructor() { }

    public static getInstance(): RabbitMQConnectionManager {
        if (!RabbitMQConnectionManager.instance) {
            RabbitMQConnectionManager.instance = new RabbitMQConnectionManager();
        }
        return RabbitMQConnectionManager.instance;
    }

    // For testing: allows resetting the instance
    public static resetInstance(): void {
        RabbitMQConnectionManager.instance = null;
    }

    async connect(): Promise<void> {
        if (this.connection) {
            return; // Already connected
        }

        try {
            logger.info('Connecting to RabbitMQ...', { url: config.rabbitmq.url });

            this.connection = await amqp.connect(config.rabbitmq.url);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(config.rabbitmq.exchange, 'topic', {
                durable: true,
            });

            logger.info('Connected to RabbitMQ successfully', {
                exchange: config.rabbitmq.exchange,
            });

            this.setupEventHandlers();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to connect to RabbitMQ', { error: errorMessage });
            throw error;
        }
    }

    async close(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
                logger.debug('RabbitMQ channel closed');
            }
            if (this.connection) {
                await this.connection.close();
                logger.info('RabbitMQ connection closed gracefully');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error closing RabbitMQ connection', { error: errorMessage });
        } finally {
            this.channel = null;
            this.connection = null;
        }
    }

    getChannel(): Channel | null {
        return this.channel;
    }

    isConnected(): boolean {
        return this.connection !== null && this.channel !== null;
    }

    private setupEventHandlers(): void {
        this.connection?.on('close', () => {
            logger.warn('RabbitMQ connection closed');
            this.connection = null;
            this.channel = null;
        });

        this.connection?.on('error', (err) => {
            logger.error('RabbitMQ connection error', { error: err.message });
        });
    }
}

export { RabbitMQConnectionManager };
