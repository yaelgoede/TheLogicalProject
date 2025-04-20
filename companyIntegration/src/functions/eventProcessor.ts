import { app, InvocationContext, trigger } from "@azure/functions";
import { LokiLogger } from '../utils/lokiLogger';
import { EventHandlerFactory } from '../factories/EventHandlerFactory';

const logger = new LokiLogger(process.env.LOKI_URL, {
    service: process.env.COMPANY,
    function: 'eventProcessor'
});

export async function eventProcessor(event: any, context: InvocationContext): Promise<void> {
    try {
        event = JSON.parse(event.Value);
        console.log('Received event:', event);
        const id = event.data.id;
        const eventType = event.eventType;
        const eventData = event.data;

        await logger.info('Processing event', {
            id,
            eventType,
            eventData
        });

        const handler = EventHandlerFactory.getHandler(eventType);
        if (handler) {
            await handler.handle(eventData);
        } else {
            await logger.warn('No handler found for event type', { id, eventType });
        }

    } catch (error) {
        await logger.error('Error processing event', {
            error: (error as Error).message,
            data: event
        });
    }
}

app.generic('eventProcessor', {
  trigger: trigger.generic({
    type: 'kafkaTrigger',
    name: 'eventProcessor',
    direction: 'in',
    topic: 'systemEvents',
    brokerList: '%KAFKA_BROKERS%',
    // consumerGroup: '$Default'
    consumerGroup: '%COMPANY%',
  }),
  handler: eventProcessor,
})