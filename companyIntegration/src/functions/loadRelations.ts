import { app, InvocationContext, Timer } from "@azure/functions";
import { LokiLogger } from '../utils/lokiLogger';
import { PrismaClient } from '../utils/prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const logger = new LokiLogger(process.env.LOKI_URL, {
    service: process.env.COMPANY,
    function: 'loadRelations'
});

export async function loadRelations(myTimer: Timer, context: InvocationContext): Promise<void> {
    const companyRelations = await prisma.relations.findMany({
        where: {
            owner: process.env.COMPANY
        }
    });

    logger.info(`Found ${companyRelations.length} relations to process`);

    for (const relation of companyRelations) {
        try {
            await axios.post(`${process.env.API_URL}/api/relation`, {
                name: relation.name,
                kvkNumber: relation.kvkNumber
            });
            logger.info(`Successfully created relation`, {id: relation.id});
        } catch (error) {
            logger.error(`Failed to create relation`, {error: (error as Error).message, id: relation.id});
        }
    }
}

app.timer('loadRelations', {
    schedule: '0 */1 * * * *',
    handler: loadRelations
});