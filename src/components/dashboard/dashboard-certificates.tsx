"use client";

import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { Award, Lock, Download, ExternalLink, Loader2, ArrowRight } from "lucide-react";
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
  const [selectedCert, setSelectedCert] = useState<CertificateRecord | null>(null);

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
      className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 relative overflow-hidden"
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
            <button
              key={cert.id}
              onClick={() => setSelectedCert(cert)}
              className="flex flex-col sm:flex-row gap-4 p-5 rounded-xl border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all text-left group"
            >
              {/* Course Info */}
              <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                <div className="flex items-center gap-2">
                  {/* <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    CERT-{cert.id.split("-").pop()}
                  </span> */}
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Completed
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground leading-tight mt-1 group-hover:text-emerald-600 transition-colors">
                  {cert.courseName}
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  Issued on {cert.issuedAt}
                </p>
              </div>
              
              {/* Arrow */}
              <div className="flex items-center justify-center shrink-0 sm:px-4 text-muted-foreground group-hover:text-emerald-600 transition-colors mt-2 sm:mt-0">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  View Certificate <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </button>
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

      {/* Certificate Modal Overlay */}
      {selectedCert && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="relative flex flex-col items-center w-full max-w-5xl gap-6">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between w-full bg-background p-4 rounded-2xl shadow-xl">
              <div className="flex flex-col">
                <h3 className="font-semibold text-foreground">{selectedCert.courseName}</h3>
                <p className="text-xs text-muted-foreground">Certificate ID: {selectedCert.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={generating === selectedCert.id}
                  onClick={() => generateAndDownloadPDF(selectedCert.id)}
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating === selectedCert.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {generating === selectedCert.id ? "Generating..." : "Download PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="py-2 px-4 rounded-lg text-sm font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Certificate Preview (Scaled down for screen fitting) */}
            <div className="relative w-full max-w-4xl aspect-[1.414] bg-white rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
               <div className="scale-[0.4] sm:scale-[0.6] md:scale-[0.8] lg:scale-[0.95] origin-center">
                 {/* Re-render the specific template here visually so they can see it */}
                 <CertificateTemplate cert={selectedCert} />
               </div>
            </div>
            
          </div>
        </div>
      )}
    </motion.div>
  );
}
