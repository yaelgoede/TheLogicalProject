import { app, InvocationContext, Timer } from "@azure/functions";
import { LokiLogger } from '../utils/lokiLogger';
import { PrismaClient } from '../utils/prisma/client';

const prisma = new PrismaClient();

const logger = new LokiLogger(process.env.LOKI_URL, {
    service: process.env.COMPANY,
    function: 'seedRelations'
});

export async function seedRelations(myTimer: Timer, context: InvocationContext): Promise<void> {
    let shouldSeed = await prisma.relations.findFirst({
        where: {
            owner: process.env.COMPANY,
            name: 'seed'
        }
    })

    logger.info('Checking if relations need to be seeded');

    if (!shouldSeed) {
        await logger.info('Seeding relations...');
        const seedData = [
            { name: 'seed', kvkNumber: '12345678', owner: process.env.COMPANY },
            { name: 'Coca', kvkNumber: '12312312', owner: process.env.COMPANY },
            { name: 'Cola', kvkNumber: '87654321', owner: process.env.COMPANY }
        ];
        await prisma.relations.deleteMany({
            where: {
                owner: process.env.COMPANY
            }
        });
        await prisma.relations.createMany({ data: seedData });
        await logger.info('Relations seeded successfully');
    }
}

app.timer('seedRelations', {
    schedule: '0 */1 * * * *',
    handler: seedRelations
});