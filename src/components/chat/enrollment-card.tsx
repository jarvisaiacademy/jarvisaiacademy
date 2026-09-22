"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  FileText,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useCourses } from "@/providers/courses-provider";
import { APP_SETTINGS } from "@/data/app-settings";
import { siteConfig } from "@/config/site";

export interface EnrollmentData {
  courseId: "fullstack" | "super10";
  courseName: string;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  status: "initiated" | "paid" | "not_paid";
  transactionId?: string;
  paidAt?: string;
  studentName: string;
  studentEmail: string;
}

interface EnrollmentCardProps {
  messageId: string;
  initialData?: Partial<EnrollmentData>;
  onUpdate?: (updated: EnrollmentData) => void;
  currentUser?: { name?: string; email?: string } | null;
  /** Gates the checkout buttons — a guest reaches this card but cannot act on it. */
  onRequireLogin?: (action: () => void) => void;
}

export function EnrollmentCard({
  messageId,
  initialData,
  onUpdate,
  currentUser,
  onRequireLogin,
}: EnrollmentCardProps) {
  const { showToast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<"fullstack" | "super10">(
    initialData?.courseId || "fullstack"
  );
  const [status, setStatus] = useState<"initiated" | "paid" | "not_paid">(
    initialData?.status || "initiated"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  // Empty for a signed-out visitor rather than a name belonging to somebody. The earlier
  // fallback was a real person's name and address, so a guest who opened this card was
  // shown as enrolled, and any row it wrote carried their identity.
  const studentName = initialData?.studentName || currentUser?.name || "";
  const studentEmail = initialData?.studentEmail || currentUser?.email || "";
  const [transactionId, setTransactionId] = useState(
    initialData?.transactionId || "TXN-JARVIS-PENDING"
  );
  const [paidAt, setPaidAt] = useState<string | undefined>(initialData?.paidAt);

  const { courses } = useCourses();
  const { super10Seats, referralReward, moneyBackDays, gstin, gstRatePercent } = APP_SETTINGS;

  // Read from the catalogue the admin edits, not a second table kept in this file. The copy
  // that used to live here had its own title and its own ₹30,000, so a fee changed in the
  // dashboard would leave the checkout quoting the old one.
  const courseItem = courses.find((c) => c.id === selectedCourse);
  // The selector below offers these two by id, so it looks their fees up from the same
  // catalogue rather than repeating the figures a third time.
  const fullstackItem = courses.find((c) => c.id === "fullstack");
  const super10Item = courses.find((c) => c.id === "super10");
  const course = {
    name: courseItem?.title ?? selectedCourse,
    duration: courseItem?.duration ?? "",
    // `amount` is the numeric fee, `fee` its display string. Both tracks are quoted
    // all-inclusive, so nothing is added on top and `gstAmount` is always zero.
    baseAmount: courseItem?.amount ?? 0,
  };
  const gstAmount = 0;
  const totalAmount = course.baseAmount;

  // Track event in localStorage audit ledger
  const trackAction = (
    action: "initiated" | "paid" | "not_paid",
    txnId: string,
    paidTimestamp?: string
  ) => {
    try {
      const existing = JSON.parse(
        localStorage.getItem("jarvis_enrollment_tracker") || "[]"
      );
      const logEntry = {
        action,
        courseId: selectedCourse,
        courseName: course.name,
        amount: totalAmount,
        transactionId: txnId,
        studentName,
        studentEmail,
        timestamp: paidTimestamp || new Date().toISOString(),
        messageId,
      };
      localStorage.setItem(
        "jarvis_enrollment_tracker",
        JSON.stringify([logEntry, ...existing])
      );
      console.log(`[EnrollmentTracker] Action logged: ${action}`, logEntry);
    } catch {
      // ignore
    }
  };

  // Handle simulated successful payment
  const handleSimulatePayment = () => {
    setIsProcessing(true);
    showToast("Processing payment gateway transaction...", "info");

    setTimeout(() => {
      const now = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      });
      const generatedTxn = `TXN-JARVIS-${Math.floor(100000 + Math.random() * 900000)}`;

      setIsProcessing(false);
      setStatus("paid");
      setTransactionId(generatedTxn);
      setPaidAt(now);

      trackAction("paid", generatedTxn, now);
      showToast("Payment Successful! Program seat confirmed.", "success");

      onUpdate?.({
        courseId: selectedCourse,
        courseName: course.name,
        baseAmount: course.baseAmount,
        gstAmount,
        totalAmount,
        status: "paid",
        transactionId: generatedTxn,
        paidAt: now,
        studentName,
        studentEmail,
      });
    }, 1200);
  };

  // Handle simulated failed or cancelled payment
  const handleSimulateFailure = () => {
    setStatus("not_paid");
    trackAction("not_paid", transactionId);
    showToast("Payment cancelled or interrupted. You can retry.", "error");

    onUpdate?.({
      courseId: selectedCourse,
      courseName: course.name,
      baseAmount: course.baseAmount,
      gstAmount,
      totalAmount,
      status: "not_paid",
      transactionId,
      paidAt: undefined,
      studentName,
      studentEmail,
    });
  };

  // Handle retry payment
  const handleRetry = () => {
    setStatus("initiated");
    trackAction("initiated", transactionId);
    showToast("Payment re-initiated. Please proceed to checkout.", "info");

    onUpdate?.({
      courseId: selectedCourse,
      courseName: course.name,
      baseAmount: course.baseAmount,
      gstAmount,
      totalAmount,
      status: "initiated",
      transactionId,
      paidAt: undefined,
      studentName,
      studentEmail,
    });
  };

  // Generate and download or print official Tax Invoice & Receipt
  const handleDownloadReceipt = (mode: "download" | "print" = "download") => {
    const invoiceNumber = `INV-${transactionId.replace("TXN-", "")}`;
    const invoiceDate = paidAt || new Date().toLocaleDateString("en-IN");

    const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice & Admission Receipt — ${siteConfig.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 32px;
      color: #1a1a1a;
      background: #ffffff;
    }
    .invoice-card {
      max-width: 720px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .tagline {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-badge {
      text-align: right;
    }
    .invoice-badge h2 {
      margin: 0;
      font-size: 18px;
      color: #0f172a;
    }
    .invoice-badge p {
      margin: 4px 0 0;
      font-size: 12px;
      color: #64748b;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
      font-size: 13px;
    }
    .details-col h4 {
      margin: 0 0 8px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .details-col p {
      margin: 3px 0;
      color: #334155;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .table th {
      background: #f8fafc;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #cbd5e1;
      color: #475569;
      font-weight: 600;
    }
    .table td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .amount-col {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 280px;
      font-size: 13px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      color: #475569;
    }
    .totals-row.grand {
      border-top: 2px solid #0f172a;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      padding-top: 10px;
      margin-top: 6px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #dcfce7;
      color: #15803d;
      font-size: 12px;
      font-weight: 600;
      border-radius: 9999px;
      margin-top: 6px;
    }
    .footer-note {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
      text-align: center;
    }
    @media print {
      body { padding: 0; background: none; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="brand-title">${siteConfig.name}</h1>
        <div class="tagline">${siteConfig.tagline}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
          GSTIN: ${gstin} · Educational Services
        </div>
      </div>
      <div class="invoice-badge">
        <h2>TAX INVOICE & RECEIPT</h2>
        <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
        <p><strong>Date:</strong> ${invoiceDate}</p>
        <div class="status-badge">✓ PAYMENT CONFIRMED</div>
      </div>
    </div>

    <div class="details-grid">
      <div class="details-col">
        <h4>Billed To (Learner)</h4>
        <p><strong>Name:</strong> ${studentName}</p>
        <p><strong>Email:</strong> ${studentEmail}</p>
        <p><strong>Transaction Ref:</strong> ${transactionId}</p>
        <p><strong>Payment Mode:</strong> Online (UPI / Card Gateway)</p>
      </div>
      <div class="details-col">
        <h4>Academy Information</h4>
        <p><strong>Academy:</strong> ${siteConfig.name}</p>
        <p><strong>Admissions:</strong> ${siteConfig.contact.email}</p>
        <p><strong>Finance Desk:</strong> ${siteConfig.contact.financeEmail}</p>
        <p><strong>Support:</strong> ${siteConfig.contact.phone}</p>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description / Program</th>
          <th>Batch Track</th>
          <th class="amount-col">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${course.name}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">Includes live program access, 1-on-1 CTO mentorship, code reviews & placement track.</span>
          </td>
          <td>${course.duration}</td>
          <td class="amount-col">₹${course.baseAmount.toLocaleString("en-IN")}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>₹${course.baseAmount.toLocaleString("en-IN")}</span>
      </div>
      ${
        gstAmount > 0
          ? `<div class="totals-row">
        <span>Statutory CGST (${gstRatePercent / 2}%):</span>
        <span>₹${Math.round(gstAmount / 2).toLocaleString("en-IN")}</span>
      </div>
      <div class="totals-row">
        <span>Statutory SGST (${gstRatePercent / 2}%):</span>
        <span>₹${Math.round(gstAmount / 2).toLocaleString("en-IN")}</span>
      </div>`
          : ""
      }
      <div class="totals-row grand">
        <span>Total Paid:</span>
        <span>₹${totalAmount.toLocaleString("en-IN")}</span>
      </div>
    </div>

    <div class="footer-note">
      This is a digitally generated computer invoice. No signature required.<br/>
      Includes Jarvis AI Academy ${moneyBackDays}-Day 100% Money-Back Guarantee policy.<br/>
      Questions or corporate invoice requests? Email ${siteConfig.contact.financeEmail}
    </div>
  </div>
</body>
</html>`;

    if (mode === "download") {
      // 1. Create downloadable HTML file
      const blob = new Blob([receiptHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt_${invoiceNumber}_${studentName.replace(/\s+/g, "_")}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Official tax invoice & receipt downloaded!", "success");
    } else {
      // 2. Open printable view in new window
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(receiptHtml);
        printWin.document.close();
        setTimeout(() => {
          printWin.print();
        }, 350);
      }
      showToast("Official tax invoice print preview opened!", "info");
    }
  };

  return (
    <div className="w-full my-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xl select-none transition-colors">
      {/* Header with status badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
              Admissions &amp; Enrollment Checkout
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Direct seat reservation with 7-day money-back guarantee
            </p>
          </div>
        </div>

        {/* Status Indicator Pill */}
        {status === "initiated" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border border-neutral-300/60 dark:border-white/10">
            <Clock className="w-3.5 h-3.5" />
            Payment Pending
          </span>
        )}
        {status === "not_paid" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Payment Incomplete
          </span>
        )}
        {status === "paid" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border border-neutral-300/60 dark:border-white/10">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Enrolled &amp; Confirmed
          </span>
        )}
      </div>

      {/* Program Selector (if not yet paid) */}
      {status !== "paid" ? (
        <div className="flex flex-col gap-3 mb-4">
          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Select Learning Program:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedCourse("fullstack")}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedCourse === "fullstack"
                  ? "bg-neutral-100 dark:bg-white/10 border-neutral-900 dark:border-white text-neutral-900 dark:text-white shadow-xs"
                  : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
              }`}
            >
              <span className="text-xs font-semibold">Full-Stack AI &amp; Web</span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                60 Days (2 Months) · Next.js 15 &amp; Python GenAI
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white mt-2">
                {fullstackItem?.fee ?? "—"}{" "}
                <span className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400">all-in</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCourse("super10")}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedCourse === "super10"
                  ? "bg-neutral-100 dark:bg-white/10 border-neutral-900 dark:border-white text-neutral-900 dark:text-white shadow-xs"
                  : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Super10 Elite Program</span>
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
                  {super10Seats} SEATS
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                60 Days · 100% Placement Assurance
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white mt-2">
                {super10Item?.fee ?? "—"}{" "}
                <span className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400">fully sponsored</span>
              </span>
            </button>
          </div>
          {/* Referral Reward Banner */}
          <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span>🎁 <strong>Referral Program:</strong> Refer a student &amp; earn <strong>₹{referralReward.toLocaleString("en-IN")}</strong> cash bonus once they complete the full 60-day course!</span>
          </div>
        </div>
      ) : (
        /* Paid Summary Card */
        <div className="mb-4 p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Admission Confirmed: {course.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-700 dark:text-neutral-300 mt-1">
            <div>
              <span className="text-neutral-500">Student:</span> {studentName}
            </div>
            <div>
              <span className="text-neutral-500">Txn ID:</span> {transactionId}
            </div>
            <div>
              <span className="text-neutral-500">Amount Paid:</span> ₹{totalAmount.toLocaleString("en-IN")}
            </div>
            <div>
              <span className="text-neutral-500">Confirmed on:</span> {paidAt}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-white/5 p-3.5 mb-5 text-xs flex flex-col gap-1.5">
        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
          <span>Program Tuition:</span>
          <span className="text-neutral-900 dark:text-neutral-200">₹{course.baseAmount.toLocaleString("en-IN")}</span>
        </div>
        {gstAmount > 0 && (
          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
            <span>
              Statutory {gstRatePercent}% GST (CGST {gstRatePercent / 2}% + SGST{" "}
              {gstRatePercent / 2}%):
            </span>
            <span className="text-neutral-900 dark:text-neutral-200">₹{gstAmount.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-neutral-900 dark:text-white text-sm pt-2 border-t border-neutral-200 dark:border-white/10 mt-1">
          <span>Total Payable:</span>
          <span className="text-neutral-900 dark:text-white font-bold">₹{totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Action Buttons based on Status */}
      {status === "initiated" && (
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onRequireLogin?.(handleSimulatePayment)}
            className="flex-1 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs sm:text-sm font-medium transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Pay ₹{totalAmount.toLocaleString("en-IN")} &amp; Enroll</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onRequireLogin?.(handleSimulateFailure)}
            className="w-full sm:w-auto py-2.5 px-4 rounded-full border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel / Failed
          </button>
        </div>
      )}

      {status === "not_paid" && (
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <span>
              Payment was not completed. Your program seat hold is temporary. Click below to retry.
            </span>
          </div>

          <button
            type="button"
            onClick={() => onRequireLogin?.(handleRetry)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs sm:text-sm font-medium transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Enrollment &amp; Payment</span>
          </button>
        </div>
      )}

      {status === "paid" && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => onRequireLogin?.(() => handleDownloadReceipt("download"))}
            className="flex-1 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs sm:text-sm font-medium transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Official Tax Invoice &amp; Receipt (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => onRequireLogin?.(() => handleDownloadReceipt("print"))}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full border border-neutral-300 dark:border-white/15 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default EnrollmentCard;
