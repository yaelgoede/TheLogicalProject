import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { PrismaClient } from '../utils/prisma/client';
import { Kafka } from 'kafkajs';
import { LokiLogger } from '../utils/lokiLogger';

const prisma = new PrismaClient();
const logger = new LokiLogger(process.env.LOKI_URL, {
    service: 'system-api',
    function: 'createRelation'
});

const kafka = new Kafka({
    clientId: 'system-api',
    brokers: [process.env.KAFKA_BROKERS]
});
const producer = kafka.producer();

interface CreateRelationRequest {
    name: string;
    kvkNumber: string;
}


/**
 * Creates a new relation in the database and publishes an event to Kafka.
 * @param request -The HTTP request object.
 * @param context - The invocation context.
 * @returns A promise that resolves to an HTTP response.
 */
export async function createRelation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const requestBody = await request.json() as CreateRelationRequest;
    
    try {
        if (!requestBody.name || !requestBody.kvkNumber) {
            await logger.warn('Missing required fields', { body: JSON.stringify(requestBody) });
            return {
                status: 400,
                jsonBody: { error: 'Name and KvK number are required' }
            };
        }

        const relation = await prisma.relations.create({
            data: {
                owner: 'system',
                name: requestBody.name,
                kvkNumber: requestBody.kvkNumber
            }
        });

        await logger.info('Relation created successfully', { id: relation.id });

        await producer.connect();
        await producer.send({
            topic: 'systemEvents',
            messages: [{ 
                value: JSON.stringify({
                    eventType: 'relation:created',
                    data: relation
                })
            }],
        });

        await logger.info('Relation event published to Kafka', { id: relation.id });

        return {
            status: 201,
            jsonBody: relation
        };
    } catch (error) {
        if (error.code === 'P2002') {
            await logger.warn('KvK number already exists', { kvkNumber: requestBody?.kvkNumber });
            return {
                status: 409,
                jsonBody: { error: 'KvK number already exists' }
            };
        }

        await logger.error('Error creating relation', { error: (error as Error).message });
        return {
            status: 500,
            jsonBody: { error: 'Internal server error' }
        };
    } finally {
        await producer.disconnect();
    }
}

app.http('createRelation', {
    methods: ['POST'],
    route: 'relation',
    authLevel: 'anonymous',
    handler: createRelation,
});