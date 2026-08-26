"use client";

import { Input } from "@mumzo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { cn } from "@mumzo/ui/lib/utils";
import { useMemo } from "react";

/**
 * Phone number entry with a dial-code selector.
 *
 * Value in and out is a single E.164 string (`+919876543210`) so callers store
 * one field and never have to reassemble parts. The split into country + local
 * digits is presentation only.
 */

export type PhoneCountry = {
  /** ISO 3166-1 alpha-2, used as the select value — dial codes are not unique
   * (NANP shares +1), so they cannot key the list. */
  code: string;
  name: string;
  dial: string;
  flag: string;
};

/** India first — Mumzo launches in Hyderabad — then the corridors most likely
 * to appear on a staff or partner record. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
];

const DEFAULT_COUNTRY = PHONE_COUNTRIES[0] as PhoneCountry;

/** Longest dial code first, so `+971` wins over `+9` on a prefix match. */
const BY_LENGTH = [...PHONE_COUNTRIES].sort(
  (a, b) => b.dial.length - a.dial.length,
);

/** Split an E.164 string into its country and local parts. Unrecognised or
 * empty values fall back to the default country with the digits intact, so a
 * legacy row never renders blank. */
export function splitPhone(value: string): {
  country: PhoneCountry;
  local: string;
} {
  const trimmed = value.trim();

  if (trimmed.startsWith("+")) {
    const match = BY_LENGTH.find((entry) => trimmed.startsWith(entry.dial));
    if (match) {
      return {
        country: match,
        local: trimmed.slice(match.dial.length).replace(/\D/g, ""),
      };
    }
  }

  return { country: DEFAULT_COUNTRY, local: trimmed.replace(/\D/g, "") };
}

type PhoneInputProps = {
  /** Full E.164 number, e.g. `+919876543210`. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "data-testid"?: string;
};

export function PhoneInput({
  value,
  onChange,
  id,
  placeholder = "Phone number",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
  "data-testid": testId,
}: PhoneInputProps) {
  const { country, local } = useMemo(() => splitPhone(value), [value]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={country.code}
        onValueChange={(next) => {
          const picked =
            PHONE_COUNTRIES.find((entry) => entry.code === String(next)) ??
            DEFAULT_COUNTRY;
          onChange(`${picked.dial}${local}`);
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-28 shrink-0"
          aria-label="Country dialling code"
          data-testid={testId ? `${testId}-country` : undefined}
        >
          <SelectValue>
            <span className="flex items-center gap-1.5">
              <span aria-hidden>{country.flag}</span>
              <span className="numeric">{country.dial}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {PHONE_COUNTRIES.map((entry) => (
              <SelectItem key={entry.code} value={entry.code}>
                <span className="flex items-center gap-2">
                  <span aria-hidden>{entry.flag}</span>
                  <span>{entry.name}</span>
                  <span className="numeric text-muted-foreground">
                    {entry.dial}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        data-testid={testId}
        value={local}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onChange(`${country.dial}${digits}`);
        }}
      />
    </div>
  );
}

export default PhoneInput;
