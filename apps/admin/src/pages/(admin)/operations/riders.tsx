import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { queryKeys } from "@/core/api/query-keys";
import {
  listRiders,
  type Rider,
  RiderFormDialog,
  RidersTable,
} from "@/modules/riders";

export const Route = createFileRoute("/(admin)/operations/riders")({
  component: RidersPage,
});

function RidersPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rider | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.riders.list({ search }),
    queryFn: () => listRiders({ search, limit: 100 }),
  });

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(rider: Rider) {
    setEditing(rider);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-editorial text-2xl tracking-tighter">
            Delivery partners
          </h1>
          <p className="text-muted-foreground text-sm">
            Riders who take orders out. Each gets a delivery code automatically
            — share it with them to unlock their delivery links.
          </p>
        </div>
        <Button onClick={openNew} data-testid="rider-add">
          <Plus data-icon />
          Add rider
        </Button>
      </div>

      <Input
        placeholder="Search by name or phone…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
        data-testid="riders-search"
      />

      <RidersTable
        riders={data?.data ?? []}
        isLoading={isLoading}
        onEdit={openEdit}
      />

      <RiderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        rider={editing}
      />
    </div>
  );
}
