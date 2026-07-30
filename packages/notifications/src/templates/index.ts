// Every template module must be imported here as a side effect so
// `defineTemplate` runs and populates the registry — importing this module
// (rather than the top-level package barrel) is what guarantees templates
// are registered before `getTemplate`/`renderTemplate` are called.
import "./order-created";
import "./order-status-updated";

export { defineTemplate, getTemplate, renderTemplate } from "./registry";
