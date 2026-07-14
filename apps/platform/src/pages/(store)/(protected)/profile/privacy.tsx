import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@mumzo/ui/components/dialog";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { Switch } from "@mumzo/ui/components/switch";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Download,
  LifeBuoy,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  CONSENT_PURPOSES,
  useAddresses,
  useConsent,
  useProfile,
} from "@/modules/account";

export const Route = createFileRoute("/(store)/(protected)/profile/privacy")({
  component: PrivacyDataPage,
});

const NOMINEE_KEY = "mumzo_nominee_v1";

function Card({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Download;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/60 bg-white p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/40 text-primary">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="font-editorial text-ink text-lg">{title}</h2>
          <p className="text-foreground/55 text-xs leading-relaxed">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PrivacyDataPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { addresses } = useAddresses();
  const { consents, setConsent } = useConsent();

  const [nominee, setNominee] = useState(() => {
    try {
      const raw = localStorage.getItem(NOMINEE_KEY);
      return raw
        ? (JSON.parse(raw) as { name: string; relation: string; phone: string })
        : { name: "", relation: "", phone: "" };
    } catch {
      return { name: "", relation: "", phone: "" };
    }
  });

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ profile, addresses, consents }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mumzo-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Your data export has started");
  };

  const saveNominee = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(NOMINEE_KEY, JSON.stringify(nominee));
    toast.success("Nominee saved");
  };

  const deleteAccount = () => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("mumzo_")) localStorage.removeItem(key);
    }
    toast.success("Account deletion requested");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Account", to: "/profile" },
          { label: "Privacy & data" },
        ]}
      />

      <div className="mb-6">
        <h1 className="font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
          Privacy & data
        </h1>
        <p className="mt-2 text-foreground/60 text-sm">
          Your data, your rights — manage consents and exercise your choices
          under the DPDP Act.
        </p>
      </div>

      <div className="grid max-w-3xl gap-4">
        <Card
          icon={ShieldCheck}
          title="Manage consents"
          desc="Turn any purpose on or off — withdrawing is as easy as granting."
        >
          <div className="flex flex-col gap-4">
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
        </Card>

        <Card
          icon={Download}
          title="Download my data"
          desc="Get a copy of your profile, addresses and consent records."
        >
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={exportData}
          >
            <Download size={15} />
            Export my data
          </Button>
        </Card>

        <Card
          icon={UserPlus}
          title="Nominee"
          desc="Name someone to exercise your rights if you're unable to (DPDP §14)."
        >
          <form onSubmit={saveNominee} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="n-name">Name</Label>
                <Input
                  id="n-name"
                  value={nominee.name}
                  onChange={(e) =>
                    setNominee((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="n-rel">Relationship</Label>
                <Input
                  id="n-rel"
                  value={nominee.relation}
                  onChange={(e) =>
                    setNominee((p) => ({ ...p, relation: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="n-phone">Phone</Label>
                <Input
                  id="n-phone"
                  value={nominee.phone}
                  onChange={(e) =>
                    setNominee((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <Button type="submit" className="self-start rounded-full">
              Save nominee
            </Button>
          </form>
        </Card>

        <Card
          icon={LifeBuoy}
          title="Grievance redressal"
          desc="Concerns about your data? Our Grievance Officer responds within 30 days."
        >
          <div className="text-foreground/70 text-sm leading-relaxed">
            <p className="font-semibold text-ink">Grievance Officer</p>
            <p>Mumzo Retail Pvt. Ltd., Banjara Hills, Hyderabad</p>
            <p>
              Email:{" "}
              <a
                href="mailto:grievance@mumzo.in"
                className="text-primary underline"
              >
                grievance@mumzo.in
              </a>
            </p>
            <Link
              to="/contact"
              className="mt-3 inline-block rounded-full border border-border px-4 py-2 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
            >
              Raise a grievance
            </Link>
          </div>
        </Card>

        <Card
          icon={Trash2}
          title="Delete my account"
          desc="Permanently remove your account and personal data."
        >
          <Dialog>
            <DialogTrigger className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-destructive/30 px-4 py-2 font-semibold text-destructive text-sm transition-colors hover:bg-destructive/10">
              <Trash2 size={15} />
              Delete account
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-3xl p-6">
              <DialogTitle className="mb-2 font-editorial text-ink text-xl">
                Delete your account?
              </DialogTitle>
              <p className="mb-5 text-foreground/60 text-sm leading-relaxed">
                This permanently deletes your profile, addresses, orders and
                saved data. This action can't be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={deleteAccount}
                  className="flex-1 cursor-pointer rounded-full bg-destructive py-3 font-semibold text-destructive-foreground text-sm transition-colors hover:bg-destructive/90"
                >
                  Yes, delete
                </button>
                <DialogClose className="flex-1 cursor-pointer rounded-full border border-border py-3 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary">
                  Cancel
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </div>
  );
}
