import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { PrismaClient } from '../utils/prisma/client';
import { LokiLogger } from '../utils/lokiLogger';

const prisma = new PrismaClient();
const logger = new LokiLogger(process.env.LOKI_URL, {
    service: 'system-api',
    function: 'getRelation'
});

/**
 * Retrieves a relation by its ID from the database.
 * This function is exposed as an HTTP GET endpoint at 'relation/{id}'.
 * 
 * @param request - The HTTP request object containing the relation ID in the route parameters
 * @param context - The Azure Functions invocation context
 * @returns Promise<HttpResponseInit> containing:
 *  - 200: The relation object if found
 *  - 400: If the relation ID is missing
 *  - 404: If the relation is not found
 *  - 500: If there's an internal server error
 */
export async function getRelation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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

        if (!relation) {
            await logger.warn('Relation not found', { id });
            return {
                status: 404,
                jsonBody: { error: 'Relation not found' }
            };
        }

        await logger.info('Relation retrieved successfully', { id });
        return {
            status: 200,
            jsonBody: relation
        };
    } catch (error) {
        await logger.error('Error getting relation', { error: (error as Error).message });
        return {
            status: 500,
            jsonBody: { error: 'Internal server error' }
        };
    }
}

app.http('getRelation', {
    methods: ['GET'],
    route: 'relation/{id}',
    authLevel: 'anonymous',
    handler: getRelation
});