import { RabbitMQConnectionManager } from './messaging/RabbitMQConnectionManager';
import { Incident, IncidentType } from './types';
import { determinePriority, determineStatus } from './processor';

const connectionManager = RabbitMQConnectionManager.getInstance();

const startConsumer = async () => {
  try {
    await connectionManager.connect();

    const channel = connectionManager.getChannel();
    if (!channel) {
      throw new Error('Channel not available after connect');
    }

    channel.consume('complaints.queue', (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log('Mensaje recibido:', content);

          if (!content.type) {
            console.warn('Estructura de mensaje inválida: falta el tipo de incidente. Omitiendo lógica.');
            channel.ack(msg);
            return;
          }

          const incidentType = content.type as IncidentType;

          if (incidentType === IncidentType.OTHER && !content.description) {
            console.warn('Estructura de mensaje inválida: se requiere descripción para el tipo OTHER. Omitiendo lógica.');
            channel.ack(msg);
            return;
          }

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

    // Reconnection is handled inside the Singleton's event handlers
    // but we still need to restart the consumer when connection closes
    // The Singleton's 'close' handler nullifies connection and channel.
    // We use a simple polling strategy to detect disconnection and retry.

  } catch (error) {
    console.error('Error iniciando consumidor:', error);
    setTimeout(startConsumer, 5000);
  }
};

startConsumer();
