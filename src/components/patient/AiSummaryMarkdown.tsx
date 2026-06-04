"use client";

import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-indigo-950">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

interface AiSummaryMarkdownProps {
  content: string;
  className?: string;
}

export function AiSummaryMarkdown({ content, className }: AiSummaryMarkdownProps) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line) => line.trim() !== "");
        if (lines.length === 0) return null;

        const first = lines[0];
        if (first.startsWith("### ")) {
          return (
            <h4
              key={blockIndex}
              className="mt-4 mb-2 text-base font-bold text-indigo-950 first:mt-0"
            >
              {renderInline(first.slice(4))}
            </h4>
          );
        }
        if (first.startsWith("## ")) {
          return (
            <h3
              key={blockIndex}
              className="mt-4 mb-2 text-lg font-bold text-indigo-950 first:mt-0"
            >
              {renderInline(first.slice(3))}
            </h3>
          );
        }
        if (first.startsWith("# ")) {
          return (
            <h2
              key={blockIndex}
              className="mt-4 mb-2 text-xl font-bold text-indigo-950 first:mt-0"
            >
              {renderInline(first.slice(2))}
            </h2>
          );
        }

        const isBulletList = lines.every((l) => /^[-*]\s+/.test(l.trim()));
        if (isBulletList) {
          return (
            <ul
              key={blockIndex}
              className="my-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-indigo-950"
            >
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        const isNumberedList = lines.every((l) => /^\d+\.\s+/.test(l.trim()));
        if (isNumberedList) {
          return (
            <ol
              key={blockIndex}
              className="my-3 list-decimal space-y-2 pl-6 text-base leading-relaxed text-indigo-950"
            >
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.replace(/^\d+\.\s+/, ""))}</li>
              ))}
            </ol>
          );
        }

        return (
          <p
            key={blockIndex}
            className="my-2 text-base leading-relaxed text-indigo-950 first:mt-0 last:mb-0"
          >
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
