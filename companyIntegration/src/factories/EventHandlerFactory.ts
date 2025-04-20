import { IEventHandler } from '../interfaces/IEventHandler';
import { RelationCreatedHandler, RelationUpdatedHandler, RelationDeletedHandler } from '../handlers/RelationEventHandlers';

export class EventHandlerFactory {
    private static handlers: { [key: string]: IEventHandler } = {
        'relation:created': new RelationCreatedHandler(),
        'relation:updated': new RelationUpdatedHandler(),
        'relation:deleted': new RelationDeletedHandler(),
    };

    static getHandler(eventType: string): IEventHandler | null {
        return this.handlers[eventType] || null;
    }
}
