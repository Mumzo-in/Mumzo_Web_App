import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@mumzo/ui/components/breadcrumb";
import { Link, useRouterState } from "@tanstack/react-router";
import { Fragment } from "react";
import { allNavItems, NAV_SECTIONS, sectionForPath } from "./nav-data";

/**
 * Section → page trail, derived from the nav data rather than the URL, so
 * labels read the way the nav names them ("Failed & pending", not "failed").
 *
 * Detail routes (/products/prd_001) have no nav entry; they fall back to their
 * closest listed ancestor, so the trail still says Catalog → All products.
 */
export function AdminBreadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const sectionId = sectionForPath(pathname);
  const section = NAV_SECTIONS.find((s) => s.id === sectionId);

  // Longest matching nav item — the page itself, or its nearest ancestor.
  const match = allNavItems()
    .filter(({ item }) =>
      item.to === "/"
        ? pathname === "/"
        : pathname === item.to || pathname.startsWith(`${item.to}/`),
    )
    .sort((a, b) => b.item.to.length - a.item.to.length)[0];

  if (!section) {
    return null;
  }

  const isExactPage = match?.item.to === pathname;

  const trail = [
    { label: section.label, to: section.to },
    ...(match ? [{ label: match.item.label, to: match.item.to }] : []),
  ];

  const hasDetailCrumb = match && !isExactPage;

  return (
    <Breadcrumb data-testid="admin-breadcrumbs">
      <BreadcrumbList>
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1 && !hasDetailCrumb;
          return (
            <Fragment key={crumb.to}>
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={crumb.to} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {last ? null : <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
        {/* A detail page isn't in the nav — mark that we're one level deeper. */}
        {hasDetailCrumb ? (
          <BreadcrumbItem>
            <BreadcrumbPage>Detail</BreadcrumbPage>
          </BreadcrumbItem>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default AdminBreadcrumbs;
