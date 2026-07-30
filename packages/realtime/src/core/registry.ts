import type { z } from "zod";

/** Mirrors `@mumzo/notifications`' template registry — same shape, same
 * reason: `publish("order.created", data)` should fail loudly at the call
 * site if `data` doesn't match what subscribers expect, not silently ship
 * a malformed payload over the wire. */
export type EventDefinition<TType extends string = string, TData = unknown> = {
  type: TType;
  dataSchema: z.ZodType<TData>;
};

const registry = new Map<string, EventDefinition>();

export function defineEvent<TType extends string, TData>(
  definition: EventDefinition<TType, TData>,
) {
  registry.set(definition.type, definition as EventDefinition);
  return definition;
}

export function getEvent(type: string): EventDefinition {
  const event = registry.get(type);
  if (!event) {
    throw new Error(`Unknown realtime event "${type}"`);
  }
  return event;
}
