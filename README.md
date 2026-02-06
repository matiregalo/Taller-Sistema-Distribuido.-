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

---

> **Nota:** Este es un proyecto de estudio desarrollado como parte de un taller académico.