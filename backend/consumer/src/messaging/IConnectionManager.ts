import type { Channel } from 'amqplib';

export interface IConnectionManager {
    connect(): Promise<void>;
    close(): Promise<void>;
    getChannel(): Channel | null;
    isConnected(): boolean;
}
