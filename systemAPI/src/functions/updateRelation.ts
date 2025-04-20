import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { PrismaClient } from '../utils/prisma/client';
import { Kafka } from 'kafkajs';
import { LokiLogger } from '../utils/lokiLogger';

const prisma = new PrismaClient();
const logger = new LokiLogger(process.env.LOKI_URL, {
    service: 'system-api',
    function: 'updateRelation'
});

const kafka = new Kafka({
    clientId: 'system-api',
    brokers: [process.env.KAFKA_BROKERS]
});
const producer = kafka.producer();

interface UpdateRelationRequest {
    name?: string;
    kvkNumber?: string;
}

/**
 * Updates a relation in the system and publishes an event to Kafka.
 * 
 * @param request - The HTTP request object containing:
 *                 - params.id: The ID of the relation to update
 *                 - body: {@link UpdateRelationRequest} The update data containing optional name and kvkNumber
 * @param context - The Azure Functions invocation context
 * @returns Promise<HttpResponseInit> with:
 *          - 200: Successfully updated relation
 *          - 400: Missing relation ID
 *          - 404: Relation not found
 *          - 409: KvK number already exists
 *          - 500: Internal server error
 */
export async function updateRelation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const id = request.params.id;
    const requestBody = await request.json() as UpdateRelationRequest;
    
    try {
        if (!id) {
            await logger.warn('Missing relation ID');
            return {
                status: 400,
                jsonBody: { error: 'Relation ID is required' }
            };
        }

        const relation = await prisma.relations.update({
            where: { id: id, owner: 'system' },
            data: {
                ...(requestBody.name && { name: requestBody.name }),
                ...(requestBody.kvkNumber && { kvkNumber: requestBody.kvkNumber })
            }
        });

        await logger.info('Relation updated successfully', { id: relation.id });

        await producer.connect();
        await producer.send({
            topic: 'systemEvents',
            messages: [{ 
                value: JSON.stringify({
                    eventType: 'relation:updated',
                    data: relation
                })
            }],
        });

        await logger.info('Relation update event published to Kafka', { id: relation.id });

        return {
            status: 200,
            jsonBody: relation
        };
    } catch (error) {
        if (error.code === 'P2025') {
            await logger.warn('Relation not found', { id: request.params.id });
            return {
                status: 404,
                jsonBody: { error: 'Relation not found' }
            };
        }
        if (error.code === 'P2002') {
            await logger.warn('KvK number already exists', { kvkNumber: requestBody?.kvkNumber });
            return {
                status: 409,
                jsonBody: { error: 'KvK number already exists' }
            };
        }

        await logger.error('Error updating relation', { error: (error as Error).message });
        return {
            status: 500,
            jsonBody: { error: 'Internal server error' }
        };
    } finally {
        await producer.disconnect();
    }
}

app.http('updateRelation', {
    methods: ['PUT'],
    route: 'relation/{id}',
    authLevel: 'anonymous',
    handler: updateRelation
});