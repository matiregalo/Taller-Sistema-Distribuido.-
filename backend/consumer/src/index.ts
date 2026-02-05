import * as amqp from 'amqplib';
import { Incident, IncidentType } from './types';
import { determinePriority, determineStatus } from './processor';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'complaints.exchange';
const QUEUE_NAME = 'complaints.queue';

const startConsumer = async () => {
  try {
    console.log(`Conectando a RabbitMQ en ${RABBITMQ_URL}...`);
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    console.log('Verificando exchange...');
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    console.log('Verificando cola...');
    const q = await channel.assertQueue(QUEUE_NAME, { durable: true });

    await channel.bindQueue(q.queue, EXCHANGE_NAME, '#');

    console.log(`Esperando mensajes en ${q.queue}. Para salir presione CTRL+C`);

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log('Mensaje recibido:', content);

          if (!content.type || !content.description) {
            console.warn('Estructura de mensaje inválida. Omitiendo lógica.');
            channel.ack(msg);
            return;
          }

          const incidentType = content.type as IncidentType;
          
          const priority = determinePriority(incidentType);
          const status = determineStatus(priority);

          const processedIncident: Incident = {
            ...content,
            priority,
            status,
            processedAt: new Date()
          };

          console.log('Incidente procesado:', JSON.stringify(processedIncident, null, 2));
          
          channel.ack(msg);
        } catch (error) {
          console.error('Error procesando mensaje:', error);
          channel.ack(msg); 
        }
      }
    });

    connection.on('close', () => {
      console.error('Conexión a RabbitMQ cerrada. Reintentando en 5s...');
      setTimeout(startConsumer, 5000);
    });

    connection.on('error', (err) => {
        console.error('Error de conexión a RabbitMQ', err);
    });

  } catch (error) {
    console.error('Error iniciando consumidor:', error);
    setTimeout(startConsumer, 5000);
  }
};

startConsumer();
