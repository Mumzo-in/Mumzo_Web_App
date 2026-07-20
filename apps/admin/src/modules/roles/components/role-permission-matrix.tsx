import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import { Checkbox } from "@mumzo/ui/components/checkbox";
import { Separator } from "@mumzo/ui/components/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PermissionCatalog, StaffRole } from "../api/roles-api";
import { setRolePermissions } from "../api/roles-api";
import { usePermission } from "../hooks/use-permission";
import { rolesQueryKeys } from "../queries/roles";

type Props = {
  role: StaffRole;
  catalog: PermissionCatalog;
};

/** `"product:create"` — flattening makes the checkbox state a simple Set. */
const grantKey = (resource: string, action: string) => `${resource}:${action}`;

function toGrantSet(permissions: StaffRole["permissions"]) {
  const set = new Set<string>();

  for (const [resource, actions] of Object.entries(permissions)) {
    for (const action of actions) {
      set.add(grantKey(resource, action));
    }
  }

  return set;
}

export function RolePermissionMatrix({ role, catalog }: Props) {
  const queryClient = useQueryClient();
  const canEdit = usePermission("staff", "update");
  const [granted, setGranted] = useState(() => toGrantSet(role.permissions));

  // Re-seed when the selected role changes, or after a save round-trips.
  useEffect(() => {
    setGranted(toGrantSet(role.permissions));
  }, [role.permissions]);

  const mutation = useMutation({
    mutationFn: () => {
      const permissions: Record<string, string[]> = {};

      for (const key of granted) {
        const [resource, action] = key.split(":");
        if (resource && action) {
          permissions[resource] = [...(permissions[resource] ?? []), action];
        }
      }

      return setRolePermissions(role.id, permissions);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKeys.all });
      toast.success(`Saved permissions for ${role.label}.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not save permissions.");
    },
  });

  // Superadmin is locked server-side; reflect that rather than letting the
  // user edit and then hit a 409.
  const locked = role.key === "superadmin" || !canEdit;

  const dirty =
    granted.size !== toGrantSet(role.permissions).size ||
    [...granted].some((key) => !toGrantSet(role.permissions).has(key));

  const toggle = (resource: string, action: string) => {
    setGranted((current) => {
      const next = new Set(current);
      const key = grantKey(resource, action);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6" data-testid="role-permission-matrix">
      {locked ? (
        <div className="flex items-center gap-2 rounded-2xl bg-secondary p-4 text-muted-foreground text-sm">
          <Lock data-icon="inline-start" />
          {role.key === "superadmin"
            ? "Super Admin always has full access — changing it could lock everyone out of the panel."
            : "You do not have permission to edit roles."}
        </div>
      ) : null}

      <div className="flex flex-col gap-5">
        {catalog.resources.map((resource) => (
          <div className="flex flex-col gap-3" key={resource.key}>
            <div className="flex items-baseline gap-3">
              <h3 className="font-medium text-sm">{resource.label}</h3>
              <Separator className="flex-1" />
            </div>

            <div className="flex flex-wrap gap-2">
              {resource.actions.map((action) => {
                const key = grantKey(resource.key, action.key);
                const checked = granted.has(key);

                return (
                  <label
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
                    htmlFor={key}
                    key={key}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={locked}
                      id={key}
                      onCheckedChange={() => toggle(resource.key, action.key)}
                    />
                    {action.label}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {locked ? null : (
        <div className="flex items-center gap-3">
          <Button
            data-testid="save-permissions"
            disabled={!dirty || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>

          {dirty ? <Badge variant="secondary">Unsaved changes</Badge> : null}
        </div>
      )}
    </div>
  );
}
