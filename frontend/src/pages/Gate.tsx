import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../lib/api';
import type { EventItem, GateResult } from '../types';
import { Badge } from '../components/Badge';

interface ValidateResponse {
  result: GateResult;
  message: string;
  ticket: { code: string; seat: string; eventTitle: string; status: string } | null;
}

const resultTone: Record<GateResult, 'admit' | 'stamp' | 'neutral'> = {
  VALID: 'admit',
  ALREADY_USED: 'stamp',
  WRONG_EVENT: 'stamp',
  INVALID: 'stamp',
};

const resultLabel: Record<GateResult, string> = {
  VALID: '✅ Ingresso válido',
  ALREADY_USED: '⚠️ Já utilizado',
  WRONG_EVENT: '🚫 Evento errado',
  INVALID: '⛔ Inválido',
};

const SCANNER_REGION_ID = 'gate-qr-scanner';

export function Gate() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState('');
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ValidateResponse | null>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    api.get('/events').then(({ data }) => setEvents(data));
  }, []);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  async function validate(body: { code?: string; qrPayload?: string }) {
    setError('');
    if (!eventId) {
      setError('Selecione o evento antes de validar.');
      return;
    }
    try {
      const { data } = await api.post('/gate/validate', { eventId, ...body });
      setResult(data);
    } catch (err) {
      setError('Não foi possível validar. Tente novamente.');
    }
  }

  async function startScanning() {
    setError('');
    if (!eventId) {
      setError('Selecione o evento antes de escanear.');
      return;
    }
    setScanning(true);
    const scanner = new Html5Qrcode(SCANNER_REGION_ID);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        async (decodedText) => {
          await validate({ qrPayload: decodedText });
          await stopScanning();
        },
        () => {
          /* ignora frames sem QR — comportamento esperado a cada frame */
        },
      );
    } catch (err) {
      setError('Não foi possível acessar a câmera. Use a digitação manual do código.');
      setScanning(false);
    }
  }

  async function stopScanning() {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch {
      /* já parado */
    }
    setScanning(false);
  }

  async function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    await validate({ code: code.trim().toUpperCase() });
    setCode('');
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 font-display text-3xl font-bold">Portaria</h1>
      <p className="mb-6 text-sm text-ink/60">
        Selecione o evento, escaneie o QR do ingresso pela câmera ou digite o código manualmente.
      </p>

      <label className="mb-4 flex flex-col gap-1 text-sm font-medium">
        Evento
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="border-2 border-ink bg-white px-3 py-2 text-sm"
        >
          <option value="">Selecione…</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} — {event.venueName}
            </option>
          ))}
        </select>
      </label>

      <div className="stub-shadow mb-4 border-2 border-ink bg-paper p-4">
        {scanning ? (
          <>
            <div id={SCANNER_REGION_ID} className="mx-auto max-w-xs overflow-hidden border-2 border-ink" />
            <button
              onClick={stopScanning}
              className="mt-3 w-full border-2 border-ink bg-paper px-4 py-2 font-semibold hover:bg-marquee-light"
            >
              Parar câmera
            </button>
          </>
        ) : (
          <button
            onClick={startScanning}
            className="w-full border-2 border-ink bg-marquee px-4 py-2 font-display font-semibold hover:bg-marquee-dark"
          >
            📷 Ler QR pela câmera
          </button>
        )}
      </div>

      <form onSubmit={onManualSubmit} className="mb-4 flex gap-2">
        <input
          placeholder="Digitação manual do código"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 border-2 border-ink bg-paper px-3 py-2 font-mono text-sm uppercase outline-none focus:bg-marquee-light"
        />
        <button className="border-2 border-ink bg-paper px-4 py-2 font-semibold hover:bg-marquee-light">
          Validar
        </button>
      </form>

      {error && <p className="mb-4 text-sm font-medium text-stamp">{error}</p>}

      {result && (
        <div className="stub-shadow border-2 border-ink bg-paper p-5">
          <div className="mb-2">
            <Badge tone={resultTone[result.result]}>{resultLabel[result.result]}</Badge>
          </div>
          <p className="text-sm">{result.message}</p>
          {result.ticket && (
            <div className="mt-3 border-t-2 border-dashed border-ink/30 pt-3 font-mono text-sm">
              <p>Evento: {result.ticket.eventTitle}</p>
              <p>Lugar: {result.ticket.seat}</p>
              <p>Código: {result.ticket.code}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
