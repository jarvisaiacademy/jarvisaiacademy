"use client";

import React, { useState } from "react";
import { BookOpen, ExternalLink, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface CitationItem {
  id: string;
  number: number;
  title: string;
  source: string;
  snippet: string;
  url?: string;
}

interface CitationsViewProps {
  citations: CitationItem[];
}

export function CitationsView({ citations }: CitationsViewProps) {
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-white/5">
      <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2 flex items-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
        <span>Sources & Verification</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {citations.map((cite) => (
          <button
            key={cite.id}
            type="button"
            onClick={() => setSelectedCitation(cite)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#212121] hover:bg-[#2a2a2a] border border-white/10 hover:border-white/20 text-xs text-neutral-300 hover:text-white transition-all text-left"
          >
            <span className="w-4 h-4 rounded-full bg-white/10 text-[10px] font-mono flex items-center justify-center text-neutral-300">
              {cite.number}
            </span>
            <span className="truncate max-w-[180px] sm:max-w-[240px] font-medium">
              {cite.title}
            </span>
          </button>
        ))}
      </div>

      {/* Citation Detail Modal / Card */}
      <AnimatePresence>
        {selectedCitation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md bg-[#1f1f1f] border border-white/15 rounded-2xl p-5 shadow-2xl relative"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#ea580c]/20 text-[#ea580c] text-xs font-mono font-bold flex items-center justify-center">
                    {selectedCitation.number}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {selectedCitation.title}
                    </h4>
                    <p className="text-xs text-neutral-400">{selectedCitation.source}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCitation(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#141414] rounded-xl p-3 text-xs text-neutral-300 leading-relaxed border border-white/5 my-3">
                <p className="italic font-serif">"{selectedCitation.snippet}"</p>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-white/5">
                <span>Verified Academy Record</span>
                {selectedCitation.url && (
                  <a
                    href={selectedCitation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#ea580c] hover:text-[#f97316] font-medium transition-colors"
                  >
                    <span>View Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
