import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketEventPayload, IncidentType } from '../types/ticket.types.js';

const mockPublish = vi.fn().mockReturnValue(true);
const mockAssertExchange = vi.fn().mockResolvedValue(undefined);
const mockChannelClose = vi.fn().mockResolvedValue(undefined);
const mockConnectionClose = vi.fn().mockResolvedValue(undefined);
let onCloseHandler: (() => void) | null = null;
let onErrorHandler: ((err: Error) => void) | null = null;

const createMockChannel = () => ({
  assertExchange: mockAssertExchange,
  publish: mockPublish,
  close: mockChannelClose,
});

const createMockConnection = () => ({
  createChannel: vi.fn().mockResolvedValue(createMockChannel()),
  on: vi.fn((event: string, handler: () => void) => {
    if (event === 'close') onCloseHandler = handler;
    if (event === 'error') onErrorHandler = handler;
  }),
  close: mockConnectionClose,
});

vi.mock('amqplib', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(createMockConnection()),
  },
}));

describe('rabbitmq', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockPublish.mockReturnValue(true);
    onCloseHandler = null;
    onErrorHandler = null;
    const { closeRabbitMQ } = await import('./rabbitmq.js');
    await closeRabbitMQ().catch(() => {});
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

  it('connectRabbitMQ conecta y configura exchange', async () => {
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
    const { connectRabbitMQ } = await import('./rabbitmq.js');
    await expect(connectRabbitMQ()).rejects.toThrow('Connection refused');
  });

  it('connectRabbitMQ maneja rechazo no-Error (unknown error)', async () => {
    const amqp = await import('amqplib');
    vi.mocked(amqp.default.connect).mockRejectedValueOnce('string error');
    const { connectRabbitMQ } = await import('./rabbitmq.js');
    await expect(connectRabbitMQ()).rejects.toBe('string error');
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

  it('closeRabbitMQ maneja rechazo no-Error', async () => {
    const { connectRabbitMQ, closeRabbitMQ } = await import('./rabbitmq.js');
    await connectRabbitMQ();
    mockChannelClose.mockRejectedValueOnce(123);
    await expect(closeRabbitMQ()).resolves.not.toThrow();
  });

  it('connection on("close") nullifica connection y channel', async () => {
    const { connectRabbitMQ, publishTicketEvent } = await import('./rabbitmq.js');
    await connectRabbitMQ();
    expect(onCloseHandler).not.toBeNull();
    onCloseHandler!();
    const payload: TicketEventPayload = {
      ticketId: 't-after-close',
      lineNumber: '099',
      type: IncidentType.NO_SERVICE,
      description: null,
      createdAt: new Date().toISOString(),
    };
    const result = await publishTicketEvent(payload);
    expect(result).toBe(false);
  });

  it('connection on("error") llama al logger', async () => {
    const { connectRabbitMQ } = await import('./rabbitmq.js');
    await connectRabbitMQ();
    expect(onErrorHandler).not.toBeNull();
    onErrorHandler!(new Error('Connection lost'));
  });
});
