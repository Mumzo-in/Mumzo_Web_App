import type { RenderedNotification } from "../../core/types";
import {
  toPositionalParams,
  WHATSAPP_TEMPLATE,
  type WhatsAppTemplateKey,
  type WhatsAppTemplateParams,
} from "./templates";

/**
 * Builds the `RenderedNotification` a WhatsApp send needs.
 *
 * WhatsApp doesn't take a title/body — Meta stores the approved copy and
 * accepts only the variable slots. So the rendered payload carries the
 * template key and its positional parameters in `data`, and `title`/`body`
 * exist purely so the shape stays compatible with the shared
 * `RenderedNotification` contract (and so logs show something readable).
 *
 * Parameters are validated here, at render time, rather than at send time:
 * a missing or empty parameter then fails while the job is being built,
 * with the template and field named, instead of surfacing as an opaque
 * provider rejection inside the worker.
 */
export function whatsappRender<K extends WhatsAppTemplateKey>(
  key: K,
  params: WhatsAppTemplateParams<K>,
  options: {
    /** Parameters for a dynamic URL button, when the template has one. */
    buttonParams?: string[];
    /** Human-readable summary for logs and the admin playground. */
    summary?: string;
  } = {},
): RenderedNotification {
  const definition = WHATSAPP_TEMPLATE[key];
  const positional = toPositionalParams(key, params);

  return {
    title: definition.name,
    body: options.summary ?? positional.join(" · "),
    data: {
      whatsappTemplate: key,
      // `data` is a flat string map, so the ordered parameters travel as
      // JSON rather than as `param1`, `param2`, … keys that the adapter
      // would have to re-sort numerically.
      whatsappParams: JSON.stringify(positional),
      ...(options.buttonParams?.length
        ? { whatsappButtonParams: JSON.stringify(options.buttonParams) }
        : {}),
    },
  };
}
