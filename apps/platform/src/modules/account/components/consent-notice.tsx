import { Link } from "@tanstack/react-router";
import { Check, ShieldCheck } from "lucide-react";

const PURPOSES = [
  "Your name & phone — to create your account and verify it via OTP.",
  "Delivery address — to deliver your orders and check serviceability.",
  "Order & payment details — to process orders, payments and refunds.",
  "Baby profile (optional) — to suggest age-appropriate products.",
];

interface SignupConsentNoticeProps {
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
  marketing: boolean;
  onMarketingChange: (v: boolean) => void;
}

/**
 * DPDP-compliant consent notice shown at sign-up. The notice is itemised, and
 * marketing consent is kept separate from the consent needed to run the
 * service (consent must not be bundled).
 */
export default function SignupConsentNotice({
  agreed,
  onAgreedChange,
  marketing,
  onMarketingChange,
}: SignupConsentNoticeProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-4">
      <p className="flex items-center gap-2 font-semibold text-ink text-xs">
        <ShieldCheck size={14} className="text-primary" />
        How we'll use your data
      </p>

      <ul className="flex flex-col gap-1.5">
        {PURPOSES.map((p) => (
          <li
            key={p}
            className="flex items-start gap-2 text-[11px] text-foreground/65 leading-relaxed"
          >
            <Check size={12} className="mt-0.5 shrink-0 text-primary" />
            {p}
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-foreground/55 leading-relaxed">
        You can withdraw consent, correct your data, export it, or delete your
        account any time from Profile → Privacy & data.
      </p>

      <label className="flex cursor-pointer items-start gap-2 text-[11px] text-foreground/75 leading-relaxed">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
          data-testid="web-consent-agree"
          className="mt-0.5 size-3.5 shrink-0 accent-primary"
        />
        <span>
          I agree to the{" "}
          <Link to="/legal/terms" className="text-primary underline">
            Terms
          </Link>{" "}
          and have read the{" "}
          <Link to="/legal/privacy" className="text-primary underline">
            Privacy Notice
          </Link>
          .
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-2 text-[11px] text-foreground/75 leading-relaxed">
        <input
          type="checkbox"
          checked={marketing}
          onChange={(e) => onMarketingChange(e.target.checked)}
          data-testid="web-consent-marketing"
          className="mt-0.5 size-3.5 shrink-0 accent-primary"
        />
        <span>
          Send me offers and parenting tips (optional — you can opt out later).
        </span>
      </label>
    </div>
  );
}
