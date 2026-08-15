import type { ReactNode } from 'react';

const tones: Record<string, string> = {
  neutral: 'bg-ink text-paper',
  amber: 'bg-marquee text-ink',
  admit: 'bg-admit text-paper',
  stamp: 'bg-stamp text-paper',
};

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-none border-2 border-ink px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
