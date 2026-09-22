/**
 * The academy's own business figures — the ones that are a decision rather than content.
 *
 * Hard-coded, and deliberately so. There is no editor for them in the dashboard: five scalars
 * are a code change and a deploy, and a settings screen that can silently disagree with the
 * receipt, the enrolment card and the tax breakdown is a way to be wrong in four places at
 * once. Read them straight from `APP_SETTINGS`.
 *
 * Two kinds of number are deliberately NOT here, each because it already has an owner and a
 * second copy is how the two drift apart:
 *
 * - Course fees, durations and topics — the `courses` collection, editable on its own tab.
 * - Contact details and brand strings — `src/config/site.ts`.
 *
 * The chat replies in `src/data/academy-knowledge.ts` also state several of these figures as
 * prose and do NOT read this file: they have to answer instantly and keep working with
 * Firestore unreachable, so they are static by design. A value changed here will therefore
 * disagree with whatever the bot says until that prose is rewritten.
 *
 * Import-free, like `src/data/courses.ts`.
 */
export interface AppSettings {
  /** Rupees paid for a referral that goes on to complete the course. */
  referralReward: number;
  /** How many candidates the Super10 track is capped at. */
  super10Seats: number;
  /** The money-back window the receipt promises. */
  moneyBackDays: number;
  /**
   * GST as a percentage, not a fraction, and deliberately so: an admin typing `18` into a
   * field labelled "GST rate (%)" cannot accidentally store `18` where `0.18` was meant,
   * which would multiply every fee by eighteen. The one place that needs the fraction — the
   * analytics tax breakdown, which backs tax out of an all-inclusive price — derives it.
   */
  gstRatePercent: number;
  /** Printed on the receipt. */
  gstin: string;
}

/** The figures the app quotes, everywhere. There is no other copy and no editor for them. */
export const APP_SETTINGS: AppSettings = {
  referralReward: 3000,
  super10Seats: 10,
  moneyBackDays: 7,
  gstRatePercent: 18,
  gstin: "27AABCJ1988Z1Z9",
};
