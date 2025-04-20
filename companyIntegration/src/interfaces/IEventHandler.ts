export interface IEventHandler {
    handle(eventData: any): Promise<void>;
}
