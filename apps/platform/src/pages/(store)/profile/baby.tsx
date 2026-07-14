import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { Slider } from "@mumzo/ui/components/slider";
import { createFileRoute } from "@tanstack/react-router";
import {
  Baby as BabyIcon,
  Cake,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  ageInMonths,
  ageLabel,
  type Baby,
  type BabyGender,
  milestoneFor,
  milestoneForMonths,
  monthsLabel,
  monthsToDob,
  seedBabies,
} from "@/modules/account";

const MAX_AGE_MONTHS = 60;

export const Route = createFileRoute("/(store)/profile/baby")({
  component: BabyProfilePage,
});

const GENDERS: { value: BabyGender; label: string }[] = [
  { value: "girl", label: "Girl" },
  { value: "boy", label: "Boy" },
  { value: "other", label: "Prefer not to say" },
];

function BabyProfilePage() {
  const [babies, setBabies] = useState<Baby[]>(seedBabies);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Baby | null>(null);

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (baby: Baby) => {
    setEditing(baby);
    setOpen(true);
  };

  const save = (draft: Omit<Baby, "id">) => {
    if (editing) {
      setBabies((prev) =>
        prev.map((b) => (b.id === editing.id ? { ...draft, id: b.id } : b)),
      );
      toast.success("Baby profile updated");
    } else {
      setBabies((prev) => [...prev, { ...draft, id: `baby_${Date.now()}` }]);
      toast.success("Baby profile added");
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setBabies((prev) => prev.filter((b) => b.id !== id));
    toast.success("Baby profile removed");
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Account", to: "/profile" },
          { label: "Baby profiles" },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
            Baby profiles
          </h1>
          <p className="mt-2 text-foreground/60 text-sm">
            Tell us their age and we'll tailor recommendations for each stage.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
        >
          <Plus size={15} />
          Add baby
        </button>
      </div>

      {babies.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-white py-20 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-primary/10 bg-accent/20">
            <BabyIcon size={28} className="text-primary" />
          </div>
          <p className="font-editorial text-2xl text-ink">No profiles yet</p>
          <p className="mt-2 text-foreground/60 text-sm">
            Add your little one to get age-based picks.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {babies.map((baby) => (
            <div
              key={baby.id}
              className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/40 text-primary">
                  <BabyIcon size={22} />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-ink">{baby.name}</p>
                  <p className="text-foreground/60 text-sm">
                    {ageLabel(baby.dob)} old
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(baby)}
                    aria-label="Edit"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border text-foreground/60 transition-colors hover:bg-secondary"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(baby.id)}
                    aria-label="Delete"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-destructive/30 text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-4 py-3 text-foreground/70 text-sm">
                <Sparkles size={15} className="shrink-0 text-primary" />
                {milestoneFor(baby.dob)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-3xl p-6">
          <DialogTitle className="mb-1 font-editorial text-ink text-xl">
            {editing ? "Edit baby profile" : "Add baby profile"}
          </DialogTitle>
          <p className="mb-5 text-foreground/55 text-sm">
            Slide to set their age — we'll tailor picks to their stage.
          </p>
          <BabyForm initial={editing ?? undefined} onSubmit={save} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BabyForm({
  initial,
  onSubmit,
}: {
  initial?: Baby;
  onSubmit: (draft: Omit<Baby, "id">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [gender, setGender] = useState<BabyGender>(initial?.gender ?? "girl");
  const [months, setMonths] = useState(() =>
    initial ? ageInMonths(initial.dob) : 6,
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please add a name");
      return;
    }
    onSubmit({ name: name.trim(), gender, dob: monthsToDob(months) });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="baby-name">Name</Label>
        <Input
          id="baby-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Aarav"
          required
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="baby-age" className="flex items-center gap-1.5">
            <Cake size={14} className="text-primary" />
            Age
          </Label>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary text-xs">
            {monthsLabel(months)}
          </span>
        </div>
        <Slider
          id="baby-age"
          min={0}
          max={MAX_AGE_MONTHS}
          value={months}
          onValueChange={(v) => setMonths(Array.isArray(v) ? v[0] : v)}
        />
        <div className="flex justify-between text-[11px] text-foreground/45">
          <span>Newborn</span>
          <span>5 years</span>
        </div>
        <p className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2.5 text-foreground/70 text-xs">
          <Sparkles size={13} className="shrink-0 text-primary" />
          {milestoneForMonths(months)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Gender</Label>
        <div className="flex gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGender(g.value)}
              className={`flex-1 cursor-pointer rounded-full border px-3 py-2 font-semibold text-xs transition-colors ${
                gender === g.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground/70 hover:bg-secondary"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="mt-1 rounded-full">
        Save profile
      </Button>
    </form>
  );
}
