"use client";

import React, { useState } from "react";
import { Gift, Copy, Check } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { referralCodeFor } from "@/data/referrals";
import { APP_SETTINGS } from "@/data/app-settings";

/**
 * The learner's own code, and the only place they can read it.
 *
 * Derived here rather than read from the document: `referralCodeFor` is the one definition of what
 * a code is, so computing it cannot disagree with what the sign-in upsert stored, and it cannot
 * flash empty for an account a backfill has not reached yet.
 *
 * `ponytail:` the ceiling is that the derivation is now load-bearing in the browser too — changing
 * the format means the `referrals` index has to be migrated in the same move, or every code already
 * shared stops resolving at its old spelling. `node scripts/check-referral-codes.mjs` is what
 * catches a format change before it ships.
 */
export function ReferralCodeSetting() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const code = user ? referralCodeFor(user.id) : "";

  if (!user) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be refused (an insecure origin, a denied permission). The code is on
      // screen and selects on click, so there is nothing to recover from and nothing to say.
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3.5">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted text-foreground/80 shrink-0">
          <Gift className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground leading-snug">
            Your referral code
          </span>
          <span className="text-xs text-muted-foreground leading-normal mt-0.5">
            Share it with a friend — you earn ₹{APP_SETTINGS.referralReward.toLocaleString("en-IN")}{" "}
            when they enrol.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-xs tracking-wider text-foreground bg-muted rounded-lg px-2.5 py-1.5 select-all">
          {code}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}
