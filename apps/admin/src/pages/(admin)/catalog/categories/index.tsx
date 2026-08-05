import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import PageHeader from "@/core/components/page-header";
import { CategoryList } from "@/modules/category";

export const Route = createFileRoute("/(admin)/catalog/categories/")({
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categories"
        description="Taxonomy and merchandising order."
        actions={
          <Button
            data-testid="admin-categories-new"
            render={<Link to="/catalog/categories/new" />}
          >
            <Plus data-icon="inline-start" />
            New category
          </Button>
        }
      />
      <CategoryList />
    </>
  );
}
