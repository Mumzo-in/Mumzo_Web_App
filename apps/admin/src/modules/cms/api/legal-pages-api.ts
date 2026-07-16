import { mockDetail } from "@/core/api/mock";
import {
  findLegalPage,
  type LegalPage,
  legalPages,
} from "../data/legal-page-data";

/** Legal/static pages. No §15 endpoint yet — needs an API spec. */
export function listLegalPages(): Promise<LegalPage[]> {
  return mockDetail(legalPages);
}

export function getLegalPage(slug: string): Promise<LegalPage> {
  return mockDetail(findLegalPage(slug));
}
