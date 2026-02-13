# Suite de Pruebas: Implementación Mínima Viable

Este documento describe la suite de pruebas existente en el proyecto, la cual demuestra los tres niveles de la Pirámide de Pruebas aplicados a nuestra arquitectura distribuida.

---

## 📐 Inventario de Pruebas por Nivel

### 🟢 UNITARIAS (Base — Mayor volumen)

Las pruebas unitarias cubren la lógica de negocio aislada dentro de los patrones de diseño.

- **`processor.test.ts`** (9 tests) — *Valida Strategy Pattern*
  - `determinePriority`: Verifica que los 7 tipos de incidente se mapeen a la prioridad correcta.
  - `determineStatus`: Verifica las reglas de transición de estado.

- **`validateComplaintRequest.test.ts`** (8 tests) — *Valida Middleware & SRP*
  - Campos requeridos (`lineNumber`, `email`, `incidentType`).
  - Validación de formato de email.
  - Regla de negocio condicional: `OTHER` requiere `description`.

- **`errorHandler.test.ts`** (5 tests) — *Valida Chain of Responsibility*
  - `ValidationError` → 400
  - `MessagingError` → 503
  - `SyntaxError` → 400
  - Error genérico → 500

- **`MessageHandler.test.ts`** (11 tests) — *Valida Consumer Logic*
  - Mensajes nulos o inválidos.
  - Éxito (ack + persistencia).
  - Estructura inválida → DLQ.
  - Lógica de Retry con headers `x-death`.

---

### 🟡 INTEGRACIÓN (Centro — Volumen medio)

Las pruebas de integración validan la interacción entre capas del Producer (API → Controller → Service → Facade).

- **`complaints.api.test.ts`** (7 tests)
  - Validación HTTP: 400 para requests inválidos.
  - Éxito HTTP: 201 con `ticketId`.
  - Reglas de negocio en capa HTTP.
  - Manejo de rutas inexistentes (404).

---

### 🔴 E2E (Cúspide — Volumen mínimo)

La prueba End-to-End valida el flujo crítico completo a través de toda la infraestructura.

- **`complaint-flow.e2e.test.ts`** (1 flujo automatizado)
  - **Flujo:** Frontend/API → POST /complaints → RabbitMQ → Consumer process → Metricas actualizadas.
  - **Ejecución:** Automatizada vía script npm.

#### Cómo ejecutar la prueba E2E:

1. Asegúrate de que el entorno Docker esté corriendo:
   ```bash
   docker-compose up -d
   ```

2. Ejecuta el comando de prueba desde `backend/producer`:
   ```bash
   npm run test:e2e
   ```

---

## Patrones Validados por Cada Nivel

| Patrón de Diseño | Unitaria | Integración | E2E |
|------------------|----------|-------------|-----|
| **Singleton** (ConnectionManager) | — | ✅ Mock en tests API | ✅ Conexión real |
| **Facade** (MessagingFacade) | — | ✅ Mock en tests API | ✅ Publicación real |
| **Adapter** (IConnectionManager) | — | ✅ Inyección de mock | ✅ amqplib real |
| **Strategy** (PriorityResolver) | ✅ 9 tests directos | — | ✅ Priorización real |
| **Chain of Resp.** (Error Handlers) | ✅ Tests por handler | ✅ HTTP errors reales | ✅ Errores en flujo |

---

## Principios SOLID Habilitando los Tests

| Principio | Cómo facilita el testing |
|-----------|--------------------------|
| **SRP** | Cada test tiene un único motivo para fallar, simplificando el debugging. |
| **OCP** | Nuevas estrategias = nuevos tests sin tocar los existentes. |
| **DIP** | Mocks triviales vía interfaces (`IMessagingFacade`, `ILogger`, `IIncidentRepository`). |
| **ISP** | Mocks mínimos: `{ save: vi.fn() }` en lugar de mockear interfaces gigantes. |
| **LSP** | Los mocks funcionan como sustitutos legítimos de las implementaciones reales. |

---

## Conclusión

La pirámide de pruebas no es una métrica arbitraria sino un reflejo directo de la arquitectura:

1. **Más unitarias** porque los 5 patrones implementados producen muchas unidades con lógica propia.
2. **Menos integración** porque las interfaces DIP reducen la cantidad de puntos de integración críticos.
3. **Mínimas E2E** porque el contrato entre servicios es estable y validar el flujo feliz una vez es suficiente para garantizar la conectividad.

El costo de violar la pirámide sería una suite lenta, frágil y costosa de mantener.
