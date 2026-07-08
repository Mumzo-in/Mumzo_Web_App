import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const initial = {
  name: "",
  email: "",
  address: "",
  pincode: "",
  baby_name: "",
  baby_age: "",
};

const HYD_PIN = /^(500|501)\d{3}$/;

export default function WaitlistSection() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pin = form.pincode.trim();
  const pinValid = /^\d{6}$/.test(pin);
  const pinIsHyd = HYD_PIN.test(pin);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.address || !form.pincode || !form.baby_name || !form.baby_age) {
      toast.error("Please fill in every field, mama.");
      return;
    }
    if (!pinValid) {
      toast.error("Please enter a valid 6-digit pincode.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/waitlist`, form);
      setSuccess(data);
      toast.dismiss();
      toast.success(data.message || "You're on the list!");
      setForm(initial);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(
        Array.isArray(detail) ? detail[0]?.msg || "Please check your details." : detail || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" data-testid="waitlist-section" className="relative py-24 md:py-32 bg-blush">
      <div className="max-w-2xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <span className="kicker">Join the Waitlist</span>
          <h2 className="mt-6 font-editorial text-4xl md:text-6xl leading-[1.05] tracking-tight">
            Be first at <span className="italic text-pinkDeep">the door.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-foreground/70 max-w-md mx-auto leading-relaxed">
            Drop your details and we'll ping you the moment Mumzo goes live
            in your area.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mt-12"
        >
          {success ? (
            <div
              data-testid="waitlist-success"
              className="p-10 md:p-12 rounded-3xl bg-white border border-border/70 text-center"
            >
              <div className="mx-auto w-14 h-14 rounded-full bg-blush flex items-center justify-center mb-6">
                <span className="text-2xl">{success.is_hyderabad ? "♡" : "✈"}</span>
              </div>
              <h3 className="font-editorial text-3xl md:text-4xl leading-tight" data-testid="waitlist-success-title">
                {success.is_hyderabad
                  ? "You're on the list, mama."
                  : "We'll come to you, mama."}
              </h3>
              <p className="mt-4 text-foreground/70 max-w-md mx-auto" data-testid="waitlist-success-message">
                {success.message}
              </p>
              <p className="mt-6 text-sm text-foreground/50">
                {success.is_hyderabad ? `Position #${success.position}` : "On the future-cities list"}
              </p>
              <button
                onClick={() => setSuccess(null)}
                data-testid="waitlist-add-another"
                className="mt-8 mumzo-btn-ghost text-sm"
              >
                Add another baby
              </button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              data-testid="waitlist-form"
              className="p-8 md:p-10 rounded-3xl bg-white border border-border/70"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-xs uppercase tracking-widest text-foreground/60">Your name</span>
                  <input
                    data-testid="waitlist-name"
                    type="text"
                    placeholder="e.g. Ananya Reddy"
                    value={form.name}
                    onChange={update("name")}
                    className="mumzo-input"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-xs uppercase tracking-widest text-foreground/60">Email</span>
                  <input
                    data-testid="waitlist-email"
                    type="email"
                    placeholder="you@hello.com"
                    value={form.email}
                    onChange={update("email")}
                    className="mumzo-input"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-xs uppercase tracking-widest text-foreground/60">Delivery address</span>
                  <input
                    data-testid="waitlist-address"
                    type="text"
                    placeholder="Flat, building, area"
                    value={form.address}
                    onChange={update("address")}
                    className="mumzo-input"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-widest text-foreground/60">Pincode</span>
                  <input
                    data-testid="waitlist-pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 500033"
                    value={form.pincode}
                    onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                    className="mumzo-input"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-widest text-foreground/60">Baby's name</span>
                  <input
                    data-testid="waitlist-baby-name"
                    type="text"
                    placeholder="e.g. Kabir"
                    value={form.baby_name}
                    onChange={update("baby_name")}
                    className="mumzo-input"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-xs uppercase tracking-widest text-foreground/60">Baby's age</span>
                  <input
                    data-testid="waitlist-baby-age"
                    type="text"
                    placeholder="e.g. 6 months"
                    value={form.baby_age}
                    onChange={update("baby_age")}
                    className="mumzo-input"
                    required
                  />
                </label>
              </div>

              {pinValid && (
                <div
                  data-testid={pinIsHyd ? "pin-hint-hyderabad" : "pin-hint-other"}
                  className={`mt-5 px-4 py-2.5 rounded-full text-sm inline-flex items-center gap-2 ${
                    pinIsHyd ? "bg-blush text-pinkDeep" : "bg-pinkSoft text-foreground/80 border border-border/70"
                  }`}
                >
                  <span aria-hidden>{pinIsHyd ? "♡" : "✈"}</span>
                  {pinIsHyd
                    ? "You're in Hyderabad — we launch here first."
                    : "Not in Hyderabad — we'll notify when we come to you."}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                data-testid="waitlist-submit"
                className="mt-8 mumzo-btn text-base w-full justify-center disabled:opacity-60"
              >
                {loading ? "Joining…" : pinValid && !pinIsHyd ? "Notify me in my city" : "Join the waitlist →"}
              </button>

              <p className="mt-5 text-xs text-foreground/50 text-center">
                By joining, you agree to hear from us about Mumzo's launch.
                We'll never share your details.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
