import type { z } from "zod";

import type { Channel, RenderedNotification } from "../core/types";

type RenderFn<TData> = (data: TData) => RenderedNotification;

export type TemplateDefinition<TData = unknown> = {
  id: string;
  dataSchema: z.ZodType<TData>;
  /** Default render, used for any channel without an override below. */
  render: RenderFn<TData>;
  /** Per-channel overrides — e.g. email needs a longer body than push. */
  renderForChannel?: Partial<Record<Channel, RenderFn<TData>>>;
};

const registry = new Map<string, TemplateDefinition>();

export function defineTemplate<TData>(definition: TemplateDefinition<TData>) {
  registry.set(definition.id, definition as TemplateDefinition);
  return definition;
}

export function getTemplate(id: string): TemplateDefinition {
  const template = registry.get(id);
  if (!template) {
    throw new Error(`Unknown notification template "${id}"`);
  }
  return template;
}

export function renderTemplate(
  id: string,
  channel: Channel,
  rawData: unknown,
): RenderedNotification {
  const template = getTemplate(id);
  const data = template.dataSchema.parse(rawData);
  const render = template.renderForChannel?.[channel] ?? template.render;
  return render(data);
}
