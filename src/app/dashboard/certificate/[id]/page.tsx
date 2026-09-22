"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CertificateRecord } from "@/hooks/use-student-certificates";
import { CertificateTemplate } from "@/components/dashboard/certificate-template";

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
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const dataUrl = await toPng(certRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 297, 210);
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
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-8 overflow-auto">
      <div className="scale-[0.5] sm:scale-[0.7] md:scale-100 origin-center transition-transform">
        <CertificateTemplate cert={cert} ref={certRef} />
      </div>
      
      <div className="fixed bottom-8 flex items-center gap-4">
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
