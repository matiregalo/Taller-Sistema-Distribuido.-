import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('expone port, nodeEnv y rabbitmq con valores por defecto', async () => {
    const { config } = await import('./index.js');
    expect(config.port).toBeGreaterThan(0);
    expect(config.nodeEnv).toBeDefined();
    expect(config.rabbitmq).toBeDefined();
    expect(config.rabbitmq.url).toBeDefined();
    expect(config.rabbitmq.exchange).toBe('complaints.exchange');
    expect(config.rabbitmq.routingKey).toBe('complaint.received');
  });

  it('usa development cuando NODE_ENV no está definido', async () => {
    delete process.env.NODE_ENV;
    vi.resetModules();
    const { config } = await import('./index.js');
    expect(config.nodeEnv).toBe('development');
  });
});
