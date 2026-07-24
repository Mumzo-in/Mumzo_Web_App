const STORAGE_KEY = "mumzo-pending-referral-code";

/**
 * A referral code entered on the sign-in form's phone step, before the
 * account even exists. Persisted to `localStorage` because sign-in and
 * onboarding are separate, unmounted components — the onboarding modal
 * reads this once the new account reaches its "complete your profile" step
 * and clears it after submitting, so it never leaks into a later session.
 */
export function savePendingReferralCode(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // storage may be unavailable (private browsing, etc.)
  }
}

export function readPendingReferralCode(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearPendingReferralCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage may be unavailable
  }
}
