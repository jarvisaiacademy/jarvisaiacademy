import React, { forwardRef } from "react";
import { Award, ShieldCheck, CheckCircle2 } from "lucide-react";
import { CertificateRecord } from "@/hooks/use-student-certificates";

interface CertificateTemplateProps {
  cert: CertificateRecord;
}

export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ cert }, ref) => {
    return (
      <div 
        ref={ref}
        className="relative flex flex-col bg-[#ffffff] text-[#000000] w-[1122px] h-[793.5px] p-20 border-[12px] border-[#064e3b] outline outline-4 outline-offset-[-16px] outline-[#04785780] shadow-none"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(16, 185, 129, 0.03) 0%, transparent 70%)"
        }}
      >
        <div className="absolute top-12 left-12 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#064e3b] text-[#ffffff] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase text-[#064e3b]">JARVIS AI</span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#047857]">ACADEMY</span>
          </div>
        </div>

        <div className="absolute top-12 right-12 text-right">
          <p className="font-mono text-sm text-[#737373]">ID: {cert.id}</p>
          <p className="font-mono text-sm text-[#737373]">Issued: {cert.issuedAt}</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center mt-8">
          <h1 className="text-7xl font-serif text-[#022c22] font-bold tracking-tight mb-4">
            Certificate of Completion
          </h1>
          <p className="text-xl text-[#525252] mb-8 max-w-2xl font-medium uppercase tracking-widest">
            This certifies that
          </p>
          <h2 className="text-6xl font-bold text-[#000000] mb-8 border-b-2 border-[#e5e5e5] pb-4 px-12 inline-block">
            {cert.studentName}
          </h2>
          <p className="text-xl text-[#525252] mb-6 font-medium">
            has successfully completed the immersive programme
          </p>
          <h3 className="text-4xl font-bold text-[#065f46] mb-12">
            {cert.courseName}
          </h3>
        </div>

        <div className="flex justify-between items-end mt-auto pt-8 border-t border-[#e5e5e5]">
          <div className="flex flex-col gap-1 w-48 text-center">
            <span className="font-serif text-xl italic text-[#262626] border-b border-[#d4d4d4] pb-2">
              Sugatraj Sarwade
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373] mt-2">
              Founder & CEO
            </span>
          </div>
          
          <div className="flex items-center justify-center w-32 h-32 rounded-full border-4 border-[#d1fae5] bg-[#ecfdf580] relative">
            <ShieldCheck className="w-12 h-12 text-[#059669]" />
            <div className="absolute -bottom-2 bg-[#059669] text-[#ffffff] text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </div>
          </div>

          <div className="flex flex-col gap-1 w-48 text-center">
            <span className="font-serif text-xl italic text-[#262626] border-b border-[#d4d4d4] pb-2">
              Lalit Patil
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373] mt-2">
              Lead Instructor
            </span>
          </div>
        </div>
      </div>
    );
  }
);
CertificateTemplate.displayName = "CertificateTemplate";
