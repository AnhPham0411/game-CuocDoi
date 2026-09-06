import { EventCategory, EventDefinition, EventDefinitionSchema } from '@life/schema';

export class EventDatabase {
  private eventsById: Map<string, EventDefinition> = new Map();
  private eventsByCategory: Map<EventCategory, EventDefinition[]> = new Map();
  private allEvents: EventDefinition[] = [];

  constructor() {
    this.clear();
  }

  public clear(): void {
    this.eventsById.clear();
    this.eventsByCategory.clear();
    this.allEvents = [];
  }

  public register(event: EventDefinition): void {
    const validated = EventDefinitionSchema.parse(event);
    this.eventsById.set(validated.id, validated);

    const catList = this.eventsByCategory.get(validated.category) ?? [];
    catList.push(validated);
    this.eventsByCategory.set(validated.category, catList);

    this.allEvents.push(validated);
  }

  public loadBulk(rawEvents: unknown[]): { loaded: number; errors: string[] } {
    let loaded = 0;
    const errors: string[] = [];

    for (const raw of rawEvents) {
      try {
        const parsed = EventDefinitionSchema.parse(raw);
        if (this.eventsById.has(parsed.id)) {
          errors.push(`Duplicate event ID: ${parsed.id}`);
          continue;
        }
        this.register(parsed);
        loaded++;
      } catch (err) {
        errors.push(`Failed to parse event: ${String(err)}`);
      }
    }

    return { loaded, errors };
  }

  public getById(id: string): EventDefinition | undefined {
    return this.eventsById.get(id);
  }

  public getAll(): readonly EventDefinition[] {
    return this.allEvents;
  }

  public getByCategory(category: EventCategory): readonly EventDefinition[] {
    return this.eventsByCategory.get(category) ?? [];
  }

  public count(): number {
    return this.allEvents.length;
  }
}
