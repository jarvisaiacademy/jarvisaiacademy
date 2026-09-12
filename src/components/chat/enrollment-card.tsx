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
}

const COURSES_INFO = {
  fullstack: {
    id: "fullstack" as const,
    name: "Full-Stack AI & Web Engineering Cohort",
    duration: "16 Weeks Live",
    baseAmount: 45000,
    gstRate: 0.18,
  },
  super10: {
    id: "super10" as const,
    name: "Super10 Elite Cohort (100% Placement Assurance)",
    duration: "24 Weeks Intensive",
    baseAmount: 75000,
    gstRate: 0.18,
  },
};

export function EnrollmentCard({
  messageId,
  initialData,
  onUpdate,
  currentUser,
}: EnrollmentCardProps) {
  const { showToast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<"fullstack" | "super10">(
    initialData?.courseId || "fullstack"
  );
  const [status, setStatus] = useState<"initiated" | "paid" | "not_paid">(
    initialData?.status || "initiated"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const studentName =
    initialData?.studentName || currentUser?.name || "Sugatraj Sarwade";
  const studentEmail =
    initialData?.studentEmail || currentUser?.email || "sugat@jarvisaiacademy.com";
  const [transactionId, setTransactionId] = useState(
    initialData?.transactionId || "TXN-JARVIS-PENDING"
  );
  const [paidAt, setPaidAt] = useState<string | undefined>(initialData?.paidAt);

  const course = COURSES_INFO[selectedCourse];
  const gstAmount = Math.round(course.baseAmount * course.gstRate);
  const totalAmount = course.baseAmount + gstAmount;

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
      showToast("Payment Successful! Cohort seat confirmed.", "success");

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

  // Generate and download official Tax Invoice & Receipt
  const handleDownloadReceipt = () => {
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
      border-bottom: 2px solid #2563eb;
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
      color: #2563eb;
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
          GSTIN: 27AABCJ1988Z1Z9 · Educational Services
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
            <span style="font-size: 11px; color: #64748b;">Includes live cohort access, 1-on-1 CTO mentorship, code reviews & placement track.</span>
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
      <div class="totals-row">
        <span>Statutory CGST (9%):</span>
        <span>₹${Math.round(gstAmount / 2).toLocaleString("en-IN")}</span>
      </div>
      <div class="totals-row">
        <span>Statutory SGST (9%):</span>
        <span>₹${Math.round(gstAmount / 2).toLocaleString("en-IN")}</span>
      </div>
      <div class="totals-row grand">
        <span>Total Paid:</span>
        <span>₹${totalAmount.toLocaleString("en-IN")}</span>
      </div>
    </div>

    <div class="footer-note">
      This is a digitally generated computer invoice. No signature required.<br/>
      Includes Jarvis AI Academy 7-Day 100% Money-Back Guarantee policy.<br/>
      Questions or corporate invoice requests? Email finance@jarvisaiacademy.com
    </div>
  </div>
</body>
</html>`;

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

    // 2. Open printable view in new window
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(receiptHtml);
      printWin.document.close();
      setTimeout(() => {
        printWin.print();
      }, 350);
    }

    showToast("Official invoice receipt downloaded & ready to print!", "success");
  };

  return (
    <div className="w-full my-4 p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-100 shadow-xl select-none transition-all">
      {/* Header with status badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white tracking-tight">
              Admissions &amp; Enrollment Checkout
            </h4>
            <p className="text-xs text-neutral-400">
              Direct seat reservation with 7-day money-back guarantee
            </p>
          </div>
        </div>

        {/* Status Indicator Pill */}
        {status === "initiated" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Payment Pending
          </span>
        )}
        {status === "not_paid" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Payment Incomplete
          </span>
        )}
        {status === "paid" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Enrolled &amp; Confirmed
          </span>
        )}
      </div>

      {/* Program Selector (if not yet paid) */}
      {status !== "paid" ? (
        <div className="flex flex-col gap-3 mb-4">
          <label className="text-xs font-medium text-neutral-300">
            Select Learning Cohort:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedCourse("fullstack")}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedCourse === "fullstack"
                  ? "bg-blue-600/10 border-blue-500 text-white shadow-sm"
                  : "bg-neutral-800/40 border-neutral-700/60 text-neutral-300 hover:border-neutral-600"
              }`}
            >
              <span className="text-xs font-semibold">Full-Stack AI &amp; Web</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">
                16 Weeks · Next.js 15 &amp; Python GenAI
              </span>
              <span className="text-sm font-bold text-white mt-2">
                ₹45,000 <span className="text-[10px] font-normal text-neutral-400">+ 18% GST</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCourse("super10")}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedCourse === "super10"
                  ? "bg-amber-600/10 border-amber-500 text-white shadow-sm"
                  : "bg-neutral-800/40 border-neutral-700/60 text-neutral-300 hover:border-neutral-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Super10 Elite Cohort</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-300">
                  10 SEATS
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 mt-0.5">
                24 Weeks · 100% Placement Assurance
              </span>
              <span className="text-sm font-bold text-white mt-2">
                ₹75,000 <span className="text-[10px] font-normal text-neutral-400">+ 18% GST</span>
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Paid Summary Card */
        <div className="mb-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Admission Confirmed: {course.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 mt-1">
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
      <div className="rounded-xl bg-black/40 border border-white/5 p-3.5 mb-5 text-xs flex flex-col gap-1.5">
        <div className="flex justify-between text-neutral-400">
          <span>Program Tuition:</span>
          <span>₹{course.baseAmount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-neutral-400">
          <span>Statutory 18% GST (CGST 9% + SGST 9%):</span>
          <span>₹{gstAmount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between font-semibold text-white text-sm pt-2 border-t border-white/10 mt-1">
          <span>Total Payable:</span>
          <span className="text-blue-400 font-bold">₹{totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Action Buttons based on Status */}
      {status === "initiated" && (
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleSimulatePayment}
            className="flex-1 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
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
            onClick={handleSimulateFailure}
            className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl border border-white/10 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel / Failed
          </button>
        </div>
      )}

      {status === "not_paid" && (
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              Payment was not completed. Your cohort seat hold is temporary. Click below to retry.
            </span>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-98 cursor-pointer"
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
            onClick={handleDownloadReceipt}
            className="flex-1 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Official Tax Invoice &amp; Receipt (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadReceipt()}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl border border-white/15 bg-neutral-800/80 hover:bg-neutral-800 text-white text-xs font-medium transition-colors cursor-pointer"
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
