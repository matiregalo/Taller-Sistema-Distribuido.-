import * as amqp from 'amqplib';
import { ChannelModel, Channel } from 'amqplib';
import type { IConnectionManager } from './IConnectionManager';

const RABBITMQ_URL = process.env.RABBITMQ_URL;
if (!RABBITMQ_URL) {
    console.error('RABBITMQ_URL environment variable is required');
    process.exit(1);
}

const EXCHANGE_NAME = 'complaints.exchange';
const QUEUE_NAME = 'complaints.queue';

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

        console.log(`Conectando a RabbitMQ en ${RABBITMQ_URL}...`);
        this.connection = await amqp.connect(RABBITMQ_URL!);
        this.channel = await this.connection.createChannel();

        console.log('Verificando exchange...');
        await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

        console.log('Verificando cola...');
        const q = await this.channel.assertQueue(QUEUE_NAME, { durable: true });
        await this.channel.bindQueue(q.queue, EXCHANGE_NAME, '#');

        console.log(`Esperando mensajes en ${q.queue}. Para salir presione CTRL+C`);

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
            console.error('Error closing RabbitMQ connection', error);
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
            console.error('Conexión a RabbitMQ cerrada. Reintentando en 5s...');
            this.connection = null;
            this.channel = null;
        });

        this.connection?.on('error', (err) => {
            console.error('Error de conexión a RabbitMQ', err);
        });
    }
}

export { RabbitMQConnectionManager };
