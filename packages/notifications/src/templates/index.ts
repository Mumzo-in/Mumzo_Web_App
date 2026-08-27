// Every template module must be imported here as a side effect so
// `defineTemplate` runs and populates the registry — importing this module
// (rather than the top-level package barrel) is what guarantees templates
// are registered before `getTemplate`/`renderTemplate` are called.
import "./admin-delivery-completed";
import "./admin-order-cancelled";
import "./admin-order-status-updated";
import "./order-created";
import "./order-status-updated";
import "./referral-coupon-issued";
import "./review-prompt-requested";

export {
  defineTemplate,
  getTemplate,
  listTemplates,
  renderTemplate,
} from "./registry";
