import type { ReactNode } from "react";

type Range = readonly [number, number];

export function highlightText(text: string, ranges?: readonly Range[]): ReactNode {
  if (!ranges || ranges.length === 0) return text;

  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const parts: ReactNode[] = [];
  let cursor = 0;

  sorted.forEach(([start, end], i) => {
    if (start > text.length) return;
    const safeEnd = Math.min(end, text.length - 1);
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(<mark key={i}>{text.slice(start, safeEnd + 1)}</mark>);
    cursor = safeEnd + 1;
  });

  if (cursor < text.length) parts.push(text.slice(cursor));

  return parts;
}
