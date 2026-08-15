import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { EventItem } from '../types';
import { EventCard } from '../components/EventCard';
import { DoodleFilmReel, DoodleSparkle, DoodleSquiggle, DoodleStar } from '../components/Doodles';

export function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q) params.q = q;
      if (city) params.city = city;
      if (date) params.date = date;
      const { data } = await api.get('/events', { params });
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="stub-shadow relative mb-8 overflow-hidden border-2 border-ink bg-ink p-8 text-paper">
        <DoodleStar className="pointer-events-none absolute -right-2 top-4 h-14 w-14 rotate-6 text-marquee/70" />
        <DoodleFilmReel className="pointer-events-none absolute bottom-3 right-20 hidden h-10 w-10 -rotate-12 text-paper/20 sm:block" />
        <DoodleSparkle className="pointer-events-none absolute bottom-6 left-6 h-6 w-6 text-marquee/60" />
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-marquee">
          Bilheteria aberta
        </p>
        <h1 className="relative max-w-2xl font-display text-4xl font-bold leading-tight">
          Shows e sessões de cinema,
          <br />
          <span className="relative inline-block">
            ingresso na mão
            <DoodleSquiggle className="absolute -bottom-2 left-0 h-3 w-full text-marquee" />
          </span>{' '}
          em minutos.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-paper/70">
          Navegue pelos eventos publicados, escolha seu lugar ou sua quantidade de ingressos e
          receba um ingresso com QR — pronto para validar na entrada.
        </p>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="mb-8 flex flex-wrap gap-3"
      >
        <input
          placeholder="Buscar por título…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1 border-2 border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-marquee-light"
        />
        <input
          placeholder="Cidade"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-40 border-2 border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-marquee-light"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border-2 border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-marquee-light"
        />
        <button className="stub-shadow border-2 border-ink bg-marquee px-4 py-2 font-semibold hover:bg-marquee-dark">
          Buscar
        </button>
      </form>

      {loading ? (
        <p className="font-mono text-sm text-ink/60">Carregando eventos…</p>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-2 border-dashed border-ink/30 p-8 text-center text-ink/60">
          <DoodleFilmReel className="h-10 w-10 -rotate-6 text-ink/30" />
          <p>Nenhum evento encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
