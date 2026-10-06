"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, ExternalLink } from "lucide-react";
import { DevIcon, iconKeyFor } from "@/components/ui/dev-icon";
import { SOCIAL_PLATFORMS } from "@/components/common/social-links";

interface MarkdownRendererProps {
  content: string;
  /** Runs an inline `#ask:` link — the href carries the prompt to send. */
  onPromptClick?: (prompt: string) => void;
}

/** Prefix for in-message links that send a prompt instead of navigating.
 *  Relative, so react-markdown's url transform leaves it intact. */
const ASK_PREFIX = "#ask:";

/**
 * Recursively extract the plain-text content from a React child tree so the li
 * renderer can detect "**Tech Stack**: …" items regardless of how ReactMarkdown
 * wraps the strong/text nodes.
 */
function childrenToText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(childrenToText).join("");
  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>;
    return childrenToText(el.props.children);
  }
  return "";
}

export function MarkdownRenderer({ content, onPromptClick }: MarkdownRendererProps) {
  return (
    <div className="prose dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 text-[15px] leading-relaxed break-words space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => {
            const text = childrenToText(children);
            const techMatch = /^\s*Tech Stack\s*:\s*(.+)$/i.exec(text);
            if (techMatch) {
              const techs = techMatch[1].split(",").map((t) => t.trim()).filter(Boolean);
              return (
                <p className="mb-3 last:mb-0 leading-7">
                  <strong className="font-semibold text-neutral-900 dark:text-white">Tech Stack</strong>
                  <span className="text-neutral-700 dark:text-neutral-300">: </span>
                  <span className="inline-flex flex-wrap items-center gap-1.5 ml-1 align-middle">
                    {techs.map((tech) => {
                      const key = iconKeyFor(tech);
                      return (
                        <span
                          key={tech}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 leading-none h-6"
                        >
                          {key && <DevIcon name={key} size={12} />}
                          <span>{tech}</span>
                        </span>
                      );
                    })}
                  </span>
                </p>
              );
            }
            return <p className="mb-3 last:mb-0 leading-7">{children}</p>;
          },
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
          li: ({ children }) => {
            const text = childrenToText(children);
            // Detect "Tech Stack: item1, item2" list items and render icon chips
            const techMatch = /^\s*Tech Stack\s*:\s*(.+)$/i.exec(text);
            if (techMatch) {
              const techs = techMatch[1].split(",").map((t) => t.trim()).filter(Boolean);
              return (
                <li className="leading-relaxed pl-1">
                  <span className="font-semibold text-neutral-900 dark:text-white">Tech Stack</span>
                  <span className="text-neutral-700 dark:text-neutral-300">: </span>
                  <span className="inline-flex flex-wrap items-center gap-1.5 ml-1">
                    {techs.map((tech) => {
                      const key = iconKeyFor(tech);
                      return (
                        <span
                          key={tech}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10"
                        >
                          {key && <DevIcon name={key} size={12} />}
                          <span>{tech}</span>
                        </span>
                      );
                    })}
                  </span>
                </li>
              );
            }

            // Detect Social Links
            const socialMatch = /^\s*(LinkedIn|Instagram|YouTube|Facebook|X \(Twitter\))\s*:/i.exec(text);
            if (socialMatch) {
              const platformName = socialMatch[1];
              const platform = SOCIAL_PLATFORMS.find(p => p.name.toLowerCase() === platformName.toLowerCase());
              if (platform) {
                return (
                  <li className="leading-relaxed pl-1 flex items-start gap-2 mb-1.5">
                    <span className={`mt-0.5 shrink-0 ${platform.color}`}>{platform.svg}</span>
                    <span className="flex-1">{children}</span>
                  </li>
                );
              }
            }

            return <li className="leading-relaxed pl-1">{children}</li>;
          },
          strong: ({ children }) => <strong className="font-semibold text-neutral-900 dark:text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-neutral-800 dark:text-neutral-200">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#9d5932] pl-4 italic text-neutral-600 dark:text-neutral-400 my-2.5">
              {children}
            </blockquote>
          ),
          img: ({ src, alt }) => (
            // The testimonials reply puts a portrait before each name, so images here
            // are always avatars. Plain <img>: these are static files under
            // `public/testimonials/`, and next/image would need a fixed size at build
            // time for what is only ever one small round thumbnail.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === "string" ? src : ""}
              alt={alt ?? ""}
              loading="lazy"
              className="inline-block w-14 h-14 rounded-full object-cover align-middle mr-2.5 bg-neutral-200 dark:bg-white/10"
            />
          ),
          a: ({ href, children }) => {
            if (href?.startsWith(ASK_PREFIX)) {
              const prompt = decodeURIComponent(href.slice(ASK_PREFIX.length));
              const askClass =
                "text-[#9d5932] dark:text-[#ea580c] hover:text-[#7c4424] dark:hover:text-[#f97316] font-medium underline underline-offset-2 cursor-pointer";
              // No handler means this copy is being rendered outside the chat — on a
              // public course page, where a function prop cannot cross the server
              // boundary. The ask becomes a link that carries the question into the
              // chat rather than a button that swallows the click.
              if (!onPromptClick) {
                return (
                  <a href={`/?q=${encodeURIComponent(prompt)}`} className={askClass}>
                    {children}
                  </a>
                );
              }
              return (
                <button type="button" onClick={() => onPromptClick(prompt)} className={askClass}>
                  {children}
                </button>
              );
            }
            const isMailto = href?.startsWith("mailto:");
            return (
              <a
                href={href}
                target={isMailto ? undefined : "_blank"}
                rel={isMailto ? undefined : "noopener noreferrer"}
                className="text-[#9d5932] dark:text-[#ea580c] hover:text-[#7c4424] dark:hover:text-[#f97316] font-medium underline underline-offset-2 inline-flex items-center gap-0.5 break-all"
              >
                <span>{children}</span>
                {!isMailto && <ExternalLink className="w-3 h-3 inline shrink-0 opacity-70" />}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-neutral-200 dark:border-white/10 rounded-2xl">
              <table className="w-full text-left text-sm text-neutral-800 dark:text-neutral-300 border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-100 dark:bg-[#1e1e1e] text-xs uppercase font-medium text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="hover:bg-neutral-50 dark:hover:bg-white/[0.02]">{children}</tr>,
          th: ({ children }) => <th className="px-3.5 py-2.5 font-medium">{children}</th>,
          td: ({ children }) => <td className="px-3.5 py-2.5 text-neutral-700 dark:text-neutral-300">{children}</td>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-1.5 py-0.5 rounded text-[13px] font-mono border border-neutral-200 dark:border-white/10 font-medium"
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
    <div className="relative my-3 rounded-2xl overflow-hidden bg-[#171717] border border-white/10 font-mono text-xs">
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
