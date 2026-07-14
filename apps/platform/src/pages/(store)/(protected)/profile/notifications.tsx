import { Switch } from "@mumzo/ui/components/switch";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  NOTIF_CATEGORIES,
  NOTIF_CHANNELS,
  usePreferences,
} from "@/modules/account";

export const Route = createFileRoute(
  "/(store)/(protected)/profile/notifications",
)({
  component: NotificationSettingsPage,
});

function NotificationSettingsPage() {
  const { prefs, toggle } = usePreferences();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Account", to: "/profile" },
          { label: "Notification settings" },
        ]}
      />

      <div className="mb-6">
        <h1 className="font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
          Notification settings
        </h1>
        <p className="mt-2 text-foreground/60 text-sm">
          Choose how you'd like to hear from us for each type of update.
        </p>
      </div>

      <div className="flex max-w-2xl flex-col gap-4">
        {NOTIF_CATEGORIES.map((cat) => (
          <section
            key={cat.key}
            className="rounded-3xl border border-border/60 bg-white p-5"
          >
            <div className="mb-4">
              <p className="font-semibold text-ink text-sm">{cat.label}</p>
              <p className="text-foreground/55 text-xs">{cat.desc}</p>
            </div>
            <div className="flex flex-col gap-3">
              {NOTIF_CHANNELS.map((ch) => (
                <div
                  key={ch.key}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <span className="text-foreground/80 text-sm">{ch.label}</span>
                  <Switch
                    checked={prefs[cat.key][ch.key]}
                    onCheckedChange={() => toggle(cat.key, ch.key)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        <p className="flex items-start gap-2 rounded-2xl bg-secondary/60 px-4 py-3 text-foreground/60 text-xs leading-relaxed">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
          Order updates are transactional and always on for delivery. Marketing
          consent for offers can be withdrawn any time here or in Privacy &
          data.
        </p>
      </div>
    </div>
  );
}
