import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { PrismaClient } from '../utils/prisma/client';
import { LokiLogger } from '../utils/lokiLogger';

const prisma = new PrismaClient();
const logger = new LokiLogger(process.env.LOKI_URL, {
    service: 'system-api',
    function: 'getRelation'
});

/**
 * Retrieves a relation by its ID and optionally kvkNumber from the database.
 * This function is exposed as an HTTP GET endpoint at 'relation/{id}'.
 * 
 * @param request - The HTTP request object containing the relation ID in the route parameters and kvkNumber in query
 * @param context - The Azure Functions invocation context
 * @returns Promise<HttpResponseInit> containing:
 *  - 200: The relation object if found
 *  - 400: If the relation ID is missing
 *  - 404: If the relation is not found
 *  - 500: If there's an internal server error
 */
export async function getRelation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const id = request.query.get('id');
        const kvkNumber = request.query.get('kvkNumber');

        if (!id && !kvkNumber) {
            await logger.warn('Missing required parameters', { id, kvkNumber });
            return {
                status: 400,
                jsonBody: { error: 'Either id or kvkNumber is required' }
            };
        }

        logger.info('Getting relation', { id, kvkNumber });

        const relation = await prisma.relations.findFirst({
            where: { 
                owner: 'system',
                ...(id && { id: id }),
                ...(kvkNumber && { kvkNumber: kvkNumber })
            }
        });

        if (!relation) {
            await logger.warn('Relation not found', { id, kvkNumber });
            return {
                status: 404,
                jsonBody: { error: 'Relation not found' }
            };
        }

        await logger.info('Relation retrieved successfully', { id, kvkNumber });
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
    route: 'relation',
    authLevel: 'anonymous',
    handler: getRelation
});