import { Alert, AlertDescription } from "@mumzo/ui/components/alert";
import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { RegisteredDevice, TemplateInfo } from "../api/notifications-api";
import { sendTestNotification } from "../api/notifications-api";

/** Plausible defaults per field name, so a test send is one click rather
 * than filling six boxes. Mirrors the server's preview samples. */
const SAMPLE_VALUES: Record<string, string> = {
  orderId: "a1b2c3d4e5f6",
  total: "499",
  addressName: "Test Customer",
  hubId: "test-hub",
  status: "packed",
  fromStatus: "confirmed",
  toStatus: "packed",
  outcome: "delivered",
  riderName: "Test Rider",
  reason: "",
  tierName: "Gold",
  amount: "100",
};

type PlaygroundProps = {
  templates: TemplateInfo[] | undefined;
  isLoading: boolean;
  devices: RegisteredDevice[] | undefined;
  selectedDevice: RegisteredDevice | null;
  onSent: () => void;
};

export function NotificationPlayground({
  templates,
  isLoading,
  devices,
  selectedDevice,
  onSent,
}: PlaygroundProps) {
  const [templateId, setTemplateId] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});

  const activeDevices = useMemo(
    () => devices?.filter((device) => device.isActive) ?? [],
    [devices],
  );

  // A "Send" click in the registry pre-selects that device here, so the
  // two panels act as one flow rather than two disconnected forms.
  useEffect(() => {
    if (selectedDevice) setDeviceId(selectedDevice.id);
  }, [selectedDevice]);

  useEffect(() => {
    if (!templateId && templates && templates.length > 0) {
      setTemplateId(templates[0].id);
    }
  }, [templates, templateId]);

  const template = templates?.find((item) => item.id === templateId);

  // Reset the form to sample values whenever the template changes —
  // carrying stale fields across templates produces schema errors that
  // look like bugs.
  useEffect(() => {
    if (!template) return;
    const next: Record<string, string> = {};
    for (const field of template.fields) {
      next[field.name] = SAMPLE_VALUES[field.name] ?? "";
    }
    setValues(next);
  }, [template]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!template) throw new Error("No template selected");

      // Coerce to the types the template's Zod schema expects — every
      // input is a string, but `total`/`amount` are numbers.
      //
      // Empty handling differs by field kind, and conflating the two is a
      // validation error: an *optional* field is dropped entirely, while a
      // *nullable* one must still be present carrying an explicit null.
      const data: Record<string, unknown> = {};
      for (const field of template.fields) {
        const raw = values[field.name] ?? "";

        if (raw === "") {
          if (field.optional) continue;
          if (field.nullable) {
            data[field.name] = null;
            continue;
          }
        }

        data[field.name] = field.type.includes("number") ? Number(raw) : raw;
      }

      return sendTestNotification({
        templateId: template.id,
        deviceId: deviceId || undefined,
        data,
      });
    },
    onSuccess: (result) => {
      toast.success("Notification queued", { description: result.message });
      onSent();
    },
    onError: (error: Error) => {
      toast.error("Send failed", { description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
          <CardDescription>
            Sends through the real queue and the real FCM adapter — a success
            here means the production path works.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="template">Template</FieldLabel>
              <Select
                value={templateId}
                onValueChange={(value) => setTemplateId(value ?? "")}
              >
                <SelectTrigger id="template" data-testid="playground-template">
                  <SelectValue placeholder="Pick a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {templates?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="device">Target</FieldLabel>
              <Select
                value={deviceId || "self"}
                onValueChange={(value) =>
                  setDeviceId(!value || value === "self" ? "" : value)
                }
              >
                <SelectTrigger id="device" data-testid="playground-device">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="self">My own devices</SelectItem>
                    {activeDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.ownerName ?? device.ownerId.slice(0, 10)} ·{" "}
                        {device.app}/{device.platform}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {template?.fields.map((field) => (
              <Field key={field.name}>
                <FieldLabel htmlFor={field.name}>
                  {field.name}
                  <span className="ml-2 text-muted-foreground text-xs">
                    {field.type}
                    {field.optional ? " · optional" : ""}
                    {field.nullable ? " · nullable" : ""}
                  </span>
                </FieldLabel>
                <Input
                  id={field.name}
                  value={values[field.name] ?? ""}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.name]: event.target.value,
                    }))
                  }
                  data-testid={`playground-field-${field.name}`}
                />
              </Field>
            ))}

            <Button
              onClick={() => mutation.mutate()}
              disabled={!template || mutation.isPending}
              data-testid="playground-send"
            >
              <Send data-icon />
              {mutation.isPending ? "Sending…" : "Send test notification"}
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            How this template reads with sample data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {template ? (
            <>
              <Badge variant="secondary" className="w-fit">
                {template.audience}
              </Badge>
              <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-4">
                <p className="font-medium">{template.preview.title}</p>
                <p className="text-muted-foreground text-sm">
                  {template.preview.body}
                </p>
                {template.preview.deeplink ? (
                  <p className="mt-2 font-mono text-muted-foreground text-xs">
                    → {template.preview.deeplink}
                  </p>
                ) : null}
              </div>
              {activeDevices.length === 0 ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    No active devices — a send will queue but reach nobody.
                    Accept the notification prompt in the admin panel first.
                  </AlertDescription>
                </Alert>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Pick a template to see its preview.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
