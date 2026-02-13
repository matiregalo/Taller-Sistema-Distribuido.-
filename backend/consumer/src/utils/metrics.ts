/**
 * Lightweight in-process metrics counter (§5.2).
 * Tracks basic operational counters without external dependencies.
 * Exposed via health-check endpoint.
 */
export interface MetricsSnapshot {
  messagesProcessed: number;
  messagesRejected: number;
  messagesRetried: number;
  uptime: number;
}

class Metrics {
  private messagesProcessed = 0;
  private messagesRejected = 0;
  private messagesRetried = 0;
  private readonly startTime = Date.now();

  incrementProcessed(): void {
    this.messagesProcessed++;
  }

  incrementRejected(): void {
    this.messagesRejected++;
  }

  incrementRetried(): void {
    this.messagesRetried++;
  }

  getSnapshot(): MetricsSnapshot {
    return {
      messagesProcessed: this.messagesProcessed,
      messagesRejected: this.messagesRejected,
      messagesRetried: this.messagesRetried,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
    };
  }
}

export const metrics = new Metrics();
