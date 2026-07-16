import { mockDetail } from "@/core/api/mock";
import {
  type DashboardSummary,
  dashboardSummary,
} from "../data/dashboard-data";

/**
 * Dashboard API — api-plan §15a.
 * Swaps to `apiRequest<DashboardSummary>("/dashboard")` when the endpoint lands.
 */
export function getDashboard(): Promise<DashboardSummary> {
  return mockDetail(dashboardSummary);
}
