# Recomendación de Patrones de Diseño

**Sistema Distribuido de Gestión de Quejas**  
**Fecha:** 12 de febrero de 2026  
**Basado en:** Auditoría Arquitectónica Post-MVP

---

## Índice

1. [Patrón Creacional: Singleton](#1-patrón-creacional-singleton-connection-manager)
2. [Patrón Estructural: Facade](#2-patrón-estructural-facade-messaging-facade)
3. [Patrón Estructural: Adapter](#3-patrón-estructural-adapter-messagebroker)
4. [Patrón Comportamental: Strategy](#4-patrón-comportamental-strategy-priority-calculation)
5. [Patrón Comportamental: Chain of Responsibility](#5-patrón-comportamental-chain-of-responsibility-error-handlers)
6. [Resumen de Impacto](#6-resumen-de-impacto)
7. [Arquitectura Resultante](#7-arquitectura-resultante)
8. [Principios SOLID Aplicados](#8-principios-solid-aplicados)
9. [Plan de Implementación](#9-plan-de-implementación-sugerido)
10. [Conclusión](#10-conclusión)

---

## 1. PATRÓN CREACIONAL: Singleton (Connection Manager)

### Hallazgos que resuelve

- Estado mutable global en `rabbitmq.ts` (variables `connection` y `channel` a nivel de módulo)
- Múltiples responsabilidades en el manejo de conexión
- DIP: Dependencia directa a amqplib
- **Severidad:** MEDIA

### Situación actual

```typescript
// Variables globales mutables - problemático
let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<void> => {
  connection = await amqp.connect(config.rabbitmq.url);
  channel = await connection.createChannel();
  // ...
};
```

**Problemas:**
- Variables expuestas a nivel de módulo
- Cualquier parte del código puede modificar el estado
- Difícil de testear (no se puede mockear fácilmente)
- No hay garantía de una única instancia

### Solución propuesta

```typescript
import amqp, { ChannelModel, Channel } from 'amqplib';

interface IConnectionManager {
  connect(): Promise<void>;
  close(): Promise<void>;
  getChannel(): Channel | null;
  isConnected(): boolean;
}

class RabbitMQConnectionManager implements IConnectionManager {
  private static instance: RabbitMQConnectionManager | null = null;
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  // Constructor privado previene instanciación externa
  private constructor() {}

  public static getInstance(): RabbitMQConnectionManager {
    if (!RabbitMQConnectionManager.instance) {
      RabbitMQConnectionManager.instance = new RabbitMQConnectionManager();
    }
    return RabbitMQConnectionManager.instance;
  }

  // Para testing: permite resetear la instancia
  public static resetInstance(): void {
    RabbitMQConnectionManager.instance = null;
  }

  async connect(): Promise<void> {
    if (this.connection) {
      return; // Ya conectado
    }
    
    this.connection = await amqp.connect(config.rabbitmq.url);
    this.channel = await this.connection.createChannel();
    
    await this.channel.assertExchange(config.rabbitmq.exchange, 'topic', {
      durable: true,
    });

    this.setupEventHandlers();
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
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
      this.connection = null;
      this.channel = null;
    });

    this.connection?.on('error', (err) => {
      logger.error('RabbitMQ connection error', { error: err.message });
    });
  }
}

export { RabbitMQConnectionManager, IConnectionManager };
```

### Justificación

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Encapsulamiento** | Variables expuestas globalmente | Estado privado encapsulado |
| **Testabilidad** | Difícil de mockear | Permite inyectar instancia mock via interfaz |
| **Control de ciclo de vida** | Disperso en funciones | Centralizado en una clase |
| **Seguridad de tipo** | Ninguna garantía | Garantía de única instancia |
| **Reutilización** | Código duplicado Producer/Consumer | Compartible entre servicios |

### Por qué Singleton y no otros patrones creacionales

- **Factory:** No aplica porque no necesitamos crear múltiples tipos de conexiones
- **Builder:** Innecesario, la conexión no tiene construcción compleja paso a paso
- **Singleton:** Perfecto porque necesitamos exactamente UNA conexión al broker compartida

---

## 2. PATRÓN ESTRUCTURAL: Facade (Messaging Facade)

### Hallazgos que resuelve

- SRP en `complaints.service.ts`: mezcla construcción de ticket con publicación
- Complejidad de interacción con RabbitMQ expuesta al servicio
- Pérdida silenciosa de eventos (`return false` sin lanzar error)
- **Severidad:** CRÍTICA

### Situación actual

```typescript
// complaints.service.ts - conoce demasiados detalles de mensajería
export const complaintsService = {
  createTicket: async (request: CreateTicketRequest): Promise<Ticket> => {
    // 1. Validación
    validateCreateRequest(request);
    
    // 2. Construcción del ticket
    const ticket: Ticket = { /* ... */ };
    
    // 3. Persistencia
    complaintsRepository.save(ticket);
    
    // 4. Construcción manual del payload de evento
    const eventPayload: TicketEventPayload = {
      ticketId: ticket.ticketId,
      lineNumber: ticket.lineNumber,
      type: ticket.incidentType,
      description: ticket.description,
      createdAt: ticket.createdAt.toISOString(),
    };
    
    // 5. Publicación - PROBLEMA: falla silenciosa
    await publishTicketEvent(eventPayload);
    
    return ticket;
  },
};

// rabbitmq.ts - retorna false sin lanzar error
export const publishTicketEvent = async (payload: TicketEventPayload): Promise<boolean> => {
  if (!channel) {
    logger.error('Cannot publish: RabbitMQ channel not available');
    return false; // ⚠️ PÉRDIDA SILENCIOSA
  }
  // ...
  return published;
};
```

**Problemas:**
- El servicio conoce la estructura del evento (`TicketEventPayload`)
- El servicio sabe cómo transformar `Ticket` a `TicketEventPayload`
- Si `publishTicketEvent` retorna `false`, el ticket se crea pero el evento se pierde
- Violación de SRP: el servicio tiene múltiples responsabilidades

### Solución propuesta

```typescript
// interfaces/messaging.interface.ts
interface IMessagingFacade {
  publishTicketCreated(ticket: Ticket): Promise<void>;
  publishTicketUpdated(ticket: Ticket): Promise<void>;
}

interface IMessageSerializer {
  serializeTicketCreated(ticket: Ticket): Buffer;
  serializeTicketUpdated(ticket: Ticket): Buffer;
}

// errors/messaging.error.ts
class MessagingError extends Error {
  constructor(message: string, public readonly ticketId?: string) {
    super(message);
    this.name = 'MessagingError';
  }
}

// messaging/message-serializer.ts
class TicketMessageSerializer implements IMessageSerializer {
  serializeTicketCreated(ticket: Ticket): Buffer {
    const payload: TicketEventPayload = {
      ticketId: ticket.ticketId,
      lineNumber: ticket.lineNumber,
      type: ticket.incidentType,
      description: ticket.description,
      createdAt: ticket.createdAt.toISOString(),
    };
    return Buffer.from(JSON.stringify(payload));
  }

  serializeTicketUpdated(ticket: Ticket): Buffer {
    // Lógica específica para updates
    return Buffer.from(JSON.stringify({ /* ... */ }));
  }
}

// messaging/messaging-facade.ts
class MessagingFacade implements IMessagingFacade {
  constructor(
    private connectionManager: IConnectionManager,
    private serializer: IMessageSerializer,
    private logger: ILogger,
    private config: MessagingConfig
  ) {}

  async publishTicketCreated(ticket: Ticket): Promise<void> {
    const channel = this.connectionManager.getChannel();
    
    if (!channel) {
      throw new MessagingError(
        'Canal de mensajería no disponible',
        ticket.ticketId
      );
    }

    const message = this.serializer.serializeTicketCreated(ticket);

    const published = channel.publish(
      this.config.exchange,
      this.config.routingKey,
      message,
      { persistent: true, contentType: 'application/json' }
    );

    if (!published) {
      throw new MessagingError(
        'Mensaje no confirmado por el broker',
        ticket.ticketId
      );
    }

    this.logger.info('Ticket event published', { ticketId: ticket.ticketId });
  }

  async publishTicketUpdated(ticket: Ticket): Promise<void> {
    // Implementación similar
  }
}

// Uso simplificado en complaints.service.ts
export const createComplaintsService = (
  repository: IComplaintsRepository,
  messaging: IMessagingFacade,
  logger: ILogger
) => ({
  createTicket: async (request: CreateTicketRequest): Promise<Ticket> => {
    validateCreateRequest(request);
    
    const ticket = buildTicket(request);
    repository.save(ticket);
    
    // Simple y claro - lanza error si falla
    await messaging.publishTicketCreated(ticket);
    
    return ticket;
  },
});
```

### Justificación

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Acoplamiento** | Service conoce detalles de RabbitMQ | Service solo conoce interfaz `IMessagingFacade` |
| **Manejo de errores** | Falla silenciosa (`return false`) | Excepciones explícitas (`throw MessagingError`) |
| **SRP** | Service hace 5+ cosas | Cada componente una responsabilidad |
| **Testabilidad** | Requiere RabbitMQ o mock complejo | Mock simple de `IMessagingFacade` |
| **Serialización** | Mezclada con lógica de negocio | Aislada en `IMessageSerializer` |

### Por qué Facade y no otros patrones estructurales

- **Decorator:** Añadiría comportamiento a objetos existentes; aquí necesitamos ocultar subsistemas
- **Proxy:** Controlaría acceso a un objeto; aquí necesitamos simplificar múltiples interfaces
- **Facade:** Perfecto porque proporciona una interfaz unificada y simple a un conjunto de interfaces complejas (connection, channel, serialization, publishing)

---

## 3. PATRÓN ESTRUCTURAL: Adapter (MessageBroker)

### Hallazgos que resuelve

- DIP: Dependencia directa a amqplib; el dominio no debería conocer la API del canal
- ISP: Interfaces más pequeñas; quien solo necesita publicar no debe depender de toda la API de RabbitMQ
- Acoplamiento del servicio a detalles de implementación (`channel.publish`, `Buffer`, `config`)
- **Severidad:** ALTA

### Situación actual

```typescript
// complaints.service.ts - depende directamente del módulo rabbitmq y del payload
import { publishTicketEvent } from '../messaging/rabbitmq.js';
// ...
const eventPayload: TicketEventPayload = { /* ... */ };
await publishTicketEvent(eventPayload);  // Retorna boolean, no lanza

// rabbitmq.ts - expone detalles de amqplib y variables de módulo
let channel: Channel | null = null;

export const publishTicketEvent = async (payload: TicketEventPayload): Promise<boolean> => {
  if (!channel) return false;
  const message = Buffer.from(JSON.stringify(payload));
  return channel.publish(exchange, routingKey, message, options);
};
```

**Problemas:**
- El servicio conoce que existe un "canal" y un "exchange/routingKey"
- Cualquier cambio de transporte (ej. Kafka) obliga a tocar el servicio
- No hay interfaz que abstraiga "publicar evento"; tests requieren mockear amqplib
- Retorno `boolean` favorece falla silenciosa en lugar de excepciones

### Solución propuesta

```typescript
// messaging/IMessageBroker.ts - interfaz (puerto) que el dominio usa
import type { TicketEventPayload } from '../types/ticket.types.js';

interface IMessageBroker {
  publish(payload: TicketEventPayload): Promise<void>;
}

// messaging/RabbitMQBrokerAdapter.ts - adaptador que traduce a amqplib
class RabbitMQBrokerAdapter implements IMessageBroker {
  constructor(
    private readonly connectionManager: IConnectionManager,
    private readonly config: { exchange: string; routingKey: string }
  ) {}

  async publish(payload: TicketEventPayload): Promise<void> {
    const channel = this.connectionManager.getChannel();
    
    if (!channel) {
      throw new MessagingError('Canal no disponible', payload.ticketId);
    }

    const message = Buffer.from(JSON.stringify(payload));
    
    const published = channel.publish(
      this.config.exchange,
      this.config.routingKey,
      message,
      { persistent: true, contentType: 'application/json' }
    );

    if (!published) {
      throw new MessagingError('Publicación no confirmada por el broker', payload.ticketId);
    }
  }
}

// Uso en complaints.service.ts - solo depende de la interfaz
export const createComplaintsService = (
  repository: IComplaintsRepository,
  broker: IMessageBroker,
  logger: ILogger
) => ({
  createTicket: async (request: CreateTicketRequest): Promise<Ticket> => {
    validateCreateRequest(request);
    const ticket = buildTicket(request);
    repository.save(ticket);
    
    await broker.publish(toEventPayload(ticket));  // Lanza si falla
    
    return ticket;
  },
});
```

### Justificación

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Acoplamiento** | El servicio importa `rabbitmq.ts` y conoce canal, exchange y routing key | El servicio solo depende de `IMessageBroker`; no sabe si usa RabbitMQ, Kafka o un mock |
| **Testabilidad** | Para probar el servicio hay que mockear el módulo rabbitmq completo | Se inyecta un mock que implementa `IMessageBroker` |
| **Extensibilidad** | Cambiar de RabbitMQ a otro broker obliga a tocar el servicio | Se crea un nuevo adaptador (p. ej. `KafkaBrokerAdapter`); el servicio no cambia |
| **Manejo de errores** | `publishTicketEvent` devuelve `boolean`; si es `false`, se ignora | El adaptador lanza una excepción; el servicio la propaga |
| **ISP** | Quien publica está expuesto a toda la API del canal | La interfaz solo expone `publish(payload)`: lo mínimo necesario |

### Por qué Adapter y no otros patrones estructurales

- **Facade:** Oculta *varias* interfaces complejas detrás de una sola. Aquí el problema es que la interfaz existente (amqplib con `channel.publish`) **no es la que nuestro dominio quiere**
- **Bridge:** Separa abstracción de implementaciones para que ambas varíen independientemente. El Adapter va un paso antes: **adapta** una implementación concreta existente al contrato que espera nuestro código
- **Adapter:** Encaja porque tenemos un **componente existente** (RabbitMQ / `channel.publish`) con una interfaz que no coincide con la que necesita el cliente (el servicio). El adaptador implementa `IMessageBroker` y por dentro llama a `channel.publish`

### Diferencia entre Facade y Adapter en este contexto

| Aspecto | Facade | Adapter |
|---------|--------|---------|
| **Propósito** | Simplificar múltiples subsistemas | Traducir una interfaz a otra |
| **Uso aquí** | `MessagingFacade` oculta connection + serializer + publisher | `RabbitMQBrokerAdapter` traduce `IMessageBroker.publish()` a `channel.publish()` |
| **Cuándo usar** | Cuando hay muchas partes complejas que coordinar | Cuando una librería externa no tiene la interfaz que necesitas |

---

## 4. PATRÓN COMPORTAMENTAL: Strategy (Priority Calculation)

### Hallazgos que resuelve

- OCP: `determinePriority` con `switch` por IncidentType en `processor.ts`
- Imposible añadir nuevos tipos sin modificar código existente
- **Severidad:** ALTA

### Situación actual

```typescript
// processor.ts - viola Open/Closed Principle
export const determinePriority = (type: IncidentType): Priority => {
  switch (type) {
    case IncidentType.NO_SERVICE:
      return Priority.HIGH;
    case IncidentType.INTERMITTENT_SERVICE:
    case IncidentType.SLOW_CONNECTION:
      return Priority.MEDIUM;
    case IncidentType.ROUTER_ISSUE:
    case IncidentType.BILLING_QUESTION:
      return Priority.LOW;
    case IncidentType.OTHER:
    default:
      return Priority.PENDING;
  }
};
```

**Problemas:**
- Cada nuevo tipo de incidente requiere modificar esta función
- Viola OCP: no está cerrado para modificación
- Difícil de testear casos específicos de forma aislada
- Si las reglas se vuelven complejas, el switch se vuelve inmanejable

### Solución propuesta

```typescript
// strategies/priority-strategy.interface.ts
interface IPriorityStrategy {
  supports(type: IncidentType): boolean;
  calculatePriority(incident?: Partial<Incident>): Priority;
  getOrder(): number; // Para controlar precedencia
}

// strategies/implementations/critical-service.strategy.ts
class CriticalServiceStrategy implements IPriorityStrategy {
  supports(type: IncidentType): boolean {
    return type === IncidentType.NO_SERVICE;
  }

  calculatePriority(): Priority {
    return Priority.HIGH;
  }

  getOrder(): number {
    return 1; // Mayor prioridad de evaluación
  }
}

// strategies/implementations/degraded-service.strategy.ts
class DegradedServiceStrategy implements IPriorityStrategy {
  private readonly supportedTypes = [
    IncidentType.INTERMITTENT_SERVICE,
    IncidentType.SLOW_CONNECTION,
  ];

  supports(type: IncidentType): boolean {
    return this.supportedTypes.includes(type);
  }

  calculatePriority(): Priority {
    return Priority.MEDIUM;
  }

  getOrder(): number {
    return 2;
  }
}

// strategies/implementations/minor-issues.strategy.ts
class MinorIssuesStrategy implements IPriorityStrategy {
  private readonly supportedTypes = [
    IncidentType.ROUTER_ISSUE,
    IncidentType.BILLING_QUESTION,
  ];

  supports(type: IncidentType): boolean {
    return this.supportedTypes.includes(type);
  }

  calculatePriority(): Priority {
    return Priority.LOW;
  }

  getOrder(): number {
    return 3;
  }
}

// strategies/implementations/default.strategy.ts
class DefaultPriorityStrategy implements IPriorityStrategy {
  supports(): boolean {
    return true; // Siempre soporta (fallback)
  }

  calculatePriority(): Priority {
    return Priority.PENDING;
  }

  getOrder(): number {
    return 999; // Última en evaluarse
  }
}

// strategies/priority-resolver.ts
class PriorityResolver {
  private strategies: IPriorityStrategy[];

  constructor(strategies: IPriorityStrategy[]) {
    // Ordenar por precedencia
    this.strategies = strategies.sort((a, b) => a.getOrder() - b.getOrder());
  }

  resolve(type: IncidentType, incident?: Partial<Incident>): Priority {
    const strategy = this.strategies.find(s => s.supports(type));
    
    if (!strategy) {
      throw new Error(`No strategy found for incident type: ${type}`);
    }
    
    return strategy.calculatePriority(incident);
  }
}

// Factory para crear el resolver con todas las estrategias
const createPriorityResolver = (): PriorityResolver => {
  return new PriorityResolver([
    new CriticalServiceStrategy(),
    new DegradedServiceStrategy(),
    new MinorIssuesStrategy(),
    new DefaultPriorityStrategy(),
  ]);
};

// Uso en el consumer
const priorityResolver = createPriorityResolver();
const priority = priorityResolver.resolve(incidentType);
```

### Extensibilidad demostrada

```typescript
// Añadir nuevo tipo: SECURITY_BREACH con prioridad CRITICAL
// Solo se necesita crear una nueva clase:

class SecurityBreachStrategy implements IPriorityStrategy {
  supports(type: IncidentType): boolean {
    return type === IncidentType.SECURITY_BREACH;
  }

  calculatePriority(): Priority {
    return Priority.CRITICAL; // Nueva prioridad
  }

  getOrder(): number {
    return 0; // Máxima precedencia
  }
}

// Y registrarla en el factory - SIN modificar código existente
const createPriorityResolver = (): PriorityResolver => {
  return new PriorityResolver([
    new SecurityBreachStrategy(), // ← Nueva estrategia
    new CriticalServiceStrategy(),
    new DegradedServiceStrategy(),
    new MinorIssuesStrategy(),
    new DefaultPriorityStrategy(),
  ]);
};
```

### Justificación

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Extensibilidad** | Modificar switch (viola OCP) | Agregar nueva clase (respeta OCP) |
| **Testing** | Test único monolítico | Cada estrategia testeable aisladamente |
| **Mantenibilidad** | Un cambio afecta toda la función | Cambios localizados en una estrategia |
| **Reglas complejas** | Switch inmanejable | Cada estrategia encapsula su lógica |
| **Principio abierto/cerrado** | Violado | Respetado completamente |

### Por qué Strategy y no otros patrones comportamentales

- **State:** Para cambios de estado en un objeto; aquí no hay cambio de estado
- **Observer:** Para notificaciones; aquí necesitamos seleccionar algoritmo
- **Command:** Para encapsular operaciones; aquí necesitamos seleccionar lógica de cálculo
- **Strategy:** Perfecto porque permite intercambiar algoritmos de cálculo de prioridad

---

## 5. PATRÓN COMPORTAMENTAL: Chain of Responsibility (Error Handlers)

### Hallazgos que resuelve

- OCP: `errorHandler` con cadena de `if (instanceof X)`; añadir un nuevo tipo de error obliga a modificar el middleware
- SRP: Un único middleware que conoce todos los tipos de error y construye todas las respuestas
- **Severidad:** ALTA

### Situación actual

```typescript
// middlewares/errorHandler.ts - un solo middleware, cadena de if
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  logger.error('Error occurred', { name: err.name, message: err.message, stack: err.stack });

  if (err instanceof ValidationError) {
    res.status(400).json({ error: 'Validation Error', details: err.message });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON', details: '...' });
    return;
  }

  res.status(500).json({ error: 'Internal Server Error' });
};
```

**Problemas:**
- Cada nuevo tipo de error (`NotFoundError`, `UnauthorizedError`, etc.) exige modificar esta función
- Viola OCP: no está cerrado para modificación
- Un solo archivo concentra el conocimiento de todos los errores HTTP
- Difícil testear un tipo de error sin ejecutar los demás

### Solución propuesta

```typescript
// middlewares/errorHandler.types.ts
import type { Request, Response, NextFunction } from 'express';

export type ErrorHandlerFn = (err: Error, req: Request, res: Response, next: NextFunction) => void;

export interface ErrorResponse {
  error: string;
  details?: string;
}

// middlewares/errorHandlers/validationErrorHandler.ts - eslabón de la cadena
import { ValidationError } from '../../errors/validation.error.js';

export function validationErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(err instanceof ValidationError)) {
    return next(err);  // Pasar al siguiente handler
  }

  res.status(400).json({ error: 'Validation Error', details: err.message });
}

// middlewares/errorHandlers/jsonSyntaxErrorHandler.ts
export function jsonSyntaxErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(err instanceof SyntaxError) || !('body' in err)) {
    return next(err);  // Pasar al siguiente handler
  }

  res.status(400).json({ error: 'Invalid JSON', details: 'Request body contains invalid JSON' });
}

// middlewares/errorHandlers/messagingErrorHandler.ts
import { MessagingError } from '../../errors/messaging.error.js';

export function messagingErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(err instanceof MessagingError)) {
    return next(err);
  }

  res.status(503).json({ error: 'Messaging Error', details: err.message });
}

// middlewares/errorHandlers/defaultErrorHandler.ts - último eslabón
export function defaultErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error occurred', { name: err.name, message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
}

// app.ts - componer la cadena (el orden define la precedencia)
app.use(validationErrorHandler);
app.use(jsonSyntaxErrorHandler);
app.use(messagingErrorHandler);
app.use(defaultErrorHandler);  // Siempre al final
```

### Extensibilidad demostrada

```typescript
// Añadir nuevo tipo de error: NotFoundError
// Solo crear un nuevo eslabón, sin tocar los existentes:

// errors/notFound.error.ts
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// middlewares/errorHandlers/notFoundErrorHandler.ts
export function notFoundErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(err instanceof NotFoundError)) {
    return next(err);
  }
  
  res.status(404).json({ error: 'Not Found', details: err.message });
}

// app.ts - agregar a la cadena
app.use(validationErrorHandler);
app.use(jsonSyntaxErrorHandler);
app.use(messagingErrorHandler);
app.use(notFoundErrorHandler);  // ← Nuevo eslabón
app.use(defaultErrorHandler);
```

### Justificación

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Extensibilidad** | Cada nuevo tipo de error obliga a **modificar** el middleware | Se **añade** un nuevo handler y se registra en `app.use()` |
| **Open/Closed (OCP)** | Abierto a modificación: cada nuevo error implica editar | Cerrado a modificación: se extiende añadiendo eslabones |
| **SRP** | Un middleware conoce todos los tipos de error | Cada handler tiene una única responsabilidad |
| **Testing** | Para probar un error hay que ejecutar el middleware completo | Cada handler se prueba aisladamente |
| **Orden de evaluación** | Depende del orden de los `if` dentro del archivo | Explícito en el orden de `app.use()` |

### Por qué Chain of Responsibility y no otros patrones comportamentales

- **Strategy:** Se usa para **elegir un solo algoritmo** entre varios. En el errorHandler cada handler **decide** si se hace cargo o pasa al siguiente
- **Observer:** Varios observadores reaccionan al mismo evento. Aquí hay un **único flujo**: el error pasa de handler en handler hasta que uno responde
- **Chain of Responsibility:** Encaja porque cada manejador tiene la **misma firma** `(err, req, res, next)` y puede **procesar** el error o **delegar** llamando a `next(err)`

---

## 6. RESUMEN DE IMPACTO

| Patrón | Categoría | Hallazgos Resueltos | Severidad |
|--------|-----------|---------------------|-----------|
| **Singleton** | Creacional | Estado mutable global, DIP | MEDIA |
| **Facade** | Estructural | SRP, Pérdida silenciosa eventos, DIP | CRÍTICA |
| **Adapter** | Estructural | DIP (amqplib), ISP, acoplamiento | ALTA |
| **Strategy** | Comportamental | OCP en priorización | ALTA |
| **Chain of Responsibility** | Comportamental | OCP errorHandler, SRP middleware | ALTA |

---

## 7. ARQUITECTURA RESULTANTE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Error Handler Chain                               │   │
│  │   (Chain of Responsibility Pattern)                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │   │
│  │  │ Validation   │→ │ JSONSyntax   │→ │ Messaging    │→ │ Default │ │   │
│  │  │ Handler      │  │ Handler      │  │ Handler      │  │ Handler │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────┐    ┌────────────────────────────┐                     │
│  │ ComplaintsService│───▶│    IMessagingFacade        │                     │
│  │  (usa interfaz)  │    │    (Facade Pattern)        │                     │
│  └──────────────────┘    └─────────────┬──────────────┘                     │
│                                        │                                     │
│                          ┌─────────────▼──────────────┐                     │
│                          │    IMessageBroker          │                     │
│                          │    (Adapter Pattern)       │                     │
│                          │ RabbitMQBrokerAdapter      │                     │
│                          └─────────────┬──────────────┘                     │
│                                        │                                     │
│                          ┌─────────────▼──────────────┐                     │
│                          │ IConnectionManager         │                     │
│                          │ (Singleton Pattern)        │                     │
│                          └─────────────┬──────────────┘                     │
│                                        │                                     │
└────────────────────────────────────────┼─────────────────────────────────────┘
                                         │
                                    RabbitMQ
                                         │
┌────────────────────────────────────────┼─────────────────────────────────────┐
│                              CONSUMER  │                                      │
├────────────────────────────────────────┼─────────────────────────────────────┤
│                                        │                                      │
│                          ┌─────────────▼──────────────┐                      │
│                          │ IConnectionManager         │                      │
│                          │ (Singleton Pattern)        │                      │
│                          └─────────────┬──────────────┘                      │
│                                        │                                      │
│  ┌─────────────────────────────────────▼────────────────────────────────┐   │
│  │                      MessageHandler                                   │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │                    PriorityResolver                             │  │   │
│  │  │                 (Strategy Pattern)                              │  │   │
│  │  │  ┌──────────┬──────────┬──────────┬──────────┐                 │  │   │
│  │  │  │ Critical │ Degraded │  Minor   │ Default  │                 │  │   │
│  │  │  │ Strategy │ Strategy │ Strategy │ Strategy │                 │  │   │
│  │  │  └──────────┴──────────┴──────────┴──────────┘                 │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. PRINCIPIOS SOLID APLICADOS

| Principio | Patrón | Cómo lo resuelve |
|-----------|--------|------------------|
| **SRP** | Facade + Chain of Responsibility | Facade separa mensajería del servicio; Chain separa un handler por tipo de error |
| **OCP** | Strategy + Chain of Responsibility | Nuevos tipos de prioridad/errores sin tocar código existente |
| **LSP** | Todos | Cada implementación respeta el contrato de su interfaz |
| **ISP** | Facade + Adapter | Expone solo métodos necesarios al consumidor |
| **DIP** | Singleton + Facade + Adapter | Servicios dependen de abstracciones, no implementaciones |

---

## 9. PLAN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: Singleton (Bajo riesgo)

1. Crear `IConnectionManager` interface
2. Implementar `RabbitMQConnectionManager` clase
3. Refactorizar Producer para usar el Singleton
4. Refactorizar Consumer para usar el Singleton
5. Actualizar tests

### Fase 2: Adapter (Desacoplamiento base)

1. Crear `IMessageBroker` interface (puerto)
2. Implementar `RabbitMQBrokerAdapter` usando `IConnectionManager`
3. Refactorizar servicio para recibir `IMessageBroker`
4. Lanzar excepción si publish falla (eliminar `return false`)
5. Actualizar tests con mock de `IMessageBroker`

### Fase 3: Strategy (Riesgo medio)

1. Crear `IPriorityStrategy` interface
2. Implementar estrategias concretas
3. Crear `PriorityResolver`
4. Reemplazar `switch` en `processor.ts`
5. Actualizar tests del Consumer

### Fase 4: Facade (Mayor impacto)

1. Crear `IMessagingFacade` interface
2. Crear `IMessageSerializer` interface
3. Implementar `MessagingFacade` clase
4. Crear `MessagingError` para errores explícitos
5. Refactorizar `ComplaintsService` para usar el Facade
6. Actualizar tests del Producer

### Fase 5: Chain of Responsibility (Error handlers)

1. Crear `errorHandler.types.ts` (`ErrorHandlerFn`, `ErrorResponse`)
2. Implementar `validationErrorHandler`, `jsonSyntaxErrorHandler`, `defaultErrorHandler`
3. En `app.ts` reemplazar errorHandler único por la cadena de handlers
4. Actualizar tests por handler

---

## 10. CONCLUSIÓN

La implementación de estos **cinco patrones de diseño** resolverá los hallazgos más críticos de la auditoría:

1. **Singleton** elimina el estado mutable global y centraliza el manejo de conexiones
2. **Facade** resuelve la pérdida silenciosa de eventos (criticidad máxima) y mejora la separación de responsabilidades
3. **Adapter** desacopla el dominio de amqplib mediante `IMessageBroker` y permite fallar con excepciones en lugar de retorno boolean
4. **Strategy** permite extensibilidad en priorización sin modificar código existente, respetando OCP
5. **Chain of Responsibility** permite añadir nuevos tipos de error sin modificar el middleware central, respetando OCP y SRP

Estos patrones trabajan en conjunto para crear una arquitectura más **mantenible**, **testeable** y **robusta**.

### Distribución por categoría

| Categoría | Patrones |
|-----------|----------|
| **Creacional** | Singleton (1) |
| **Estructural** | Facade, Adapter (2) |
| **Comportamental** | Strategy, Chain of Responsibility (2) |
