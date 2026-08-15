import type { Ticket } from '../types';
import { formatBRL, formatDateTime } from '../lib/format';
import { Badge } from './Badge';
import { DoodleCircle } from './Doodles';

const statusTone: Record<string, 'admit' | 'stamp' | 'neutral'> = {
  VALID: 'admit',
  USED: 'neutral',
  CANCELLED: 'stamp',
};

const statusLabel: Record<string, string> = {
  VALID: 'Válido',
  USED: 'Utilizado',
  CANCELLED: 'Cancelado',
};

export function TicketStub({ ticket }: { ticket: Ticket }) {
  const event = ticket.event;
  return (
    <div className="stub-shadow flex flex-col overflow-hidden border-2 border-ink bg-paper sm:flex-row">
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between">
          <Badge tone="amber">{event?.category === 'FILME' ? 'Filme' : 'Show'}</Badge>
          <span className="relative inline-block">
            <Badge tone={statusTone[ticket.status] ?? 'neutral'}>{statusLabel[ticket.status]}</Badge>
            {ticket.status === 'VALID' && (
              <DoodleCircle className="pointer-events-none absolute -inset-x-2 -inset-y-1.5 h-[calc(100%+12px)] w-[calc(100%+16px)] text-admit" />
            )}
          </span>
        </div>
        <h3 className="font-display text-xl font-bold leading-tight">{event?.title}</h3>
        <p className="text-sm text-ink/70">
          {event?.venueName} · {event?.venueCity}
        </p>
        {event && <p className="font-mono text-xs text-ink/60">{formatDateTime(event.startsAt)}</p>}
        <div className="mt-2 flex items-center gap-6 border-t-2 border-dashed border-ink/30 pt-3 font-mono text-sm">
          <span>
            <span className="block text-[10px] uppercase text-ink/50">Lugar</span>
            {ticket.seat ? `${ticket.seat.row}${ticket.seat.number}` : 'Pista'}
          </span>
          {event && (
            <span>
              <span className="block text-[10px] uppercase text-ink/50">Valor</span>
              {formatBRL(event.price)}
            </span>
          )}
        </div>
      </div>

      <div className="ticket-perforation flex w-full flex-col items-center justify-center gap-2 bg-paper-dim p-5 sm:w-48">
        {ticket.qrCode ? (
          <img src={ticket.qrCode} alt="QR code do ingresso" className="h-32 w-32 border-2 border-ink bg-white p-1" />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center border-2 border-ink bg-white text-xs text-ink/50">
            QR
          </div>
        )}
        <span className="font-mono text-sm font-semibold tracking-widest">{ticket.code}</span>
        <span className="text-center text-[10px] text-ink/50">
          Apresente este QR na portaria ou digite o código
        </span>
      </div>
    </div>
  );
}
