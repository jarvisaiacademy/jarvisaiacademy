"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CertificateRecord } from "@/hooks/use-student-certificates";
import { Award, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function CertificatePage() {
  const { id } = useParams();
  const router = useRouter();
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCert() {
      if (!id || !db) return;
      try {
        const docRef = doc(db, "certificates", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCert({ id: docSnap.id, ...docSnap.data() } as CertificateRecord);
        } else {
          console.error("Certificate not found");
        }
      } catch (err) {
        console.error("Failed to fetch certificate", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCert();
  }, [id]);

  const generateAndDownloadPDF = async () => {
    if (!certRef.current || !cert) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Temporarily remove any transforms or scaling to ensure sharp render
      const canvas = await html2canvas(certRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      // A4 dimensions in mm: 297 x 210 (Landscape)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      
      pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
      pdf.save(`Jarvis_AI_Academy_Certificate_${cert.id}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading certificate...</div>;
  }

  if (!cert) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <h1 className="text-xl font-bold">Certificate Not Found</h1>
        <button onClick={() => router.back()} className="px-4 py-2 bg-muted rounded-md">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8 print:p-0 print:bg-white">
      {/* 
        A4 Landscape container for printing:
        297mm x 210mm
      */}
      <div 
        ref={certRef}
        className="relative flex flex-col bg-white text-black w-full max-w-[1122px] aspect-[1.414/1] p-12 sm:p-20 border-[12px] border-emerald-900 outline outline-4 outline-offset-[-16px] outline-emerald-700/50 shadow-2xl print:shadow-none print:border-[16px]"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(16, 185, 129, 0.03) 0%, transparent 70%)"
        }}
      >
        <div className="absolute top-12 left-12 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-900 text-white flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase text-emerald-900">JARVIS AI</span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-700">ACADEMY</span>
          </div>
        </div>

        <div className="absolute top-12 right-12 text-right">
          <p className="font-mono text-sm text-neutral-500">ID: {cert.id}</p>
          <p className="font-mono text-sm text-neutral-500">Issued: {cert.issuedAt}</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center mt-8">
          <h1 className="text-5xl sm:text-7xl font-serif text-emerald-950 font-bold tracking-tight mb-4">
            Certificate of Completion
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-2xl font-medium uppercase tracking-widest">
            This certifies that
          </p>
          <h2 className="text-4xl sm:text-6xl font-bold text-black mb-8 border-b-2 border-neutral-200 pb-4 px-12 inline-block">
            {cert.studentName}
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 mb-6 font-medium">
            has successfully completed the immersive programme
          </p>
          <h3 className="text-3xl sm:text-4xl font-bold text-emerald-800 mb-12">
            {cert.courseName}
          </h3>
        </div>

        <div className="flex justify-between items-end mt-auto pt-8 border-t border-neutral-200">
          <div className="flex flex-col gap-1 w-48 text-center">
            <span className="font-serif text-xl italic text-neutral-800 border-b border-neutral-300 pb-2">
              Sugatraj Sarwade
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mt-2">
              Founder & CEO
            </span>
          </div>
          
          <div className="flex items-center justify-center w-32 h-32 rounded-full border-4 border-emerald-100 bg-emerald-50/50 relative">
            <ShieldCheck className="w-12 h-12 text-emerald-600" />
            <div className="absolute -bottom-2 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </div>
          </div>

          <div className="flex flex-col gap-1 w-48 text-center">
            <span className="font-serif text-xl italic text-neutral-800 border-b border-neutral-300 pb-2">
              Lalit Patil
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mt-2">
              Lead Instructor
            </span>
          </div>
        </div>
      </div>
      
      {/* Hide controls when printing */}
      <div className="fixed bottom-8 flex items-center gap-4 print:hidden">
        <button 
          onClick={generateAndDownloadPDF}
          disabled={generating}
          className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full shadow-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generating ? "Generating PDF..." : "Download as PDF"}
        </button>
        <button 
          onClick={() => router.back()} 
          className="px-6 py-3 bg-white text-neutral-800 font-semibold rounded-full shadow-lg hover:bg-neutral-50 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
