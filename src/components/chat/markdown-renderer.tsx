"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, ExternalLink } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  onCitationClick?: (citationId: string) => void;
}

export function MarkdownRenderer({ content, onCitationClick }: MarkdownRendererProps) {
  return (
    <div className="prose dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 text-[15px] leading-relaxed break-words space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-7">{children}</p>,
          h1: ({ children }) => (
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mt-4 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-3 mb-1.5 first:mt-0">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 space-y-1.5 my-2.5 text-neutral-700 dark:text-neutral-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 space-y-1.5 my-2.5 text-neutral-700 dark:text-neutral-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-neutral-900 dark:text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-neutral-800 dark:text-neutral-200">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#9d5932] pl-4 italic text-neutral-600 dark:text-neutral-400 my-2.5">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ea580c] hover:text-[#f97316] underline underline-offset-2 inline-flex items-center gap-0.5"
            >
              {children}
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-white/10 rounded-lg">
              <table className="w-full text-left text-sm text-neutral-300 border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#1e1e1e] text-xs uppercase font-medium text-neutral-400 border-b border-white/10">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/5">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="hover:bg-white/[0.02]">{children}</tr>,
          th: ({ children }) => <th className="px-3.5 py-2.5 font-medium">{children}</th>,
          td: ({ children }) => <td className="px-3.5 py-2.5 text-neutral-300">{children}</td>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="bg-[#2a2a2a] text-[#f59e0b] px-1.5 py-0.5 rounded text-[13px] font-mono border border-white/5"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const codeString = String(children).replace(/\n$/, "");
            const language = match ? match[1] : "code";

            return <CodeBlock language={language} code={codeString} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden bg-[#171717] border border-white/10 font-mono text-xs">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#212121] text-neutral-400 border-b border-white/5 text-[11px]">
        <span className="uppercase tracking-wider">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      {/* Code Body */}
      <div className="p-4 overflow-x-auto text-neutral-200 leading-relaxed selection:bg-[#9d5932] selection:text-white">
        <code>{code}</code>
      </div>
    </div>
  );
}
