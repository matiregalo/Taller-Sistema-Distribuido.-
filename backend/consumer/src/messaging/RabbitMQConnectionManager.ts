import * as amqp from 'amqplib';
import { ChannelModel, Channel } from 'amqplib';
import type { IConnectionManager } from './IConnectionManager';
import { logger } from '../utils/logger';

const RABBITMQ_URL = process.env.RABBITMQ_URL;
if (!RABBITMQ_URL) {
    logger.error('RABBITMQ_URL environment variable is required');
    process.exit(1);
}

const EXCHANGE_NAME = 'complaints.exchange';
const QUEUE_NAME = 'complaints.queue';
const DLX_EXCHANGE = 'complaints.dlx';
const DLQ_NAME = 'complaints.dlq';

class RabbitMQConnectionManager implements IConnectionManager {
    private static instance: RabbitMQConnectionManager | null = null;
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;

    private constructor() { }

    public static getInstance(): RabbitMQConnectionManager {
        if (!RabbitMQConnectionManager.instance) {
            RabbitMQConnectionManager.instance = new RabbitMQConnectionManager();
        }
        return RabbitMQConnectionManager.instance;
    }

    public static resetInstance(): void {
        RabbitMQConnectionManager.instance = null;
    }

    async connect(): Promise<void> {
        if (this.connection) {
            return;
        }

        logger.info(`Connecting to RabbitMQ at ${RABBITMQ_URL}...`);
        this.connection = await amqp.connect(RABBITMQ_URL!);
        this.channel = await this.connection.createChannel();

        // Dead-Letter Exchange + Queue (§4.4)
        logger.info('Asserting DLX exchange and DLQ...');
        await this.channel.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });
        await this.channel.assertQueue(DLQ_NAME, { durable: true });
        await this.channel.bindQueue(DLQ_NAME, DLX_EXCHANGE, '');

        // Main exchange
        logger.info('Asserting main exchange...');
        await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

        // Main queue with DLX configuration
        logger.info('Asserting main queue with DLQ binding...');
        const q = await this.channel.assertQueue(QUEUE_NAME, {
            durable: true,
            deadLetterExchange: DLX_EXCHANGE,
            deadLetterRoutingKey: '',
        });
        await this.channel.bindQueue(q.queue, EXCHANGE_NAME, '#');

        logger.info(`Waiting for messages on ${q.queue}. Press CTRL+C to exit`);

        this.setupEventHandlers();
    }

    async close(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
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
            logger.error('RabbitMQ connection closed. Retrying in 5s...');
            this.connection = null;
            this.channel = null;
        });

        this.connection?.on('error', (err) => {
            logger.error('RabbitMQ connection error', { error: err.message });
        });
    }
}

export { RabbitMQConnectionManager };
