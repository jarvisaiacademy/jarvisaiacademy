"use client";

import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { Award, Lock, Download, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useStudentCertificates } from "@/hooks/use-student-certificates";
import { CertificateTemplate } from "@/components/dashboard/certificate-template";

export function DashboardCertificates() {
  const { user } = useAuth();
  const certificates = useStudentCertificates(user?.email);
  const certRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [generating, setGenerating] = useState<string | null>(null);

  const generateAndDownloadPDF = async (certId: string) => {
    const el = certRefs.current[certId];
    if (!el) return;
    setGenerating(certId);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
      pdf.save(`Jarvis_AI_Academy_Certificate_${certId}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 relative overflow-hidden"
    >
      {/* Hidden container for rendering certificates before PDF generation */}
      <div className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none">
        {certificates.map((cert) => (
          <CertificateTemplate
            key={`template-${cert.id}`}
            cert={cert}
            ref={(el) => {
              certRefs.current[cert.id] = el;
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-foreground">My Certificates</h2>
        <p className="text-sm text-muted-foreground">
          Official credentials issued by Jarvis AI Academy upon course completion.
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-border/80 hover:shadow-sm transition-all"
            >
              <div className="p-5 flex flex-col gap-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-muted text-muted-foreground">
                    {cert.id}
                  </span>
                </div>
                
                <div className="flex flex-col min-w-0">
                  <h3 className="text-base font-semibold text-foreground leading-tight line-clamp-2">
                    {cert.courseName}
                  </h3>
                  <span className="text-sm text-muted-foreground mt-1">
                    Issued {cert.issuedAt}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-muted/20">
                <button
                  type="button"
                  disabled={generating === cert.id}
                  onClick={() => generateAndDownloadPDF(cert.id)}
                  className="flex items-center justify-center gap-2 py-3 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating === cert.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {generating === cert.id ? "Generating..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + `/dashboard/certificate/${cert.id}`);
                    alert("Verification link copied to clipboard!");
                  }}
                  className="flex items-center justify-center gap-2 py-3 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Copy Link
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-5 py-16 text-center border border-dashed border-border rounded-2xl bg-muted/10">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-muted text-muted-foreground">
            <Award className="w-8 h-8 opacity-50" />
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-background border border-border">
              <Lock className="w-2.5 h-2.5 text-muted-foreground" />
            </span>
          </div>

          <div className="flex flex-col gap-2 max-w-xs">
            <h3 className="text-base font-semibold text-foreground">No certificates yet</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Complete a course to earn your certificate. Each one comes with a unique{" "}
              <span className="font-mono font-medium text-foreground">JAA-2026-XXXX</span>{" "}
              serial and a scannable QR code.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
