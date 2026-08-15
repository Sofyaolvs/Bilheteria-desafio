import { Link } from 'react-router-dom';
import type { EventItem } from '../types';
import { formatBRL, formatDateTime } from '../lib/format';
import { Badge } from './Badge';
import { DoodleArrow } from './Doodles';

export function EventCard({ event }: { event: EventItem }) {
  const soldOut =
    event.ticketingMode === 'GENERAL' ? (event.generalAvailable ?? 0) <= 0 : false;

  return (
    <Link
      to={`/eventos/${event.id}`}
      className="stub-shadow group flex flex-col overflow-hidden border-2 border-ink bg-paper transition-transform hover:-translate-y-0.5"
    >
      <div className="relative h-40 overflow-hidden border-b-2 border-ink bg-ink">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          <Badge tone="amber">{event.category === 'FILME' ? 'Filme' : 'Show'}</Badge>
          <Badge tone={event.ticketingMode === 'SEATED' ? 'neutral' : 'neutral'}>
            {event.ticketingMode === 'SEATED' ? 'Assento marcado' : 'Pista'}
          </Badge>
        </div>
        {soldOut && (
          <div className="absolute right-2 top-2">
            <Badge tone="stamp">Esgotado</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-display text-lg font-semibold leading-tight">{event.title}</h3>
        <p className="text-sm text-ink/70">{event.venueName} · {event.venueCity}</p>
        <p className="font-mono text-xs text-ink/60">{formatDateTime(event.startsAt)}</p>
        <div className="mt-2 flex items-center justify-between border-t-2 border-dashed border-ink/30 pt-2">
          <span className="font-mono text-base font-semibold">{formatBRL(event.price)}</span>
          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-marquee-dark">
            Ver evento
            <DoodleArrow className="h-3 w-5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
