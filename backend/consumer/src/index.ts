import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';
import { Incident, IncidentType } from './types';
import { determinePriority, determineStatus } from './processor';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'complaints.exchange';
const QUEUE_NAME = 'complaints.queue';

const startConsumer = async () => {
  try {
    console.log(`Connecting to RabbitMQ at ${RABBITMQ_URL}...`);
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    console.log('Asserting exchange...');
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    console.log('Asserting queue...');
    const q = await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind queue to exchange. Using '#' to listen to all routing keys for now as per instructions "vinculada a complaints.exchange"
    // The instructions say "Escuchar mensajes de RabbitMQ en la cola vinculada a complaints.exchange".
    // I'll bind with a wildcard pattern to catch all complaints.
    await channel.bindQueue(q.queue, EXCHANGE_NAME, '#');

    console.log(`Waiting for messages in ${q.queue}. To exit press CTRL+C`);

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log('Received message:', content);

          // Validate if content has incident structure roughly
          if (!content.type || !content.description) {
            console.warn('Invalid message structure. Skipping logic.');
            channel.ack(msg);
            return;
          }

          const incidentType = content.type as IncidentType;
          
          // Apply Business Logic
          const priority = determinePriority(incidentType);
          const status = determineStatus(priority);

          // Create processed incident object
          const processedIncident: Incident = {
            ...content,
            priority,
            status,
            processedAt: new Date() // Adding a timestamp for when it was processed
          };

          console.log('Processed Incident:', JSON.stringify(processedIncident, null, 2));
          
          // Here we would typically save to DB or forward somewhere else.
          // For now, we just acknowledge.
          
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          // If JSON parse fails or other error, we might want to nack or just ack to discard bad message
          // choosing ack to not block queue with bad messages in this simple example
          channel.ack(msg); 
        }
      }
    });

    // Handle connection closure
    connection.on('close', () => {
      console.error('RabbitMQ connection closed. Retrying in 5s...');
      setTimeout(startConsumer, 5000);
    });

    connection.on('error', (err) => {
        console.error('RabbitMQ connection error', err);
    });

  } catch (error) {
    console.error('Error starting consumer:', error);
    // Retry logic could go here
    setTimeout(startConsumer, 5000);
  }
};

startConsumer();
