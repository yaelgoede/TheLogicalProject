import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

/**
 * This function returns a simple JSON response indicating the health status of the API.
 * @param request - The HTTP request object. 
 * @param context - The invocation context.
 * @returns A promise that resolves to an HTTP response with a status code of 200 and a JSON body.
 */
export async function getHealth(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Health check request received');

    const response: HttpResponseInit = {
        status: 200,
        body: JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString()
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return response;
};

app.http('getHealth', {
    methods: ['GET'],
    route: 'health',
    authLevel: 'anonymous',
    handler: getHealth
});