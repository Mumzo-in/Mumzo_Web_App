import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LanguageCode = "en" | "hi" | "te";

export interface Profile {
  name: string;
  phone: string;
  email: string;
  language: LanguageCode;
}

export const LANGUAGES: { value: LanguageCode; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "te", label: "తెలుగు" },
];

const DEFAULT_PROFILE: Profile = {
  name: "Ananya Reddy",
  phone: "+91 98480 12345",
  email: "ananya@example.com",
  language: "en",
};

interface ProfileContextValue {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const STORAGE_KEY = "mumzo_profile_v1";

function readStored(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, updateProfile }),
    [profile, updateProfile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used inside <ProfileProvider>");
  }
  return ctx;
}
