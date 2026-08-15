import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../lib/api';
import type { Reservation } from '../types';
import { formatBRL } from '../lib/format';

export function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [declined, setDeclined] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/reservations/${id}`).then(({ data }) => setReservation(data));
  }, [id]);

  useEffect(() => {
    if (!reservation) return;
    const tick = () => {
      const diff = Math.floor((new Date(reservation.holdsExpireAt).getTime() - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, diff));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [reservation]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setDeclined(false);
    setLoading(true);
    try {
      const { data } = await api.post(`/reservations/${id}/pay`, {
        cardHolder,
        cardNumber,
        expiry,
        cvv,
      });
      if (data.payment.status === 'DECLINED') {
        setDeclined(true);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível processar o pagamento.'));
    } finally {
      setLoading(false);
    }
  }

  async function onCancel() {
    if (!id) return;
    setCancelling(true);
    setError('');
    try {
      await api.delete(`/reservations/${id}`);
      navigate(reservation?.eventId ? `/eventos/${reservation.eventId}` : '/');
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível cancelar a reserva.'));
      setCancelling(false);
    }
  }

  if (!reservation) return <p className="p-10 text-center font-mono text-sm text-ink/60">Carregando…</p>;

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="stub-shadow border-2 border-admit bg-paper p-8">
          <p className="mb-2 text-5xl">✅</p>
          <h1 className="mb-2 font-display text-2xl font-bold">Pagamento aprovado!</h1>
          <p className="mb-6 text-sm text-ink/70">Seu(s) ingresso(s) já estão disponíveis, com QR code.</p>
          <Link
            to="/meus-ingressos"
            className="stub-shadow inline-block border-2 border-ink bg-marquee px-5 py-2 font-display font-semibold hover:bg-marquee-dark"
          >
            Ver meus ingressos
          </Link>
        </div>
      </div>
    );
  }

  const expired = secondsLeft === 0;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-1 font-display text-2xl font-bold">Pagamento (simulado)</h1>
      <p className="mb-4 text-sm text-ink/60">
        Nenhuma cobrança real é feita. Use qualquer número de cartão para aprovar — números
        terminados em <span className="font-mono font-semibold">0000</span> são recusados de
        propósito, para testar o fluxo de recusa.
      </p>

      <div className="stub-shadow mb-4 flex items-center justify-between border-2 border-ink bg-paper px-4 py-3">
        <span className="font-mono text-sm">Total a pagar</span>
        <span className="font-mono text-lg font-bold">{formatBRL(reservation.totalPrice)}</span>
      </div>

      {secondsLeft !== null && !expired && (
        <p className="mb-4 text-center font-mono text-sm text-ink/60">
          Reserva expira em <span className="font-semibold text-stamp">{secondsLeft}s</span>
        </p>
      )}

      {expired ? (
        <div className="border-2 border-dashed border-stamp p-6 text-center">
          <p className="mb-3 font-semibold text-stamp">O tempo para pagamento expirou.</p>
          <Link to="/" className="font-semibold underline">
            Voltar para eventos e reservar novamente
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="stub-shadow flex flex-col gap-4 border-2 border-ink bg-paper p-6">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Nome no cartão
            <input
              required
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              className="border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:bg-marquee-light"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Número do cartão
            <input
              required
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="border-2 border-ink bg-white px-3 py-2 font-mono text-sm outline-none focus:bg-marquee-light"
            />
          </label>
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
              Validade
              <input
                required
                placeholder="MM/AA"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="border-2 border-ink bg-white px-3 py-2 font-mono text-sm outline-none focus:bg-marquee-light"
              />
            </label>
            <label className="flex w-24 flex-col gap-1 text-sm font-medium">
              CVV
              <input
                required
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="border-2 border-ink bg-white px-3 py-2 font-mono text-sm outline-none focus:bg-marquee-light"
              />
            </label>
          </div>

          {declined && (
            <p className="border-2 border-stamp bg-stamp/10 p-3 text-sm font-medium text-stamp">
              Pagamento recusado pela operadora simulada. Sua reserva continua retida — tente com
              outro número de cartão.
            </p>
          )}
          {error && <p className="text-sm font-medium text-stamp">{error}</p>}

          <button
            disabled={loading || cancelling}
            className="stub-shadow border-2 border-ink bg-marquee px-4 py-2 font-display font-semibold hover:bg-marquee-dark disabled:opacity-60"
          >
            {loading ? 'Processando…' : `Pagar ${formatBRL(reservation.totalPrice)}`}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading || cancelling}
            className="text-sm font-medium text-ink/60 underline hover:text-stamp disabled:opacity-60"
          >
            {cancelling ? 'Cancelando…' : 'Cancelar reserva e liberar o(s) lugar(es)'}
          </button>
        </form>
      )}
    </div>
  );
}
