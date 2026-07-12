import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User, Baby, MapPin, Phone, Mail, Package, Heart, Tag, HelpCircle,
  ChevronRight, Edit3, LogOut, Bell, Sparkles, X, Camera
} from "lucide-react";
import { useCart } from "./CartContext";

const KEY = "mumzo_profile_v1";
const DEFAULTS = {
  momName: "Ananya",
  babyName: "Kabir",
  babyAge: "8 months",
  phone: "+91 98765 43210",
  email: "ananya@mumzo.in",
  address: "Flat 302, Aster Residency, Road No. 12,\nBanjara Hills, Hyderabad 500034",
};

function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export default function Profile() {
  const [profile, setProfile] = useState(loadProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const { items } = useCart();

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(profile));
  }, [profile]);

  const openEdit = () => { setDraft(profile); setEditing(true); };
  const save = () => { setProfile(draft); setEditing(false); };

  const initial = (profile.momName || "M").trim().charAt(0).toUpperCase();

  return (
    <div data-testid="profile-page" className="pb-8">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 bg-gradient-to-b from-blush/60 to-transparent">
        <div className="flex items-center justify-between">
          <h1 className="font-editorial text-2xl">Profile</h1>
          <button className="w-10 h-10 rounded-full bg-white border border-border/60 flex items-center justify-center">
            <Bell size={18} />
          </button>
        </div>
      </header>

      {/* Identity card */}
      <section className="mx-5 rounded-3xl bg-white border border-border/60 p-6" data-testid="profile-identity">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-pinkDeep flex items-center justify-center font-editorial italic text-white text-2xl shadow-[0_10px_25px_rgba(200,82,119,0.35)]">
              {initial}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-border/60 flex items-center justify-center">
              <Camera size={12} className="text-pinkDeep" />
            </button>
          </div>
          <div className="flex-1 leading-tight">
            <p className="text-[10px] uppercase tracking-widest text-pinkDeep font-semibold">Hi mama</p>
            <h2 className="font-editorial text-xl mt-0.5">{profile.momName}</h2>
            <p className="text-sm text-foreground/70 mt-1 font-hand-none italic font-editorial">
              Mom of {profile.babyName} · {profile.babyAge}
            </p>
          </div>
          <button onClick={openEdit} data-testid="edit-profile" className="w-9 h-9 rounded-full bg-blush flex items-center justify-center">
            <Edit3 size={15} className="text-pinkDeep" />
          </button>
        </div>

        {/* Baby chip */}
        <div className="mt-5 p-4 rounded-2xl bg-pinkSoft border border-border/50 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center">
            <Baby size={20} className="text-pinkDeep" />
          </div>
          <div className="flex-1 leading-tight">
            <p className="text-[10px] uppercase tracking-widest text-foreground/55 font-semibold">Your little one</p>
            <p className="text-base font-semibold mt-0.5">{profile.babyName} <span className="text-foreground/60 font-normal">· {profile.babyAge}</span></p>
          </div>
          <button onClick={openEdit} className="text-xs text-pinkDeep font-semibold">Edit</button>
        </div>
      </section>

      {/* Quick stats */}
      <section className="mx-5 mt-4 grid grid-cols-3 gap-2">
        <StatCard label="In cart" value={items.length} />
        <StatCard label="Orders" value={12} />
        <StatCard label="Saved" value={4} />
      </section>

      {/* Contact info */}
      <section className="mx-5 mt-6 rounded-3xl bg-white border border-border/60 overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold">Contact</p>
        </div>
        <ContactRow icon={Phone} label="Mobile" value={profile.phone} />
        <ContactRow icon={Mail} label="Email" value={profile.email} />
        <ContactRow icon={MapPin} label="Delivery address" value={profile.address} multiline />
      </section>

      {/* Menu */}
      <section className="mx-5 mt-6 rounded-3xl bg-white border border-border/60 overflow-hidden">
        <MenuRow icon={Package} title="My orders" hint="Track, return, reorder" />
        <MenuRow icon={MapPin} title="Saved addresses" hint="Home, work & more" />
        <MenuRow icon={Heart} title="Wishlist" hint="Save for later" />
        <MenuRow icon={Tag} title="Coupons & offers" hint="3 active coupons" />
        <MenuRow icon={Sparkles} title="Subscribe & forget" hint="Manage auto-deliveries" />
        <MenuRow icon={HelpCircle} title="Help & support" hint="FAQs, contact us" />
      </section>

      {/* Sign out */}
      <div className="mx-5 mt-6">
        <button className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-white border border-border/60 text-sm font-semibold text-destructive hover:bg-blush/40">
          <LogOut size={16} /> Sign out
        </button>
        <p className="mt-6 text-center text-[11px] text-foreground/45 font-editorial italic">
          — delivered with love from Hyderabad ♡
        </p>
      </div>

      {/* Edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setEditing(false)} data-testid="edit-drawer">
          <div
            className="absolute bottom-0 inset-x-0 mx-auto max-w-md bg-background rounded-t-[32px] p-6 pb-8 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-editorial text-2xl">Edit profile</h3>
              <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-full bg-blush flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Your name" value={draft.momName} onChange={(v) => setDraft({ ...draft, momName: v })} testid="edit-mom-name" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Baby's name" value={draft.babyName} onChange={(v) => setDraft({ ...draft, babyName: v })} testid="edit-baby-name" />
                <Field label="Baby's age" value={draft.babyAge} onChange={(v) => setDraft({ ...draft, babyAge: v })} testid="edit-baby-age" />
              </div>
              <Field label="Mobile" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} testid="edit-phone" />
              <Field label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} testid="edit-email" />
              <Field label="Delivery address" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} testid="edit-address" multiline />
            </div>

            <button
              onClick={save}
              data-testid="save-profile"
              className="mt-6 w-full py-3.5 rounded-full bg-pinkDeep text-white text-sm font-semibold"
            >
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value }) => (
  <div className="p-4 rounded-2xl bg-white border border-border/60 text-center">
    <p className="font-editorial text-2xl text-pinkDeep leading-none">{value}</p>
    <p className="text-[10px] text-foreground/60 mt-1 uppercase tracking-widest font-semibold">{label}</p>
  </div>
);

const ContactRow = ({ icon: Icon, label, value, multiline }) => (
  <div className="flex items-start gap-3 p-5 border-b border-border/40 last:border-b-0">
    <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-pinkDeep" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-foreground/55 font-semibold">{label}</p>
      <p className={`text-sm text-foreground mt-1 ${multiline ? "whitespace-pre-line" : "truncate"}`}>{value}</p>
    </div>
  </div>
);

const MenuRow = ({ icon: Icon, title, hint }) => (
  <button className="w-full flex items-center gap-3 p-5 border-b border-border/40 last:border-b-0 text-left hover:bg-blush/30 transition-colors">
    <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-pinkDeep" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-[11px] text-foreground/55 mt-0.5">{hint}</p>
    </div>
    <ChevronRight size={16} className="text-foreground/40" />
  </button>
);

const Field = ({ label, value, onChange, testid, multiline }) => (
  <label className="flex flex-col gap-2">
    <span className="text-[10px] uppercase tracking-widest text-foreground/60 font-semibold">{label}</span>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        data-testid={testid}
        className="w-full px-4 py-3 rounded-2xl bg-white border border-border/70 text-sm outline-none focus:border-pinkDeep resize-none"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="w-full px-4 py-3 rounded-full bg-white border border-border/70 text-sm outline-none focus:border-pinkDeep"
      />
    )}
  </label>
);
