import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { Badge } from '../components/Badge';

interface SharedTicketData {
  eventTitle: string;
  venueName: string;
  startsAt: string;
  ownerFirstName: string;
  seat: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  code: string;
}

const statusTone = { VALID: 'admit', USED: 'neutral', CANCELLED: 'stamp' } as const;
const statusLabel = { VALID: 'Válido', USED: 'Já utilizado', CANCELLED: 'Cancelado' };

export function SharedTicket() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedTicketData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/tickets/shared/${token}`)
      .then(({ data }) => setData(data))
      .catch(() => setNotFound(true));
  }, [token]);

  if (notFound) {
    return <p className="p-16 text-center text-ink/60">Este link de ingresso não é válido.</p>;
  }
  if (!data) return <p className="p-16 text-center font-mono text-sm text-ink/60">Carregando…</p>;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="mb-3 text-center text-sm text-ink/60">{data.ownerFirstName} compartilhou este ingresso com você</p>
      <div className="stub-shadow border-2 border-ink bg-paper p-6 text-center">
        <div className="mb-3 flex justify-center">
          <Badge tone={statusTone[data.status]}>{statusLabel[data.status]}</Badge>
        </div>
        <h1 className="font-display text-2xl font-bold">{data.eventTitle}</h1>
        <p className="mt-1 text-sm text-ink/70">{data.venueName}</p>
        <p className="font-mono text-sm text-ink/70">{formatDateTime(data.startsAt)}</p>
        <p className="mt-4 font-mono text-lg font-semibold">Lugar: {data.seat}</p>
        <p className="mt-4 text-xs text-ink/50">
          Este link não substitui o ingresso original — quem for entrar precisa apresentar o QR
          na portaria.
        </p>
      </div>
    </div>
  );
}
