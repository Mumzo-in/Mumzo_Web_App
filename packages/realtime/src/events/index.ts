// Every event module must be imported here as a side effect so `defineEvent`
// runs and populates the registry — importing this module (rather than a
// specific event file) is what guarantees an event is registered before
// `publish`/`getEvent` are called. Same pattern as
// `@mumzo/notifications`' `templates/index.ts`.
import "./orders";

export { defineEvent, getEvent } from "../core/registry";
export { orderCreatedEvent, orderStatusUpdatedEvent } from "./orders";
