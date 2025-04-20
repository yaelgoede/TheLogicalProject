import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { PrismaClient } from '../utils/prisma/client';
import { Kafka } from 'kafkajs';
import { LokiLogger } from '../utils/lokiLogger';

const prisma = new PrismaClient();
const logger = new LokiLogger(process.env.LOKI_URL, {
    service: 'system-api',
    function: 'deleteRelation'
});

const kafka = new Kafka({
    clientId: 'system-api',
    brokers: [process.env.KAFKA_BROKERS]
});
const producer = kafka.producer();

/**
 * Deletes a relation from the database and publishes an event to Kafka.
 * @param request - The HTTP request object.
 * @param context - The invocation context.
 * @returns A promise that resolves to an HTTP response.
 */
export async function deleteRelation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const id = request.params.id;

        if (!id) {
            await logger.warn('Missing relation ID');
            return {
                status: 400,
                jsonBody: { error: 'Relation ID is required' }
            };
        }

        const relation = await prisma.relations.findUnique({
            where: { id: id, owner: 'system' }
        });
        
        await prisma.relations.delete({
            where: { id: id, owner: 'system' }
        });

        await logger.info('Relation deleted successfully', { id });

        await producer.connect();
        await producer.send({
            topic: 'systemEvents',
            messages: [{ 
                value: JSON.stringify({
                    eventType: 'relation:deleted',
                    data: { id: id, kvkNumber: relation.kvkNumber }
                })
            }],
        });

        await logger.info('Relation deletion event published to Kafka', { id });

        return {
            status: 204
        };
    } catch (error) {
        if (error.code === 'P2025') {
            await logger.warn('Relation not found', { id: request.params.id });
            return {
                status: 404,
                jsonBody: { error: 'Relation not found' }
            };
        }

        await logger.error('Error deleting relation', { error: (error as Error).message });
        return {
            status: 500,
            jsonBody: { error: 'Internal server error' }
        };
    } finally {
        await producer.disconnect();
    }
}

app.http('deleteRelation', {
    methods: ['DELETE'],
    route: 'relation/{id}',
    authLevel: 'anonymous',
    handler: deleteRelation
});