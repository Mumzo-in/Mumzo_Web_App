import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";

export const Route = createFileRoute("/(store)/contact")({
  component: ContactPage,
});

const DETAILS = [
  {
    icon: Mail,
    label: "Email",
    value: "care@mumzo.in",
    href: "mailto:care@mumzo.in",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+91 40 1234 5678",
    href: "tel:+914012345678",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "Banjara Hills, Hyderabad — 500034",
  },
  { icon: Clock, label: "Support hours", value: "Every day · 7 AM – 11 PM" },
];

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Thanks! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="mx-auto max-w-[960px] px-4 pt-8 pb-20">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Contact" }]} />

      <div className="mb-8">
        <h1 className="font-editorial text-4xl text-ink leading-none tracking-tight sm:text-5xl">
          Get in touch
        </h1>
        <p className="mt-3 text-foreground/60 leading-relaxed">
          We're here to help with orders, deliveries, and anything baby.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-3">
          {DETAILS.map((d) => {
            const Icon = d.icon;
            const inner = (
              <div className="flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/40 text-primary">
                  <Icon size={19} />
                </span>
                <div>
                  <p className="font-semibold text-[11px] text-foreground/50 uppercase tracking-widest">
                    {d.label}
                  </p>
                  <p className="mt-0.5 font-semibold text-ink text-sm">
                    {d.value}
                  </p>
                </div>
              </div>
            );
            return d.href ? (
              <a key={d.label} href={d.href} className="block">
                {inner}
              </a>
            ) : (
              <div key={d.label}>{inner}</div>
            );
          })}
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-6"
        >
          <h2 className="flex items-center gap-2 font-editorial text-ink text-xl">
            <MessageCircle size={18} className="text-primary" />
            Send us a message
          </h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-name">Your name</Label>
            <Input
              id="c-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ananya"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-email">Email</Label>
            <Input
              id="c-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-message">Message</Label>
            <textarea
              id="c-message"
              rows={4}
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              placeholder="How can we help?"
              className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-ring"
            />
          </div>
          <Button type="submit" className="rounded-full">
            Send message
          </Button>
        </form>
      </div>
    </div>
  );
}
