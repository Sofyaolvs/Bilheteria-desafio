import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { EventItem } from '../types';
import { formatBRL, formatDateTime } from '../lib/format';
import { Badge } from '../components/Badge';

export function OrganizerDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/events/mine')
      .then(({ data }) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Painel do organizador</h1>
        <Link
          to="/organizador/novo"
          className="stub-shadow border-2 border-ink bg-marquee px-4 py-2 font-semibold hover:bg-marquee-dark"
        >
          + Novo evento
        </Link>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-ink/60">Carregando…</p>
      ) : events.length === 0 ? (
        <p className="border-2 border-dashed border-ink/30 p-8 text-center text-ink/60">
          Você ainda não publicou nenhum evento.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <div key={event.id} className="stub-shadow flex items-center justify-between gap-4 border-2 border-ink bg-paper p-4">
              <div>
                <div className="mb-1 flex gap-2">
                  <Badge tone="amber">{event.category === 'FILME' ? 'Filme' : 'Show'}</Badge>
                  <Badge>{event.ticketingMode === 'SEATED' ? 'Assento marcado' : 'Pista'}</Badge>
                </div>
                <h3 className="font-display text-lg font-semibold">{event.title}</h3>
                <p className="text-sm text-ink/60">
                  {event.venueName} · {event.venueCity} · {formatDateTime(event.startsAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold">{formatBRL(event.price)}</p>
                <p className="text-xs text-ink/60">
                  {event.ticketingMode === 'GENERAL'
                    ? `${event.generalAvailable}/${event.generalCapacity} disponíveis`
                    : `${event.seatRows! * event.seatsPerRow!} lugares`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
