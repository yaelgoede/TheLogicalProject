import { app, InvocationContext, Timer } from "@azure/functions";
import { LokiLogger } from '../utils/lokiLogger';
import { PrismaClient } from '../utils/prisma/client';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const logger = new LokiLogger(process.env.LOKI_URL, {
    service: process.env.COMPANY,
    function: 'seedRelations'
});

export async function seedRelations(myTimer: Timer, context: InvocationContext): Promise<void> {
    let shouldSeed = await prisma.relations.findMany({
        where: {
            owner: process.env.COMPANY
        }
    })

    logger.info('Checking if relations need to be seeded');

    if (shouldSeed.length < 1) {
        await logger.info('Seeding relations...');
        
        await prisma.relations.deleteMany({
            where: {
                owner: process.env.COMPANY
            }
        });
        // Read CSV file from the function app's root directory
        const csvContent = readFileSync(join(__dirname, '..', '..', '..', 'data', process.env.COMPANY, 'data.csv'), 'utf-8');
        logger.info('CSV file read successfully');
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true
        });
        await prisma.relations.createMany({ 
            data: records.map((record: any) => ({
                name: record.name,
                kvkNumber: record.kvkNumber,
                owner: process.env.COMPANY
            })) 
        });
        await logger.info('Relations seeded successfully');
    }
}

app.timer('seedRelations', {
    schedule: '0 */1 * * * *',
    handler: seedRelations
});