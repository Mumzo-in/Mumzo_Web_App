import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { Switch } from "@mumzo/ui/components/switch";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { CONSENT_PURPOSES, useConsent } from "../store/consent-provider";

/**
 * DPDP cookie/tracking consent banner. Shows until the user makes an explicit
 * choice (accept all / reject all / save granular preferences). Analytics and
 * marketing should only load once the matching consent is granted.
 */
export default function ConsentBanner() {
  const { decided, consents, setConsent, acceptAll, rejectAll } = useConsent();
  const [managing, setManaging] = useState(false);

  if (decided) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5 shadow-warm sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-accent/40 text-primary">
              <ShieldCheck size={18} />
            </span>
            <p className="text-foreground/70 text-sm leading-relaxed">
              We use cookies and similar tech for essential features, analytics
              and personalisation. You choose what to allow. Read our{" "}
              <Link to="/legal/privacy" className="text-primary underline">
                Privacy Notice
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setManaging(true)}
              className="cursor-pointer rounded-full border border-border px-4 py-2 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
            >
              Manage
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="cursor-pointer rounded-full border border-border px-4 py-2 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
            >
              Reject all
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="cursor-pointer rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>

      <Dialog open={managing} onOpenChange={setManaging}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-3xl p-6">
          <DialogTitle className="mb-1 font-editorial text-ink text-xl">
            Manage preferences
          </DialogTitle>
          <p className="mb-5 text-foreground/55 text-sm">
            Essential cookies are always on. Choose what else you allow.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4 opacity-70">
              <span>
                <span className="block font-semibold text-ink text-sm">
                  Essential
                </span>
                <span className="block text-foreground/55 text-xs leading-relaxed">
                  Required to run the app, cart and checkout.
                </span>
              </span>
              <Switch checked disabled />
            </div>
            {CONSENT_PURPOSES.map((p) => (
              <div
                key={p.key}
                className="flex cursor-pointer items-start justify-between gap-4"
              >
                <span>
                  <span className="block font-semibold text-ink text-sm">
                    {p.label}
                  </span>
                  <span className="block text-foreground/55 text-xs leading-relaxed">
                    {p.desc}
                  </span>
                </span>
                <Switch
                  checked={consents[p.key].granted}
                  onCheckedChange={(v) => setConsent(p.key, v)}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setManaging(false)}
            className="mt-6 w-full cursor-pointer rounded-full bg-primary py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
          >
            Save preferences
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
