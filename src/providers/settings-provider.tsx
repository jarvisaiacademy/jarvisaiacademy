"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AppSettings, DEFAULT_APP_SETTINGS } from "@/data/app-settings";
import {
  subscribeSettingsFromFirestore,
  updateSettingsInFirestore,
} from "@/services/settings-service";
import { useAuth } from "@/providers/auth-provider";
import { fetchPublicContent } from "@/lib/public-content";

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  saveSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * The academy's settings, kept in step with Firestore.
 *
 * An admin subscribes, because the Settings tab has to show the figure it just saved. Everyone
 * else reads the cached payload: these values are quoted on public pages, the read is open in
 * `firestore.rules`, and the answer is the same for every visitor — so a listener per visitor
 * was billing a Firestore read each to learn something `revalidate` already knows.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Starts at the defaults, never at undefined or zeroes, so every consumer renders a real
  // figure on the first paint and the snapshot simply replaces it. There is no empty state
  // for the components to handle.
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = !!user?.isAdmin;

  useEffect(() => {
    let isMounted = true;

    if (isAdmin) {
      const unsubscribe = subscribeSettingsFromFirestore(
        (next) => {
          if (!isMounted) return;
          setSettings(next);
          setLoading(false);
          setError(null);
        },
        (err) => {
          if (!isMounted) return;
          // The defaults stay on screen. There is nothing partial to show here — these are five
          // scalars, and the built-in values are what the site shipped with — so falling back
          // is a correct render, not a degraded one.
          console.warn("[SettingsProvider] Subscription error, keeping the built-in settings:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      if (!unsubscribe) setLoading(false);

      return () => {
        isMounted = false;
        unsubscribe?.();
      };
    }

    fetchPublicContent()
      .then((payload) => {
        if (!isMounted) return;
        // Spread over the defaults in case the document that came back predates a field.
        setSettings({ ...DEFAULT_APP_SETTINGS, ...payload.settings });
        setLoading(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.warn("[SettingsProvider] Cached read failed, keeping the built-in settings:", err);
        setError(err instanceof Error ? err.message : "Failed to load the settings");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const saveSettings = async (updates: Partial<AppSettings>) => {
    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Only verified admins can change the academy settings.");
    }

    // Optimistic, but the write is what persists it: if it fails, put back what Firestore last
    // told us rather than leaving the screen claiming a save that did not happen.
    const previous = settings;
    setSettings({ ...settings, ...updates });
    try {
      await updateSettingsInFirestore(updates, user.email);
      setError(null);
    } catch (err) {
      setSettings(previous);
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_APP_SETTINGS,
      loading: false,
      error: null,
      saveSettings: async () => {
        throw new Error("useSettings must be used within a SettingsProvider");
      },
    };
  }
  return context;
}
