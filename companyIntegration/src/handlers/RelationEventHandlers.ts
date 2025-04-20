import { IEventHandler } from '../interfaces/IEventHandler';
import { LokiLogger } from '../utils/lokiLogger';
import { PrismaClient } from '../utils/prisma/client';

const prisma = new PrismaClient();

const logger = new LokiLogger(process.env.LOKI_URL, {
    service: process.env.COMPANY,
    function: 'relationHandlers'
});

export class RelationCreatedHandler implements IEventHandler {
    async handle(eventData: any): Promise<void> {
        await logger.info('Processing relation created event', { id: eventData.id, data: eventData });

        try {
            await prisma.relations.create({
                data: {
                    name: eventData.name,
                    kvkNumber: eventData.kvkNumber,
                    owner: process.env.COMPANY
                }
            });
            await logger.info('Relation created successfully', { id: eventData.id, data: eventData });
            
        } catch (error) {
            await logger.error('Error creating relation', {
                id: eventData.id,
                error: (error as Error).message,
                data: eventData
            });
        }
    }
}

export class RelationUpdatedHandler implements IEventHandler {
    async handle(eventData: any): Promise<void> {
        await logger.info('Processing relation updated event', { id: eventData.id, data: eventData });
        
        try {
            const relation = await prisma.relations.findFirst({
                where: { kvkNumber: eventData.kvkNumber, owner: process.env.COMPANY }
            });

            if (!relation) {
                await prisma.relations.create({
                    data: {
                        name: eventData.name,
                        kvkNumber: eventData.kvkNumber,
                        owner: process.env.COMPANY
                    }
                });
            }else {
                await prisma.relations.update({
                    where: { id: relation.id },
                    data: {
                        name: eventData.name,
                        kvkNumber: eventData.kvkNumber
                    }
                });
            }

            await logger.info('Relation updated successfully', { id: eventData.id, data: eventData });
            
        } catch (error) {
            await logger.error('Error updating relation', {
                id: eventData.id,
                error: (error as Error).message,
                data: eventData
            });
        }
    }
}

export class RelationDeletedHandler implements IEventHandler {
    async handle(eventData: any): Promise<void> {
        await logger.info('Processing relation deleted event', { data: eventData });
        
        try {
            const relation = await prisma.relations.findFirst({
                where: { kvkNumber: eventData.kvkNumber, owner: process.env.COMPANY }
            });
            
            if (relation) {
                await prisma.relations.delete({
                    where: { id: relation.id }
                });
            } else {
                await logger.warn('Relation not found for deletion', { id: eventData.id, data: eventData });
            }

            await logger.info('Relation deleted successfully', { id: eventData.id, data: eventData });
            
        } catch (error) {
            await logger.error('Error deleting relation', {
                id: eventData.id,
                error: (error as Error).message,
                data: eventData
            });
        }
    }
}