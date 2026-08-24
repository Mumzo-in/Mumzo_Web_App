import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { Download } from "lucide-react";
import { useState } from "react";
import type {
  ResolveDecision,
  RowError,
  UnresolvedName,
} from "../api/imports-api";

type Choice = "create" | "link" | "skip";

function NameRow({
  item,
  onDecision,
}: {
  item: UnresolvedName;
  onDecision: (decision: ResolveDecision) => void;
}) {
  const [choice, setChoice] = useState<Choice>(
    item.suggestions.length > 0 ? "link" : "create",
  );
  const [linkedId, setLinkedId] = useState(item.suggestions[0]?.id ?? "");

  const commit = (nextChoice: Choice, nextLinkedId: string) => {
    if (nextChoice === "create") {
      onDecision({ action: "create", name: item.name });
    } else if (nextChoice === "link" && nextLinkedId) {
      onDecision({ action: "link", name: item.name, id: nextLinkedId });
    } else {
      onDecision({ action: "skip", name: item.name });
    }
  };

  return (
    <div
      className="flex flex-col gap-2 border-border/60 border-b py-3 last:border-0"
      data-testid={`import-unresolved-${item.name}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-sm">"{item.name}"</p>
        <Badge variant="outline">
          {item.rowCount} row{item.rowCount === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            checked={choice === "create"}
            onChange={() => {
              setChoice("create");
              commit("create", linkedId);
            }}
          />
          Create new
        </label>

        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              checked={choice === "link"}
              disabled={item.suggestions.length === 0}
              onChange={() => {
                setChoice("link");
                commit("link", linkedId);
              }}
            />
            Link to existing
          </label>
          {item.suggestions.length > 0 && (
            <Select
              value={linkedId}
              onValueChange={(value) => {
                if (!value) return;
                setLinkedId(value);
                setChoice("link");
                commit("link", value);
              }}
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Pick one" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {item.suggestions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>

        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            checked={choice === "skip"}
            onChange={() => {
              setChoice("skip");
              commit("skip", linkedId);
            }}
          />
          Skip — leave unlinked
        </label>
      </div>
    </div>
  );
}

/** Step 3 — surfaced only when validation found brand/category names that
 * don't exist yet. Nothing is created until the admin explicitly picks
 * create/link/skip per name; a "skip" blocks only the rows using that name,
 * not the whole batch. */
export default function ImportResolvePanel({
  unresolvedBrands,
  unresolvedCategories,
  rowErrors,
  readyProductCount,
  onDecisionsChange,
  onBack,
  onContinue,
  pending,
}: {
  unresolvedBrands: UnresolvedName[];
  unresolvedCategories: UnresolvedName[];
  rowErrors: RowError[];
  readyProductCount: number;
  onDecisionsChange: (decisions: {
    brandDecisions: ResolveDecision[];
    categoryDecisions: ResolveDecision[];
  }) => void;
  onBack: () => void;
  onContinue: () => void;
  pending: boolean;
}) {
  const [brandDecisions, setBrandDecisions] = useState<
    Map<string, ResolveDecision>
  >(new Map());
  const [categoryDecisions, setCategoryDecisions] = useState<
    Map<string, ResolveDecision>
  >(new Map());

  const updateBrand = (decision: ResolveDecision) => {
    setBrandDecisions((prev) => {
      const next = new Map(prev).set(decision.name, decision);
      onDecisionsChange({
        brandDecisions: [...next.values()],
        categoryDecisions: [...categoryDecisions.values()],
      });
      return next;
    });
  };

  const updateCategory = (decision: ResolveDecision) => {
    setCategoryDecisions((prev) => {
      const next = new Map(prev).set(decision.name, decision);
      onDecisionsChange({
        brandDecisions: [...brandDecisions.values()],
        categoryDecisions: [...next.values()],
      });
      return next;
    });
  };

  const allDecided =
    brandDecisions.size === unresolvedBrands.length &&
    categoryDecisions.size === unresolvedCategories.length;

  return (
    <div className="flex flex-col gap-4">
      {unresolvedBrands.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unresolved brands ({unresolvedBrands.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {unresolvedBrands.map((item) => (
              <NameRow key={item.name} item={item} onDecision={updateBrand} />
            ))}
          </CardContent>
        </Card>
      )}

      {unresolvedCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Unresolved categories ({unresolvedCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unresolvedCategories.map((item) => (
              <NameRow
                key={item.name}
                item={item}
                onDecision={updateCategory}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {rowErrors.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Row errors ({rowErrors.length})</CardTitle>
            <Button variant="outline" size="sm" disabled>
              <Download className="mr-1.5" size={14} />
              Download report
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {rowErrors.slice(0, 10).map((e) => (
              <p key={`${e.rowNumber}-${e.message}`}>
                Row {e.rowNumber} — {e.message}
              </p>
            ))}
            {rowErrors.length > 10 && (
              <p className="text-muted-foreground text-xs">
                +{rowErrors.length - 10} more — see the full report after
                import.
              </p>
            )}
            <p className="mt-2 text-muted-foreground text-xs">
              These rows will be skipped. Everything else can still import.
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground text-sm">
        {readyProductCount} product{readyProductCount === 1 ? "" : "s"} ready to
        import right now — resolving names above may unblock more.
      </p>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={pending}>
          Back
        </Button>
        <Button
          data-testid="import-start-button"
          disabled={!allDecided || pending}
          onClick={onContinue}
        >
          {pending ? "Applying…" : "Start import"}
        </Button>
      </div>
    </div>
  );
}
