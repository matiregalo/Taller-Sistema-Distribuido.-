# Informe de Refactorización — Sistema Distribuido de Gestión de Quejas

**Período**: Desde `audit: snapshot post mvp` hasta `refactor(frontend): extract reusable UI components`  
**Total de commits**: 28  
**Archivos modificados**: 92 (+3.395 / -1.420 líneas)

---

## 1. Resumen Ejecutivo

Este documento detalla todas las refactorizaciones realizadas sobre el sistema desde la auditoría post-MVP (`AUDITORIA.md`), organizándolas según los hallazgos originales y los patrones de diseño aplicados.

---

## 2. Patrones de Diseño Implementados

### 2.1 Singleton — `RabbitMQConnectionManager`

**Hallazgo (§4.2):** Variables module-level para conexión y canal (estado mutable global).

**Solución:** Se implementó el patrón Singleton en ambos servicios para encapsular el estado de conexión a RabbitMQ.

**Archivos:**
- `backend/producer/src/messaging/RabbitMQConnectionManager.ts`
- `backend/consumer/src/messaging/RabbitMQConnectionManager.ts`

**Implementación:**
- Constructor privado (`private constructor()`) que impide la instanciación externa.
- Método estático `getInstance()` para obtener la única instancia.
- Estado encapsulado: `connection`, `channel`, y métodos `connect()`, `close()`, `getChannel()`.
- Se eliminaron las variables sueltas `connection` y `channel` que existían a nivel de módulo.
- Método `resetInstance()` para permitir testeo unitario.

**Dónde se usa:**
- `backend/producer/src/services/complaints.service.ts` — obtiene la instancia para el `MessagingFacade`.
- `backend/producer/src/app.ts` — conecta al iniciar y cierra en shutdown.
- `backend/consumer/src/index.ts` — obtiene la instancia para el consumer.

---

### 2.2 Adapter — `IConnectionManager` / `IMessageBroker`

**Hallazgo (§3.3 DIP):** Dependencia directa a `amqplib` sin interfaz de abstracción.

**Solución:** Se introdujeron interfaces que abstraen la infraestructura de mensajería, permitiendo sustituir `amqplib` por otra implementación (o mocks en tests) sin cambiar el código de negocio.

**Interfaces definidas:**
- `backend/producer/src/messaging/IConnectionManager.ts` — define `connect()`, `close()`, `getChannel()`, `isConnected()`.
- `backend/consumer/src/messaging/IConnectionManager.ts` — misma interfaz en el consumer.
- `backend/producer/src/messaging/IMessagingFacade.ts` — define `publishTicketCreated()`.
- `backend/producer/src/messaging/IMessageSerializer.ts` — define `serializeTicketCreated()`.

**Implementaciones concretas:**
- `RabbitMQConnectionManager implements IConnectionManager` — en ambos servicios.
- `MessagingFacade implements IMessagingFacade` — en el producer.
- `TicketMessageSerializer` implementa `IMessageSerializer` — en el producer.

**Beneficio:** Las clases de negocio (`complaintsService`, `MessageHandler`) dependen de interfaces, no de `amqplib` directamente, cumpliendo el Principio de Inversión de Dependencias (DIP).

---

### 2.3 Facade — `MessagingFacade`

**Hallazgo (§3.1 SRP - Producer app.ts):** El servicio de quejas estaba mezclado con la lógica de publicación, serialización y manejo de canal.

**Solución:** Se creó `MessagingFacade` como una fachada que unifica tres responsabilidades internas:

**Archivo:** `backend/producer/src/messaging/MessagingFacade.ts`

**Componentes que orquesta:**
1. **`IConnectionManager`** — obtiene el canal de comunicación.
2. **`IMessageSerializer`** (`TicketMessageSerializer`) — serializa el ticket a `Buffer`.
3. **Publicación** — publica al exchange con las opciones correctas (`persistent`, `correlationId`).

**Dónde se usa:**
- `backend/producer/src/services/complaints.service.ts` — inyecta la façade por defecto y la usa en `createTicket()`:
  ```typescript
  const defaultMessaging = new MessagingFacade(
    RabbitMQConnectionManager.getInstance(),
    new TicketMessageSerializer(),
    { exchange, routingKey }
  );
  ```
- El servicio ya no sabe nada sobre canales, exchanges ni serialización.

**Resolución del hallazgo §4.5 (Pérdida Silenciosa de Eventos):** La facade lanza `MessagingError` si el canal no está disponible o si el broker no confirma la publicación, eliminando el retorno silencioso de `false`.

---

### 2.4 Strategy — `PriorityResolver`

**Hallazgo (§3.2 OCP):** `determinePriority` en el Consumer usaba un `switch` por `IncidentType`, violando el principio Open/Closed.

**Solución:** Se implementó el Strategy Pattern para el cálculo de prioridad.

**Archivos:**
- `backend/consumer/src/strategies/IPriorityStrategy.ts` — interfaz base con `supportedTypes` y `calculate()`.
- `backend/consumer/src/strategies/CriticalServiceStrategy.ts` — maneja `NO_SERVICE` → `HIGH`.
- `backend/consumer/src/strategies/DegradedServiceStrategy.ts` — maneja `SLOW_SERVICE`, `INTERMITTENT` → `MEDIUM`.
- `backend/consumer/src/strategies/MinorIssuesStrategy.ts` — maneja `INSTALLATION`, `OTHER` → `LOW`.
- `backend/consumer/src/strategies/DefaultPriorityStrategy.ts` — fallback para tipos desconocidos.
- `backend/consumer/src/strategies/PriorityResolver.ts` — resuelve la estrategia correcta mediante un `Map<IncidentType, IPriorityStrategy>`.
- `backend/consumer/src/strategies/index.ts` — barrel file para exportaciones limpias.

**Dónde se usa:**
- `backend/consumer/src/processor.ts` — `determinePriority()` instancia `PriorityResolver` y delega el cálculo.

**Extensibilidad:** Para agregar un nuevo tipo de incidente basta con crear una nueva clase que implemente `IPriorityStrategy` y registrarla en el `PriorityResolver`, sin modificar código existente (OCP).

---

### 2.5 Chain of Responsibility — Error Handler

**Hallazgo (§3.2 OCP):** El `errorHandler` del Producer usaba una cadena de `if (instanceof X)`, siendo difícil de extender.

**Solución:** Se refactorizó en una cadena de handlers independientes, donde cada uno decide manejar el error o pasarlo al siguiente (`next()`).

**Archivos:**
- `backend/producer/src/middlewares/errorHandler.ts` — define el array `errorHandlerChain`.
- `backend/producer/src/middlewares/errorHandlers/validationErrorHandler.ts` — maneja `ValidationError` → 400.
- `backend/producer/src/middlewares/errorHandlers/jsonSyntaxErrorHandler.ts` — maneja `SyntaxError` de JSON → 400.
- `backend/producer/src/middlewares/errorHandlers/messagingErrorHandler.ts` — maneja `MessagingError` → 503.
- `backend/producer/src/middlewares/errorHandlers/httpErrorHandler.ts` — catch-all genérico para `HttpError` → usando `statusCode` de la clase.
- `backend/producer/src/middlewares/errorHandlers/defaultErrorHandler.ts` — handler terminal → 500.
- `backend/producer/src/middlewares/errorHandlers/index.ts` — barrel file.

**Dónde se usa:**
- `backend/producer/src/app.ts` — registra cada handler del array como middleware de Express:
  ```typescript
  errorHandlerChain.forEach(handler => app.use(handler));
  ```

**Extensibilidad:** Para manejar un nuevo tipo de error, basta con crear un nuevo handler y añadirlo al array, sin modificar los handlers existentes.

---

## 3. Principios SOLID Aplicados

### 3.1 SRP — Single Responsibility Principle

#### Producer — `complaints.service.ts`

**Hallazgo:** Construcción del ticket, publicación, logging y manejo de errores en un solo archivo.

**Refactorizaciones aplicadas:**
| Responsabilidad | Antes | Después |
|----------------|-------|---------|
| Construcción del ticket | Dentro del servicio | Función `buildTicket()` separada |
| Publicación de eventos | Lógica de amqplib en el servicio | Delegada a `MessagingFacade` |
| Validación | En el servicio | Extraída a middleware `validateComplaintRequest.ts` |
| Manejo de errores | En el servicio | Chain of Responsibility en `errorHandlerChain` |

El servicio refactorizado solo tiene una función: construir el ticket y publicar vía la facade.

#### Producer — `app.ts`

**Hallazgo:** Configuración, middlewares, rutas, health check, conexión y shutdown mezclados.

**Refactorizaciones aplicadas:**
- Conexión a RabbitMQ → `RabbitMQConnectionManager` (Singleton)
- Graceful shutdown → `backend/producer/src/lifecycle/gracefulShutdown.ts`
- Error handling → `errorHandlerChain` (Chain of Responsibility)
- Configuración → Segregada por módulo en `config/index.ts`

#### Consumer — `index.ts`

**Hallazgo (Severidad CRÍTICA):** Conexión, consumo, parsing, validación, priorización, persistencia, ack/nack, reconexión y logging, todo en un solo archivo.

**Refactorizaciones aplicadas:**
| Responsabilidad | Módulo extraído |
|----------------|----------------|
| Gestión de conexión | `messaging/RabbitMQConnectionManager.ts` |
| Manejo de mensajes | `messaging/MessageHandler.ts` |
| Cálculo de prioridad | `strategies/PriorityResolver.ts` |
| Persistencia | `repositories/InMemoryIncidentRepository.ts` |
| Logging | `utils/logger.ts` (estructurado) |
| Reconexión | `utils/ExponentialBackoff.ts` |
| Health check | `lifecycle/healthServer.ts` |

El `index.ts` del consumer quedó reducido a ~50 líneas, actuando únicamente como **orquestador**.

#### Frontend — `IncidentForm.tsx`

**Hallazgo:** Estado, validación, API call, manejo de errores, modal y render, todo en un mismo componente.

**Refactorizaciones aplicadas:**
| Responsabilidad | Módulo extraído |
|----------------|----------------|
| Estado y API call | `hooks/useIncidentForm.ts` |
| Validación | `utils/validation.ts` (Zod v4) |
| Estado del modal | Elevado a `IncidentReportPage.tsx` |
| Modal genérico | `components/ui/Modal.tsx` |
| Componentes de formulario | `components/ui/Input.tsx`, `Select.tsx`, `TextArea.tsx`, `Button.tsx` |

---

### 3.2 OCP — Open/Closed Principle

| Hallazgo | Solución | Patrón |
|---------|---------|--------|
| `determinePriority` con switch | `PriorityResolver` + estrategias | Strategy |
| `errorHandler` con cadena de ifs | `errorHandlerChain` con handlers | Chain of Responsibility |
| `HttpError` base con `statusCode` | `errors/http.error.ts` con subclases | Herencia abierta |

**Clase base `HttpError`:**
- `backend/producer/src/errors/http.error.ts` — clase abstracta con `statusCode`.
- `ValidationError` extiende `HttpError` con `statusCode = 400`.
- `MessagingError` extiende `HttpError` con `statusCode = 503`.
- `httpErrorHandler` usa `statusCode` de la instancia, permitiendo agregar nuevos tipos de error HTTP sin modificar el handler.

---

### 3.3 DIP — Dependency Inversion Principle

| Dependencia concreta | Interfaz introducida | Ubicación |
|---------------------|---------------------|-----------|
| `amqplib` directo | `IConnectionManager` | `messaging/IConnectionManager.ts` (ambos servicios) |
| Publicación directa | `IMessagingFacade` | `messaging/IMessagingFacade.ts` (producer) |
| Serialización acoplada | `IMessageSerializer` | `messaging/IMessageSerializer.ts` (producer) |
| `console.log` directo | `ILogger` | `utils/ILogger.ts` (ambos servicios + frontend) |
| Repositorio in-memory | `IIncidentRepository` | `repositories/IIncidentRepository.ts` (consumer) |

**Frontend — Logger:**
- `frontend/src/utils/logger.ts` — implementa una abstracción sobre `console` con niveles (`info`, `warn`, `error`), reemplazando los `console.log` directos.

---

### 3.4 ISP — Interface Segregation Principle

| Hallazgo | Refactorización |
|---------|----------------|
| Controlador acoplado a `Request/Response` completos | `complaints.controller.ts` extrae solo `email`, `lineNumber`, `incidentType`, `description` del body |
| Configuración global expuesta | `config/index.ts` segregada en `serverConfig`, `rabbitmqConfig`, `corsConfig` |
| Métodos de repositorio no utilizados | Eliminado `complaints.repository.ts` del producer (la persistencia es del consumer) |

**Archivos:**
- `backend/producer/src/config/index.ts` — exporta objetos de configuración separados por módulo.
- `backend/producer/src/controllers/complaints.controller.ts` — extrae solo los campos necesarios del request.

---

### 3.5 LSP — Liskov Substitution Principle

| Hallazgo | Refactorización |
|---------|----------------|
| Castings inseguros con `as` | Reemplazados por type guards en `utils/typeGuards.ts` |
| Tipos inconsistentes | Contratos claros definidos con interfaces (`IConnectionManager`, etc.) |

**Archivos:**
- `backend/producer/src/utils/typeGuards.ts` — funciones como `isTicket()` con validación estructural.
- `backend/consumer/src/utils/typeGuards.ts` — función `isIncidentType()` para validar tipos de incidente.
- `frontend/src/utils/typeGuards.ts` — type guards para respuestas de API.

---

## 4. Code Smells Resueltos

### 4.1 Duplicación de Dominio

**Decisión:** Mantenida como trade-off de microservicios. Cada servicio tiene sus propios tipos (`ticket.types.ts` en producer, `types/index.ts` en consumer) sin código compartido, respetando la independencia de despliegue.

### 4.2 Estado Mutable Global → Singleton

Resuelto con `RabbitMQConnectionManager` (ver §2.1).

### 4.3 Logging Inconsistente

**Antes:** Producer usaba logger estructurado, consumer usaba `console.log`.

**Después:**
- **Consumer**: `backend/consumer/src/utils/logger.ts` — logger estructurado con `info`, `warn`, `error`, formateando con timestamp y JSON.
- **Producer**: Mantenido su logger existente, añadida interfaz `ILogger`.
- **Frontend**: `frontend/src/utils/logger.ts` — nueva abstracción sobre console.
- **`correlation-id`**: Implementado en los mensajes de RabbitMQ (`correlationId: ticket.ticketId`) y trazado en `MessageHandler`.

### 4.4 DLQ (Dead Letter Queue)

**Antes:** No existía DLQ; mensajes fallidos se perdían.

**Después:**
- `docker-compose.yml` — configurado DLX (Dead Letter Exchange) y DLQ (`complaints.dlq`).
- `MessageHandler.ts` — mensajes que fallan validación son enviados a DLQ (`nack(msg, false, false)`).
- Mensajes que superan `MAX_RETRIES` (3) son enviados a DLQ.
- Retry con backoff exponencial antes de enviar a DLQ.

### 4.5 Pérdida Silenciosa de Eventos

**Antes:** `publishTicketEvent` retornaba `false` sin lanzar error.

**Después:** `MessagingFacade.publishTicketCreated()` lanza `MessagingError` cuando:
- El canal no está disponible.
- El broker no confirma la publicación.

`MessagingError` incluye `ticketId` para trazabilidad y es capturado por `messagingErrorHandler` que responde con 503.

---

## 5. Riesgos Arquitectónicos Abordados

### 5.1 Observabilidad

**Antes:** Sin métricas, sin tracing, sin health checks.

**Después:**
| Componente | Archivo | Métricas |
|-----------|---------|---------|
| Producer | `utils/metrics.ts` | `published`, `publishErrors` |
| Consumer | `utils/metrics.ts` | `processed`, `rejected`, `retried` |
| Consumer | `lifecycle/healthServer.ts` | Endpoint de health check |
| Consumer | `utils/ExponentialBackoff.ts` | Reconexión con backoff exponencial |

### 5.2 Retry y Resiliencia

- **Consumer:** `ExponentialBackoff` con configuración ajustable (`initialDelay`, `maxDelay`, `factor`).
- **`MessageHandler`:** Retry hasta `MAX_RETRIES` con requeue, luego envío a DLQ.

---

## 6. Refactorizaciones del Frontend

### 6.1 Componentes UI Reutilizables

Se extrajeron componentes genéricos para construir formularios consistentes:

| Componente | Archivo | Propósito |
|-----------|---------|---------|
| `Modal` | `components/ui/Modal.tsx` | Modal genérico con overlay, header, body, footer |
| `Input` | `components/ui/Input.tsx` | Campo de texto con label y error |
| `Select` | `components/ui/Select.tsx` | Selector con label y error |
| `TextArea` | `components/ui/TextArea.tsx` | Área de texto con label y error |
| `Button` | `components/ui/Button.tsx` | Botón con variantes y estados |

### 6.2 Validación con Zod v4

**Archivo:** `frontend/src/utils/validation.ts`

- Schema declarativo `incidentSchema` con validación de email, número de línea (regex), tipo de incidente (nativeEnum) y descripción condicional.
- `superRefine` para validación condicional: si `incidentType === OTHER`, la descripción es obligatoria.
- Integrado en `useIncidentForm.ts` usando `incidentSchema.parse()`.

### 6.3 Elevación del Estado del Modal

- **Antes:** El estado del modal (`isModalOpen`, `closeModal`) vivía dentro de `useIncidentForm` hook.
- **Después:** El estado se gestiona en `IncidentReportPage.tsx`, que pasa un callback `onSuccess` al formulario.
- `SuccessModal` ahora usa el `Modal` genérico, recibiéndolo como composición.

### 6.4 Reubicación del Botón de Pruebas de Estrés

- **Antes:** Visible en la parte superior de la página, accesible al usuario.
- **Después:** Trasladado al pie de página (`Footer.tsx`), con estilo discreto (`text-xs text-gray-400`).
- La prop `onOpenStressTest` se pasa: `IncidentReportPage` → `Layout` → `Footer`.

---

## 7. Historial de Commits

| # | Hash | Mensaje |
|---|------|---------|
| 1 | `1c275ec` | `audit: snapshot post mvp` |
| 2 | `2c4f0fc` | `docs: add AUDITORIA.md file` |
| 3 | `d175fe1` | `refactor: implement Singleton pattern for RabbitMQ ConnectionManager` |
| 4 | `b1ee1af` | `refactor: implement Adapter pattern with IMessageBroker and MessagingError` |
| 5 | `1e4d0e6` | `refactor: implement Facade pattern with MessagingFacade and Serializer` |
| 6 | `a8df915` | `refactor: implement Strategy pattern for priority calculation` |
| 7 | `d8670c2` | `refactor: implement Chain of Responsibility for error handling` |
| 8 | `fb0dff7` | `refactor: improve Consumer SRP with MessageHandler and structured logger` |
| 9 | `1ddf9ef` | `refactor: move persistence to Consumer and remove GET endpoint` |
| 10 | `b860269` | `feat: implement DLQ, correlation-id, and unified structured logging` |
| 11 | `eff52e6` | `refactor: apply SRP to Frontend — extract hook, move modal, remove dead API` |
| 12 | `924f97c` | `refactor(logger): introduce ILogger interface for dependency inversion` |
| 13 | `0a575ff` | `refactor(errors): introduce HttpError base class with statusCode` |
| 14 | `837fcdb` | `refactor(producer): extract validation to middleware` |
| 15 | `4ff3c9b` | `refactor(producer): extract graceful shutdown to lifecycle module` |
| 16 | `c5d4f48` | `refactor(types): replace unsafe 'as' casts with type guards` |
| 17 | `b5e748a` | `refactor(config): segregate configuration by module` |
| 18 | `9cbbcec` | `refactor(controller): extract only needed fields from request` |
| 19 | `33e2068` | `feat(consumer): add retry with exponential backoff` |
| 20 | `f9c8ced` | `feat(consumer): add health-check endpoint` |
| 21 | `5f73e9e` | `feat(observability): add basic metrics to producer and consumer` |
| 22 | `5b5dbb7` | `fix(frontend): correct import paths and align test assertions` |
| 23 | `3580b42` | `refactor(producer): remove legacy messaging module and unused config` |
| 24 | `1b382d5` | `refactor: add barrel files for Strategy and Chain of Responsibility` |
| 25 | `5b93ed6` | `refactor(frontend): use hooks barrel import in IncidentForm` |
| 26 | `a799c6a` | `refactor(consumer): move types.ts to types/ directory` |
| 27 | `bca8dd6` | `refactor(producer): move integration test to __tests__ directory` |
| 28 | `e5d0fc2` | `refactor: clean unused exports and simplify validation middleware` |
| 29 | `ae1a2cb` | `refactor(frontend): introduce logger abstraction replacing raw console calls` |
| 30 | `93c0e0d` | `refactor(frontend): extract reusable UI components, add Zod validation, and lift modal state` |

---

## 8. Conclusión

Todos los hallazgos identificados en `AUDITORIA.md` han sido abordados:

- ✅ **5 patrones de diseño** implementados (Singleton, Adapter, Facade, Strategy, Chain of Responsibility).
- ✅ **5 principios SOLID** aplicados (SRP, OCP, DIP, ISP, LSP).
- ✅ **5 code smells** resueltos (estado global, logging, DLQ, pérdida de eventos, duplicación aceptada).
- ✅ **Observabilidad** mejorada con métricas, health checks y correlation-id.
- ✅ **Frontend** refactorizado con componentes reutilizables, validación Zod y separación de concerns.
