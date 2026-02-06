# Taller Sistema Distribuido
# Sistema de Gestión de Quejas ISP

Sistema distribuido para la gestión de quejas de clientes de un proveedor de servicios de internet (ISP), implementado con arquitectura de microservicios y mensajería asíncrona.

## 🏗️ Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Producer  │────▶│  RabbitMQ   │────▶│  Consumer   │
│   (React)   │     │  (Express)  │     │  (Broker)   │     │  (Worker)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     :80                :3000            :5672/:15672
```

## 👥 Equipo

| Integrante | Rol | Responsabilidad |
|------------|-----|-----------------|
| **Nahuel Lemes** | Producer | API REST y publicación de mensajes a RabbitMQ |
| **Sebastián Stelmaj** | Consumer | Procesamiento de incidentes desde la cola |
| **Matias Regalo** | QA | Aseguramiento de calidad y pruebas |
| **Cristian Renz** | Frontend | Interfaz de usuario en React |

## 🚀 Inicio Rápido

### Requisitos
- Docker y Docker Compose

### Levantar el sistema completo

```bash
docker-compose up -d --build
```

### Servicios disponibles

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost | Interfaz de usuario |
| Producer API | http://localhost:3000 | API REST |
| RabbitMQ Management | http://localhost:15672 | Panel de administración (guest/guest) |

## 📡 API Endpoints

### Crear queja
```bash
POST /complaints
Content-Type: application/json

{
  "lineNumber": "123456",
  "email": "cliente@ejemplo.com",
  "incidentType": "NO_SERVICE",
  "description": "Sin servicio desde ayer"
}
```

### Obtener queja por ID
```bash
GET /complaints/:ticketId
```

### Health check
```bash
GET /health
```

### Tipos de incidente válidos
- `NO_SERVICE` - Sin servicio
- `INTERMITTENT_SERVICE` - Servicio intermitente
- `SLOW_CONNECTION` - Conexión lenta
- `ROUTER_ISSUE` - Problema con router
- `BILLING_QUESTION` - Consulta de facturación
- `OTHER` - Otro (requiere descripción)

## 🛠️ Desarrollo Local

### Producer
```bash
cd backend/producer
npm install
npm run dev
```

### Consumer
```bash
cd backend/consumer
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Estructura del Proyecto

```
├── backend/
│   ├── producer/          # API REST (Express + TypeScript)
│   └── consumer/          # Worker (Node.js + TypeScript)
├── frontend/              # UI (React + TypeScript + Vite)
└── docker-compose.yml     # Orquestación de servicios
```

## 🔧 Variables de Entorno

Cada servicio tiene un archivo `.env.example` con las variables necesarias. Copiar a `.env` y ajustar según el ambiente.

## 📊 Monitoreo

### Logs (Docker)
```bash
docker-compose logs -f producer   # API
docker-compose logs -f consumer   # Worker
docker-compose logs -f rabbitmq   # Broker
```

### Panel RabbitMQ
Acceda a http://localhost:15672 (`guest/guest`) para ver exchanges, colas y tasas de mensajes.

## ⚡ Pruebas de estrés

El frontend incluye una herramienta para **pruebas de estrés** que dispara muchas peticiones `POST /complaints` para comprobar si el sistema sigue respondiendo, se degrada o se cae. **No corrige nada; solo detecta y documenta** el comportamiento bajo carga.

### Acceso

Desde la página de reporte de incidentes, haz clic en **«⚡ Pruebas de estrés»** para abrir la pantalla de pruebas.

### Cómo funciona

| Parámetro | Descripción |
|-----------|-------------|
| **Número de peticiones** | Entre 1 y 500 (por defecto: 20). |
| **Modo secuencial** | Envía una petición tras otra. Sirve para ver latencia y estabilidad en serie. |
| **Modo paralelo** | Envía todas las peticiones a la vez (`Promise.allSettled`). Prueba el pico máximo de carga. |

Cada petición usa un payload sintético válido (`lineNumber`, `email` tipo `stress-N@stress-test.local`, `incidentType` variado, `description` opcional).

### Resultados

Tras ejecutar la prueba se muestran:

- **Éxitos** / **Fallos** / **Total**
- **Tiempo total** (ms) y **promedio por petición**
- Lista de errores (hasta 15 mostrados) si hubo fallos

Útil para verificar que el Producer, RabbitMQ y el Consumer soportan carga sin degradarse o caerse.

## 🧪 Testing y Cobertura

Se realizaron **tests unitarios** y **component tests** en todo el sistema. El objetivo de cobertura es **100%** en backend (Producer y Consumer); en el frontend la cobertura se enfoca en el flujo crítico (servicio, formulario, modal), dejando fuera las páginas y layout por ser mayormente presentacionales.

### Backend (Producer y Consumer)

- Tests unitarios con Vitest.
- Cobertura objetivo: **100%** en capas de negocio, controladores, servicios, repositorios y manejo de errores.
- Todos los endpoints fueron **validados en Postman**.

```bash
# Producer
cd backend/producer
npm run test:coverage

# Consumer
cd backend/consumer
npm run test:coverage


# Frontend
cd frontend
npm run test:coverage

```
## 📮 Validación de API (Postman)

Todos los endpoints de la API REST fueron validados mediante Postman:

- `POST /complaints` — Creación de quejas con body válido y casos de error.
- `GET /complaints/:ticketId` — Obtención por ID y 404 cuando no existe.
- `GET /health` — Health check.

### Prueba rápida
```bash
curl -X POST http://localhost:3000/complaints \
  -H "Content-Type: application/json" \
  -d '{"lineNumber": "123456", "email": "test@ejemplo.com", "incidentType": "NO_SERVICE", "description": "Prueba"}'
```

---

> **Nota:** Este es un proyecto de estudio desarrollado como parte de un taller académico.
