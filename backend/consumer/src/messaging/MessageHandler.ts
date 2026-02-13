import { Channel, ConsumeMessage } from 'amqplib';
import { IncidentType, Incident } from '../types';
import { isIncidentType } from '../utils/typeGuards';
import { determinePriority, determineStatus } from '../processor';
import { logger as defaultLogger } from '../utils/logger';
import type { ILogger } from '../utils/ILogger';
import type { IIncidentRepository } from '../repositories/IIncidentRepository';
import { metrics } from '../utils/metrics';

export class MessageHandler {
    private static readonly MAX_RETRIES = 3;

    constructor(
        private readonly channel: Channel,
        private readonly repository: IIncidentRepository,
        private readonly logger: ILogger = defaultLogger
    ) { }

    /**
     * Extract retry count from x-death header (set by RabbitMQ on DLX cycles).
     * Falls back to custom x-retry-count header for requeue-based retries.
     */
    private getRetryCount(msg: ConsumeMessage): number {
        const xDeath = msg.properties.headers?.['x-death'] as Array<{ count: number }> | undefined;
        if (xDeath && xDeath.length > 0) {
            return xDeath.reduce((sum, entry) => sum + (entry.count || 0), 0);
        }
        return (msg.properties.headers?.['x-retry-count'] as number) ?? 0;
    }

    async handle(msg: ConsumeMessage | null): Promise<void> {
        if (msg === null) {
            return;
        }

        const correlationId = msg.properties.correlationId ?? 'unknown';

        try {
            const content = JSON.parse(msg.content.toString());
            this.logger.info('Message received', { ticketId: content.ticketId, correlationId });

            if (!content.type || !isIncidentType(content.type)) {
                this.logger.warn('Invalid message structure: missing or invalid incident type', {
                    ticketId: content.ticketId,
                    correlationId,
                });
                // Send to DLQ — unparseable/invalid structure
                metrics.incrementRejected();
                this.channel.nack(msg, false, false);
                return;
            }

            const incidentType: IncidentType = content.type;

            if (incidentType === IncidentType.OTHER && !content.description) {
                this.logger.warn('Invalid message: description required for OTHER type', {
                    ticketId: content.ticketId,
                    correlationId,
                });
                metrics.incrementRejected();
                this.channel.nack(msg, false, false);
                return;
            }

            const priority = determinePriority(incidentType);
            const status = determineStatus(priority);

            const processedIncident: Incident = {
                ticketId: content.ticketId,
                lineNumber: content.lineNumber,
                type: incidentType,
                description: content.description,
                priority,
                status,
                createdAt: content.createdAt,
                processedAt: new Date(),
            };

            // Persist in Consumer repository (§2.2 decision)
            this.repository.save(processedIncident);

            this.logger.info('Incident processed and persisted', {
                ticketId: processedIncident.ticketId,
                priority: processedIncident.priority,
                status: processedIncident.status,
                correlationId,
            });

            metrics.incrementProcessed();
            this.channel.ack(msg);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const retryCount = this.getRetryCount(msg);

            if (retryCount < MessageHandler.MAX_RETRIES) {
                this.logger.warn('Processing error, requeueing with backoff', {
                    error: errorMessage,
                    correlationId,
                    retryCount: retryCount + 1,
                    maxRetries: MessageHandler.MAX_RETRIES,
                });
                // Requeue with incremented retry header
                metrics.incrementRetried();
                this.channel.nack(msg, false, true);
            } else {
                this.logger.error('Max retries exceeded, sending to DLQ', {
                    error: errorMessage,
                    correlationId,
                    retryCount,
                });
                // Send to DLQ — exhausted retries
                metrics.incrementRejected();
                this.channel.nack(msg, false, false);
            }
        }
    }
}
