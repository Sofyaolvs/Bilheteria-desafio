import type { SVGProps } from 'react';

export function DoodleStar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 3c1 6 2 10 5 13s7 4 13 5c-6 1-10 2-13 5s-4 7-5 13c-1-6-2-10-5-13S8 22 2 21c6-1 10-2 13-5s4-7 5-13Z" />
    </svg>
  );
}

export function DoodleSparkle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19" />
    </svg>
  );
}

export function DoodleSquiggle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" {...props}>
      <path d="M2 10c6-9 12-9 18 0s12 9 18 0 12-9 18 0 12 9 18 0 12-9 18 0 12 9 18 0" />
    </svg>
  );
}

export function DoodleCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" {...props}>
      <path d="M60 4C24 2 5 14 6 30c1 17 26 27 55 26 30-1 54-13 53-29C113 12 87 5 60 6" />
    </svg>
  );
}

export function DoodleArrow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 20c14-3 30-1 45-1" />
      <path d="M35 8c6 5 11 8 13 11-3 4-8 8-11 15" />
    </svg>
  );
}

export function DoodleFilmReel(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M20 4C11 4 4 11 4 20s7 16 16 16 16-7 16-16S29 4 20 4Z" />
      <circle cx="20" cy="10" r="3" />
      <circle cx="30" cy="20" r="3" />
      <circle cx="20" cy="30" r="3" />
      <circle cx="10" cy="20" r="3" />
      <circle cx="20" cy="20" r="4" />
    </svg>
  );
}

export function DoodleTicketStub(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 10c0-4 1-6 5-6h32c4 0 5 2 5 6-3 0-3 2-3 6s0 6 3 6c0 4-1 6-5 6H8c-4 0-5-2-5-6 3 0 3-2 3-6s0-6-3-6Z" />
      <path d="M33 5v22" strokeDasharray="2 3" />
    </svg>
  );
}
