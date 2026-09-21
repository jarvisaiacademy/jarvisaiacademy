"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Copy,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  Plus,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  academyKnowledge,
  GENERATED_REPLY_KEYS,
  REPLY_KEYS,
  replyPages,
} from "@/data/academy-knowledge";
import { ChangeRequest } from "@/data/change-requests";
import {
  createChangeRequestInFirestore,
  setChangeRequestDoneInFirestore,
  subscribeChangeRequestsFromFirestore,
} from "@/services/change-requests-service";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";

const inputClass =
  "w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-violet-500";
const selectClass =
  "w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs";
const labelClass = "text-[11px] font-semibold text-neutral-600 dark:text-neutral-400";

/**
 * The wording a reply has right now, read straight out of the bundle.
 *
 * A request never had to store this: the current copy is in `academyKnowledge` at the moment
 * the card renders, so the old and new wordings sit beside each other without a schema field
 * to keep in step. Undefined means there is nothing to compare against — a reply assembled by
 * code, or a key that has since been renamed away.
 */
function currentWordingFor(replyKey: string): string | undefined {
  if (GENERATED_REPLY_KEYS.has(replyKey)) return undefined;
  return academyKnowledge[replyKey]?.text;
}

/**
 * The prompt a developer pastes into their editor or their agent. Everything the code change
 * needs is in here — the file, the key, both wordings — plus the two traps that make a wording
 * change more than a find-and-replace: `text` is a template literal, and a course-mapped reply
 * is public page copy that owes the SEO pass in CLAUDE.md §3.
 */
function buildDevPrompt(
  request: ChangeRequest,
  currentText: string | undefined,
  pages: string[]
): string {
  const lines: string[] = [];

  if (GENERATED_REPLY_KEYS.has(request.replyKey)) {
    lines.push(
      `Change the alumni wording behind the \`${request.replyKey}\` reply.`,
      "",
      "That reply is assembled at runtime from the pool in src/data/testimonials.ts, so the",
      "change belongs there rather than in src/data/academy-knowledge.ts.",
      "",
      "What it should say:",
      "",
      request.requestedText
    );
  } else {
    lines.push(`In src/data/academy-knowledge.ts, change the \`${request.replyKey}\` reply.`, "");

    if (currentText) {
      lines.push("It currently says:", "", currentText, "", "Change it to:", "", request.requestedText);
    } else {
      lines.push(
        `That reply is not in that file under \`${request.replyKey}\` — find where its wording`,
        "lives now.",
        "",
        "Change it to:",
        "",
        request.requestedText
      );
    }

    lines.push("", "`text` is a template literal, so escape any backtick or ${ you introduce.");
  }

  if (pages.length > 0) {
    lines.push(
      "",
      `This reply is also the programme copy on ${pages.join(", ")}, so the public page and`,
      "its SEO values need the same edit (CLAUDE.md §3)."
    );
  }

  if (request.note) lines.push("", `Context from the requester: ${request.note}`);

  return lines.join("\n");
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Changes the dashboard cannot make.
 *
 * The assistant's replies, the alumni pool and the `/llms.txt` prose are hard-coded in `src/`
 * so the bot answers instantly and keeps working when Firestore is unreachable — which also
 * means no admin edit can reach them. This is where an admin writes down what the copy should
 * say instead, and a developer reads it, changes the code and ships it.
 *
 * The app stores and displays the request. It never edits the codebase itself, and nothing
 * here appears on the site until a deploy does.
 */
export function AdminChangeRequests() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Closed by default: the queue is what an admin comes here to read, and a blank form in
  // front of it hides the thing they came for.
  const [formOpen, setFormOpen] = useState(false);
  const [replyKey, setReplyKey] = useState("");
  const [requestedText, setRequestedText] = useState("");
  const [note, setNote] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    // A null unsubscribe means Firestore is not configured at all, and nothing renders
    // without it — the same assumption every provider beside this one makes.
    const unsubscribe = subscribeChangeRequestsFromFirestore(
      (next) => {
        if (!isMounted) return;
        setRequests(next);
        setLoadError(null);
        setLoading(false);
      },
      (err) => {
        if (!isMounted) return;
        setLoadError(err.message);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const options = useMemo(
    () => REPLY_KEYS.map((key) => ({ value: key, label: key })),
    []
  );

  const pages = replyKey ? replyPages(replyKey) : [];
  const isGenerated = GENERATED_REPLY_KEYS.has(replyKey);
  const currentText = replyKey && !isGenerated ? academyKnowledge[replyKey]?.text : undefined;

  // Already sorted open-first by the subscription, so each group keeps newest-first order.
  const pending = requests.filter((r) => !r.done);
  const closed = requests.filter((r) => r.done);

  const resetForm = () => {
    setReplyKey("");
    setRequestedText("");
    setNote("");
    setScreenshotUrl("");
  };

  const handleSubmit = async () => {
    if (!replyKey) {
      showToast("Choose which reply this is about", "error");
      return;
    }
    if (!requestedText.trim()) {
      showToast("Write the wording you want instead", "error");
      return;
    }

    setIsSaving(true);
    try {
      await createChangeRequestInFirestore(
        { replyKey, requestedText, note, screenshotUrl },
        user?.email
      );
      showToast("Request filed — a developer will pick it up", "success");
      resetForm();
      setFormOpen(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to file the request", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDone = async (request: ChangeRequest) => {
    setBusyId(request.id);
    try {
      await setChangeRequestDoneInFirestore(request.id, !request.done, user?.email);
      showToast(
        request.done ? `"${request.replyKey}" reopened` : `"${request.replyKey}" marked done`,
        "success"
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update the request", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyPrompt = async (request: ChangeRequest) => {
    const prompt = buildDevPrompt(
      request,
      currentWordingFor(request.replyKey),
      replyPages(request.replyKey)
    );
    try {
      await navigator.clipboard.writeText(prompt);
      showToast("Prompt copied — paste it to whoever makes the change", "success");
    } catch {
      showToast("Could not copy the prompt", "error");
    }
  };

  // One request, as a card. Used by both sections, so a closed card keeps the layout it had
  // while it was pending and only dims.
  const renderCard = (request: ChangeRequest) => {
    const oldText = currentWordingFor(request.replyKey);
    // A closed request has usually been applied, and the reply on disk is now the requested
    // text — showing two identical wordings as a before/after would read as a diff that is
    // not there.
    const alreadyMatches = oldText !== undefined && oldText.trim() === request.requestedText.trim();

    return (
      <div
        key={request.id}
        className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3 ${
          request.done ? "opacity-60" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {request.done ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Done
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
              <CircleDashed className="w-3 h-3" />
              Open
            </span>
          )}
          <code className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-white/10 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
            {request.replyKey}
          </code>
          <span className="text-[10px] text-neutral-500">
            {request.requestedBy || "—"} · {formatWhen(request.createdAt)}
          </span>
        </div>

        {/* Old beside new, so the change is legible without reading both paragraphs twice.
            The block on the right is always the wording being asked for. */}
        <div className={`grid grid-cols-1 gap-3 ${oldText && !alreadyMatches ? "lg:grid-cols-2" : ""}`}>
          {oldText && !alreadyMatches && (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Old</span>
              <p className="p-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap">
                {oldText}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {alreadyMatches ? (
              <span className={labelClass}>Wording</span>
            ) : (
              <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                New
              </span>
            )}
            <p
              className={`p-3 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap ${
                alreadyMatches
                  ? "bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10"
                  : "bg-violet-50 dark:bg-violet-500/10 border border-violet-500/30"
              }`}
            >
              {request.requestedText}
            </p>
          </div>
        </div>

        {alreadyMatches && (
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
            The reply in the code already reads this way — the request looks applied.
          </p>
        )}

        {oldText === undefined && (
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
            {GENERATED_REPLY_KEYS.has(request.replyKey)
              ? "No old wording to compare — this reply is assembled from the alumni pool in src/data/testimonials.ts."
              : "No old wording to compare — nothing is keyed this way in the code right now."}
          </p>
        )}

        {request.note && (
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{request.note}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          {request.screenshotUrl ? (
            <a
              href={request.screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Screenshot
            </a>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyPrompt(request)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 border border-violet-500/30 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              Copy prompt
            </button>

            <button
              type="button"
              disabled={busyId === request.id}
              onClick={() => handleToggleDone(request)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-white/5 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {busyId === request.id ? "Saving..." : request.done ? "Reopen" : "Mark done"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-violet-600/10 border border-violet-500/20 shadow-xs">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            Change Requests
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Wording changes to copy that lives in the code — the assistant&apos;s replies, which
            the dashboard cannot edit. Write the exact wording you want; a developer makes the
            change and ships it, then ticks the request off here. Each card shows the old
            wording beside the new one, and <span className="font-semibold">Copy prompt</span>{" "}
            hands the developer the file, both versions and the traps in one paste.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Request</span>
        </button>
      </div>

      {/* The boundary. Without it this reads as a bug tracker and collects requests the
          Courses and Settings tabs already serve. */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
        <Info className="w-3.5 h-3.5 text-neutral-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
          For content only, not layout or styling — and only where it is hard-coded. Course
          names, fees and the academy settings are stored in Firestore and are edited in the{" "}
          <span className="font-semibold">Courses</span> and{" "}
          <span className="font-semibold">Settings</span> tabs, where the change is live
          immediately. Nothing filed here reaches the site until a developer changes the code
          and deploys it.
        </p>
      </div>

      {/* New Request — opened from the header button, so the queue is what the page shows
          first. */}
      {formOpen && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              What should it say?
            </h3>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              aria-label="Close form"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Reply</span>
            <Select
              label="Which reply this request is about"
              value={replyKey}
              onValueChange={setReplyKey}
              options={options}
              className={selectClass}
            />
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {replyKey ? `src/data/academy-knowledge.ts → ${replyKey}` : "Pick the answer to change."}
            </span>
          </div>

          {/* The one reply that is not a string, so it cannot be pasted over. Saying so is
              cheaper than a requester wondering why their request changed nothing. */}
          {isGenerated && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-500/25">
              <TriangleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-800 dark:text-amber-200">
                This reply is assembled by code on every read, from the alumni list in{" "}
                <code className="px-1 py-0.5 rounded bg-amber-500/15 text-[10px]">
                  src/data/testimonials.ts
                </code>
                . Write the wording or the change you want and a developer will make it there.
              </p>
            </div>
          )}

          {/* Editing one of these also rewrites a public page, which owes an SEO pass
              (CLAUDE.md §3). The developer has to know that before touching it. */}
          {pages.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/25">
              <TriangleAlert className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-indigo-800 dark:text-indigo-200">
                This reply is also the programme copy on {pages.join(", ")}, so the change lands
                on the public page too.
              </p>
            </div>
          )}

          {currentText && (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Current wording</span>
              <p className="max-h-32 overflow-y-auto p-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                {currentText}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="cr-text">
              Replacement wording
            </label>
            <textarea
              id="cr-text"
              rows={5}
              value={requestedText}
              onChange={(e) => setRequestedText(e.target.value)}
              placeholder="Paste the exact text you want the answer to use."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="cr-note">
                Why (optional)
              </label>
              <input
                id="cr-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. the fee changed on 1 September"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="cr-shot">
                Screenshot link (optional)
              </label>
              <input
                id="cr-shot"
                type="url"
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Filed as {user?.email || "—"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSubmit}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>File Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The queue, as cards — what is still waiting first, then what has shipped and was
          ticked off. */}
      {loading ? (
        <div className="py-10 text-center text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Loading requests...
        </div>
      ) : loadError ? (
        <p className="py-10 text-center text-xs text-neutral-400">
          Could not read the queue: {loadError}
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Pending
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                {pending.length}
              </span>
            </div>
            {pending.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10">
                Nothing waiting. Use New Request to file a change.
              </p>
            ) : (
              pending.map(renderCard)
            )}
          </section>

          {closed.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Closed
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  {closed.length}
                </span>
              </div>
              {closed.map(renderCard)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
