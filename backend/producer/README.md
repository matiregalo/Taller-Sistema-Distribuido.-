# Producer Service

Producer microservice for the ISP Incident Management System. Exposes an HTTP API to create and query support tickets, validates requests, persists data in-memory, and publishes events to RabbitMQ.

## Prerequisites

- Node.js 20+
- RabbitMQ running on `localhost:5672` (or configure via env vars)

## Installation

```bash
cd backend/producer
npm install
```

## Configuration

Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment |
| `RABBITMQ_URL` | amqp://localhost:5672 | RabbitMQ connection URL |
| `RABBITMQ_EXCHANGE` | complaints.exchange | Exchange name |
| `RABBITMQ_ROUTING_KEY` | complaint.received | Routing key |

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t producer-service .
docker run -p 3000:3000 --env-file .env producer-service
```

## API Endpoints

### Create Complaint
```bash
POST /complaints
Content-Type: application/json

{
  "lineNumber": "555-1234",
  "email": "user@example.com",
  "incidentType": "SLOW_CONNECTION",
  "description": "Optional description"
}
```

**Response (201):**
```json
{
  "ticketId": "uuid",
  "lineNumber": "555-1234",
  "email": "user@example.com",
  "incidentType": "SLOW_CONNECTION",
  "description": null,
  "status": "RECEIVED",
  "priority": "PENDING",
  "createdAt": "2026-02-05T18:00:00.000Z"
}
```

### Get Complaint
```bash
GET /complaints/:ticketId
```

### Health Check
```bash
GET /health
```

## Incident Types

- `NO_SERVICE`
- `SLOW_CONNECTION`
- `INTERMITTENT_SERVICE`
- `OTHER` (requires description)

## RabbitMQ Event

Published to `complaints.exchange` with routing key `complaint.received`:

```json
{
  "ticketId": "uuid",
  "lineNumber": "555-1234",
  "incidentType": "SLOW_CONNECTION",
  "description": null,
  "createdAt": "2026-02-05T18:00:00.000Z"
}
```
