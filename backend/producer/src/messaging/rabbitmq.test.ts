import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketEventPayload, IncidentType } from '../types/ticket.types.js';
import { RabbitMQConnectionManager } from './RabbitMQConnectionManager.js';

const mockPublish = vi.fn().mockReturnValue(true);
const mockAssertExchange = vi.fn().mockResolvedValue(undefined);
const mockChannelClose = vi.fn().mockResolvedValue(undefined);
const mockConnectionClose = vi.fn().mockResolvedValue(undefined);

vi.mock('amqplib', () => {
  const createMockChannel = () => ({
    assertExchange: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockReturnValue(true),
    close: vi.fn().mockResolvedValue(undefined),
  });

  const createMockConnection = () => ({
    createChannel: vi.fn().mockResolvedValue(createMockChannel()),
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  });

  return {
    default: {
      connect: vi.fn().mockResolvedValue(createMockConnection()),
    },
  };
});

describe('rabbitmq (Singleton-based)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    RabbitMQConnectionManager.resetInstance();

    // Re-setup mock implementations after clearAllMocks
    const amqp = await import('amqplib');
    const mockChannel = {
      assertExchange: mockAssertExchange,
      publish: mockPublish,
      close: mockChannelClose,
    };
    const mockConnection = {
      createChannel: vi.fn().mockResolvedValue(mockChannel),
      on: vi.fn(),
      close: mockConnectionClose,
    };
    vi.mocked(amqp.default.connect).mockResolvedValue(mockConnection as never);
  });

  it('publishTicketEvent devuelve false cuando el channel no está disponible', async () => {
    const { publishTicketEvent } = await import('./rabbitmq.js');
    const payload: TicketEventPayload = {
      ticketId: 't-1',
      lineNumber: '099',
      type: IncidentType.NO_SERVICE,
      description: null,
      createdAt: new Date().toISOString(),
    };
    const result = await publishTicketEvent(payload);
    expect(result).toBe(false);
  });

  it('connectRabbitMQ conecta y configura exchange via Singleton', async () => {
    const amqp = await import('amqplib');
    const { connectRabbitMQ } = await import('./rabbitmq.js');
    await connectRabbitMQ();
    expect(amqp.default.connect).toHaveBeenCalled();
    expect(mockAssertExchange).toHaveBeenCalled();
  });

  it('publishTicketEvent publica y devuelve true tras connect', async () => {
    const { connectRabbitMQ, publishTicketEvent } = await import('./rabbitmq.js');
    await connectRabbitMQ();
    const payload: TicketEventPayload = {
      ticketId: 't-2',
      lineNumber: '099',
      type: IncidentType.SLOW_CONNECTION,
      description: null,
      createdAt: new Date().toISOString(),
    };
    const result = await publishTicketEvent(payload);
    expect(result).toBe(true);
    expect(mockPublish).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Buffer),
      expect.objectContaining({ persistent: true, contentType: 'application/json' })
    );
  });

  it('publishTicketEvent devuelve false cuando channel.publish devuelve false', async () => {
    const { connectRabbitMQ, publishTicketEvent } = await import('./rabbitmq.js');
    await connectRabbitMQ();
    mockPublish.mockReturnValueOnce(false);
    const payload: TicketEventPayload = {
      ticketId: 't-3',
      lineNumber: '099',
      type: IncidentType.NO_SERVICE,
      description: null,
      createdAt: new Date().toISOString(),
    };
    const result = await publishTicketEvent(payload);
    expect(result).toBe(false);
  });

  it('publishTicketEvent devuelve false y captura error si publish lanza', async () => {
    const { connectRabbitMQ, publishTicketEvent } = await import('./rabbitmq.js');
    await connectRabbitMQ();
    mockPublish.mockImplementationOnce(() => {
      throw new Error('Broker full');
    });
    const payload: TicketEventPayload = {
      ticketId: 't-4',
      lineNumber: '099',
      type: IncidentType.NO_SERVICE,
      description: null,
      createdAt: new Date().toISOString(),
    };
    const result = await publishTicketEvent(payload);
    expect(result).toBe(false);
  });

  it('publishTicketEvent captura throw no-Error', async () => {
    const { connectRabbitMQ, publishTicketEvent } = await import('./rabbitmq.js');
    await connectRabbitMQ();
    mockPublish.mockImplementationOnce(() => {
      throw 'not an Error';
    });
    const result = await publishTicketEvent({
      ticketId: 't-x',
      lineNumber: '099',
      type: IncidentType.NO_SERVICE,
      description: null,
      createdAt: new Date().toISOString(),
    });
    expect(result).toBe(false);
  });

  it('connectRabbitMQ lanza si connect falla', async () => {
    const amqp = await import('amqplib');
    vi.mocked(amqp.default.connect).mockRejectedValueOnce(new Error('Connection refused'));
    RabbitMQConnectionManager.resetInstance();
    const { connectRabbitMQ } = await import('./rabbitmq.js');
    await expect(connectRabbitMQ()).rejects.toThrow('Connection refused');
  });

  it('closeRabbitMQ cierra channel y connection', async () => {
    const { connectRabbitMQ, closeRabbitMQ } = await import('./rabbitmq.js');
    await connectRabbitMQ();
    await closeRabbitMQ();
    expect(mockChannelClose).toHaveBeenCalled();
    expect(mockConnectionClose).toHaveBeenCalled();
  });

  it('closeRabbitMQ maneja error al cerrar', async () => {
    const { connectRabbitMQ, closeRabbitMQ } = await import('./rabbitmq.js');
    await connectRabbitMQ();
    mockChannelClose.mockRejectedValueOnce(new Error('Close failed'));
    await expect(closeRabbitMQ()).resolves.not.toThrow();
  });
});
