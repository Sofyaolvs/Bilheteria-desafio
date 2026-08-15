import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../lib/api';
import type { EventItem, Seat } from '../types';
import { formatBRL, formatDateTime } from '../lib/format';
import { Badge } from '../components/Badge';
import { SeatMap } from '../components/SeatMap';
import { useAuthStore } from '../lib/auth-store';

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/events/${id}`).then(({ data }) => setEvent(data));
    api.get(`/events/${id}/seats`).then(({ data }) => setSeats(data));
  }, [id]);

  if (!event) return <p className="p-10 text-center font-mono text-sm text-ink/60">Carregando…</p>;

  const isSeated = event.ticketingMode === 'SEATED';
  const total = isSeated
    ? Number(event.price) * selectedSeats.length
    : Number(event.price) * quantity;

  async function reservar() {
    setError('');
    if (!user) {
      navigate('/entrar');
      return;
    }
    if (user.role !== 'CLIENT') {
      setError('Somente contas de cliente podem reservar ingressos.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = isSeated ? { seatIds: selectedSeats } : { quantity };
      const { data } = await api.post(`/events/${id}/reservations`, payload);
      navigate(`/checkout/${data.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível reservar. Tente novamente.'));
      if (isSeated) {
        api.get(`/events/${id}/seats`).then(({ data }) => setSeats(data));
        setSelectedSeats([]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canReserve = isSeated ? selectedSeats.length > 0 : quantity > 0;
  const generalSoldOut = !isSeated && (event.generalAvailable ?? 0) <= 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="stub-shadow mb-6 overflow-hidden border-2 border-ink bg-paper">
        {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="h-56 w-full border-b-2 border-ink object-cover" />}
        <div className="p-6">
          <div className="mb-2 flex gap-2">
            <Badge tone="amber">{event.category === 'FILME' ? 'Filme' : 'Show'}</Badge>
            <Badge>{isSeated ? 'Assento marcado' : 'Pista'}</Badge>
          </div>
          <h1 className="font-display text-3xl font-bold">{event.title}</h1>
          {event.subtitle && <p className="text-ink/70">{event.subtitle}</p>}
          <p className="mt-2 font-mono text-sm text-ink/70">
            {event.venueName} · {event.venueCity} {event.venueAddress ? `· ${event.venueAddress}` : ''}
          </p>
          <p className="font-mono text-sm text-ink/70">{formatDateTime(event.startsAt)}</p>
          {event.description && <p className="mt-3 text-sm text-ink/80">{event.description}</p>}
        </div>
      </div>

      <div className="stub-shadow border-2 border-ink bg-paper p-6">
        <h2 className="mb-4 font-display text-xl font-bold">
          {isSeated ? 'Escolha seus assentos' : 'Escolha a quantidade'}
        </h2>

        {isSeated ? (
          <SeatMap seats={seats} selected={selectedSeats} onToggle={(seatId) => {
            setSelectedSeats((prev) =>
              prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId],
            );
          }} />
        ) : generalSoldOut ? (
          <p className="border-2 border-dashed border-stamp p-4 text-center font-semibold text-stamp">
            Ingressos esgotados para este evento.
          </p>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-10 w-10 border-2 border-ink font-bold hover:bg-marquee-light"
            >
              −
            </button>
            <span className="w-10 text-center font-mono text-xl font-bold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(8, q + 1))}
              className="h-10 w-10 border-2 border-ink font-bold hover:bg-marquee-light"
            >
              +
            </button>
            <span className="text-sm text-ink/60">
              {event.generalAvailable} de {event.generalCapacity} disponíveis
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-3 border-t-2 border-dashed border-ink/30 pt-4">
          <p className="font-mono text-lg font-semibold">Total: {formatBRL(total)}</p>
          {error && <p className="text-sm font-medium text-stamp">{error}</p>}
          <button
            disabled={!canReserve || submitting || generalSoldOut}
            onClick={reservar}
            className="stub-shadow border-2 border-ink bg-marquee px-6 py-2 font-display font-semibold hover:bg-marquee-dark disabled:opacity-50"
          >
            {submitting ? 'Reservando…' : 'Reservar e ir para pagamento'}
          </button>
          <p className="text-xs text-ink/50">
            Sua reserva fica retida por 10 minutos para você concluir o pagamento.
          </p>
        </div>
      </div>
    </div>
  );
}
