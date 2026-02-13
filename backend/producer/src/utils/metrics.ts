/**
 * Lightweight in-process metrics counter (§5.2).
 * Tracks basic operational counters without external dependencies.
 * Exposed via health-check endpoints.
 */
export interface MetricsSnapshot {
  messagesPublished: number;
  publishErrors: number;
  uptime: number;
}

class Metrics {
  private messagesPublished = 0;
  private publishErrors = 0;
  private readonly startTime = Date.now();

  incrementPublished(): void {
    this.messagesPublished++;
  }

  incrementPublishErrors(): void {
    this.publishErrors++;
  }

  getSnapshot(): MetricsSnapshot {
    return {
      messagesPublished: this.messagesPublished,
      publishErrors: this.publishErrors,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
    };
  }
}

export const metrics = new Metrics();
