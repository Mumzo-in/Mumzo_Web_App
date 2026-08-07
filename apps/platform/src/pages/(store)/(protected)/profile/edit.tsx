import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { LANGUAGES, type LanguageCode, useProfile } from "@/modules/account";
import { authClient } from "@/modules/auth";

export const Route = createFileRoute("/(store)/(protected)/profile/edit")({
  component: ProfileEditPage,
});

function ProfileEditPage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { data: session } = authClient.useSession();
  const [form, setForm] = useState(() => {
    if (session?.user) {
      const user = session.user;
      const userPhone =
        "phoneNumber" in user && typeof user.phoneNumber === "string"
          ? user.phoneNumber
          : "phone" in user && typeof user.phone === "string"
            ? user.phone
            : "";
      const email =
        user.email && !user.email.endsWith("@phone.mumzo.local")
          ? user.email
          : "";
      return {
        name: user.name || profile.name,
        phone: userPhone || profile.phone,
        email: email,
        language: profile.language,
      };
    }
    return profile;
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    updateProfile(form);
    toast.success("Profile updated");
    navigate({ to: "/profile" });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Account", to: "/profile" },
          { label: "Edit profile" },
        ]}
      />

      <h1 className="mb-6 font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
        Edit profile
      </h1>

      <form
        onSubmit={save}
        className="flex max-w-xl flex-col gap-5 rounded-3xl border border-border/60 bg-white p-6"
      >
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 font-editorial text-2xl text-primary">
            {form.name.charAt(0) || "M"}
          </span>
          <button
            type="button"
            onClick={() => toast.success("Photo upload coming soon")}
            className="cursor-pointer rounded-full border border-border px-4 py-2 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
          >
            Change photo
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-name">Full name</Label>
          <Input
            id="p-name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-phone">Phone</Label>
          <div className="flex gap-2">
            <Input
              id="p-phone"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => navigate({ to: "/auth/login" })}
            >
              Verify
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-email">Email</Label>
          <Input
            id="p-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Language</Label>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, language: l.value as LanguageCode }))
                }
                className={`flex-1 cursor-pointer rounded-full border px-3 py-2 font-semibold text-sm transition-colors ${
                  form.language === l.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground/70 hover:bg-secondary"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="rounded-full">
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => navigate({ to: "/profile" })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
