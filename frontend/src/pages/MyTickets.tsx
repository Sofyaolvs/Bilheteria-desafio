import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Ticket } from '../types';
import { TicketStub } from '../components/TicketStub';

export function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/me/tickets')
      .then(({ data }) => setTickets(data))
      .finally(() => setLoading(false));
  }, []);

  function copyShareLink(ticket: Ticket) {
    const url = `${window.location.origin}${ticket.shareUrl}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(ticket.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 font-display text-3xl font-bold">Meus ingressos</h1>
      <p className="mb-6 text-sm text-ink/60">
        Apresente o QR na portaria ou compartilhe o ingresso por link com quem for te acompanhar.
      </p>

      {loading ? (
        <p className="font-mono text-sm text-ink/60">Carregando…</p>
      ) : tickets.length === 0 ? (
        <p className="border-2 border-dashed border-ink/30 p-8 text-center text-ink/60">
          Você ainda não tem ingressos. Escolha um evento na página inicial.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="flex flex-col gap-2">
              <TicketStub ticket={ticket} />
              <button
                onClick={() => copyShareLink(ticket)}
                className="self-start border-2 border-ink bg-paper px-3 py-1 text-xs font-semibold hover:bg-marquee-light"
              >
                {copiedId === ticket.id ? 'Link copiado!' : 'Copiar link de compartilhamento'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
