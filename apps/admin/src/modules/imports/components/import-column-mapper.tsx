import { Button } from "@mumzo/ui/components/button";
import { Card, CardContent } from "@mumzo/ui/components/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  IMPORT_FIELD_LABELS,
  IMPORT_TARGET_FIELDS,
  type ImportTargetField,
} from "../api/imports-api";

const REQUIRED_FIELDS: ImportTargetField[] = [
  "productKey",
  "name",
  "brandName",
  "categoryName",
  "variantLabel",
  "variantSku",
  "variantPrice",
  "variantMrp",
  "variantQty",
];

const IGNORE = "__ignore__";

/** Step 2 — match each detected sheet column to a target product field.
 * Pre-filled from the server's suggested mapping; the admin adjusts any
 * column it got wrong or left unmapped. */
export default function ImportColumnMapper({
  headers,
  suggestedMapping,
  sampleRows,
  onConfirm,
  onBack,
  pending,
}: {
  headers: string[];
  suggestedMapping: Record<string, string>;
  sampleRows: Record<string, string>[];
  onConfirm: (mapping: Record<string, ImportTargetField>) => void;
  onBack: () => void;
  pending: boolean;
}) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => ({
    ...suggestedMapping,
  }));

  const mappedTargets = new Set(Object.values(mapping).filter(Boolean));
  const missingRequired = REQUIRED_FIELDS.filter(
    (field) => !mappedTargets.has(field),
  );

  const confirm = () => {
    const confirmed: Record<string, ImportTargetField> = {};
    for (const [header, target] of Object.entries(mapping)) {
      if (target && target !== IGNORE) {
        confirmed[header] = target as ImportTargetField;
      }
    }
    onConfirm(confirmed);
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Your column</TableHead>
                <TableHead>Maps to</TableHead>
                <TableHead>Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {headers.map((header) => (
                <TableRow key={header}>
                  <TableCell className="font-medium">{header}</TableCell>
                  <TableCell>
                    <Select
                      value={mapping[header] || IGNORE}
                      onValueChange={(value) =>
                        setMapping((prev) => ({
                          ...prev,
                          [header]: value ?? IGNORE,
                        }))
                      }
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Not mapped" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={IGNORE}>
                            Ignore this column
                          </SelectItem>
                          {IMPORT_TARGET_FIELDS.map((field) => (
                            <SelectItem key={field} value={field}>
                              {IMPORT_FIELD_LABELS[field]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-muted-foreground text-xs">
                    {sampleRows[0]?.[header] ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {missingRequired.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 p-3 text-amber-900 text-xs">
            <AlertTriangle className="mt-0.5 shrink-0" size={14} />
            <p>
              Required field(s) not mapped yet:{" "}
              {missingRequired
                .map((field) => IMPORT_FIELD_LABELS[field])
                .join(", ")}
              .
            </p>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} disabled={pending}>
            Back
          </Button>
          <Button
            data-testid="import-validate-button"
            disabled={missingRequired.length > 0 || pending}
            onClick={confirm}
          >
            {pending ? "Validating…" : "Validate rows"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
