"use client";

import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { Award, Lock, Download, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useStudentEnrollments } from "@/hooks/use-student-enrollments";
import { CertificateRecord } from "@/hooks/use-student-certificates";
import { CertificateTemplate } from "@/components/dashboard/certificate-template";

export function DashboardCertificates() {
  const { user } = useAuth();
  const enrollments = useStudentEnrollments(user?.email);
  
  // Map paid enrollments directly to certificates for the MVP
  const certificates: CertificateRecord[] = enrollments
    .filter(e => e.action === "paid")
    .map(e => ({
      id: `JAA-2026-${e.id?.substring(0, 4).toUpperCase() || "ABCD"}`,
      courseId: e.courseId,
      courseName: e.courseName,
      studentName: e.studentName,
      studentEmail: e.studentEmail,
      issuedAt: new Date(e.timestamp || "2026-09-22T00:00:00Z").toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      })
    }));

  const certRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [generating, setGenerating] = useState<string | null>(null);

  const generateAndDownloadPDF = async (certId: string) => {
    const el = certRefs.current[certId];
    if (!el) return;
    setGenerating(certId);
    try {
      const { toJpeg } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const dataUrl = await toJpeg(el, {
        pixelRatio: 2, // High resolution
        backgroundColor: "#ffffff",
        quality: 0.95, // Visually lossless, heavily compressed size
      });
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true, // Enable PDF object compression
      });

      // Use FAST compression alias for the image
      pdf.addImage(dataUrl, "JPEG", 0, 0, 297, 210, undefined, "FAST");
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
        <div className="flex flex-col gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col sm:flex-row gap-4 p-5 rounded-xl border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all"
            >
              {/* Course Info */}
              <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    CERT-{cert.id.split("-").pop()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Completed
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground leading-tight mt-1">
                  {cert.courseName}
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  Issued on {cert.issuedAt}
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0 sm:min-w-[200px] justify-center mt-2 sm:mt-0">
                <button
                  type="button"
                  disabled={generating === cert.id}
                  onClick={() => generateAndDownloadPDF(cert.id)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating === cert.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {generating === cert.id ? "Generating..." : "Download PDF"}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + `/dashboard/certificate/${cert.id}`);
                    alert("Verification link copied to clipboard!");
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-medium border border-border bg-transparent hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Copy Verification Link
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
