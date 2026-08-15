import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../lib/api';
import type { CatalogItem } from '../types';

export function OrganizerNewEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [source, setSource] = useState<'ticketmaster' | 'local' | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    externalId: '',
    externalSource: 'manual',
    category: 'SHOW',
    title: '',
    subtitle: '',
    imageUrl: '',
    description: '',
    venueName: '',
    venueCity: '',
    venueAddress: '',
    startsAt: '',
    ticketingMode: 'GENERAL',
    price: '',
    generalCapacity: 100,
    seatRows: 5,
    seatsPerRow: 8,
  });

  async function search(e?: FormEvent) {
    e?.preventDefault();
    setSearching(true);
    setError('');
    try {
      const { data } = await api.get('/catalog/search', { params: { keyword, city } });
      setItems(data.items);
      setSource(data.source);
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível buscar no catálogo.'));
    } finally {
      setSearching(false);
    }
  }

  function pickItem(item: CatalogItem) {
    setForm((f) => ({
      ...f,
      externalId: item.externalId,
      externalSource: item.source,
      title: item.title,
      subtitle: item.subtitle ?? '',
      imageUrl: item.imageUrl ?? '',
      venueName: item.venueName,
      venueCity: item.venueCity,
      category: item.classification?.toLowerCase().includes('film') ? 'FILME' : 'SHOW',
      startsAt: item.suggestedDate ? item.suggestedDate.slice(0, 16) : f.startsAt,
    }));
    setStep(2);
  }

  function skipCatalog() {
    setForm((f) => ({ ...f, externalId: '', externalSource: 'manual' }));
    setStep(2);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload: any = {
        externalId: form.externalId || undefined,
        externalSource: form.externalSource,
        category: form.category,
        title: form.title,
        subtitle: form.subtitle || undefined,
        imageUrl: form.imageUrl || undefined,
        description: form.description || undefined,
        venueName: form.venueName,
        venueCity: form.venueCity,
        venueAddress: form.venueAddress || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        ticketingMode: form.ticketingMode,
        price: String(form.price),
      };
      if (form.ticketingMode === 'GENERAL') {
        payload.generalCapacity = Number(form.generalCapacity);
      } else {
        payload.seatRows = Number(form.seatRows);
        payload.seatsPerRow = Number(form.seatsPerRow);
      }
      await api.post('/events', payload);
      navigate('/organizador');
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível publicar o evento.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 font-display text-3xl font-bold">Novo evento</h1>
      <p className="mb-6 text-sm text-ink/60">
        Passo {step} de 2 — {step === 1 ? 'busque no catálogo (Ticketmaster Discovery)' : 'defina data, local, capacidade e preço'}
      </p>

      {step === 1 && (
        <div>
          <form onSubmit={search} className="mb-4 flex gap-3">
            <input
              placeholder="Buscar show/filme (ex: rock, jazz)…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 border-2 border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-marquee-light"
            />
            <input
              placeholder="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-36 border-2 border-ink bg-paper px-3 py-2 text-sm outline-none focus:bg-marquee-light"
            />
            <button className="stub-shadow border-2 border-ink bg-marquee px-4 py-2 font-semibold hover:bg-marquee-dark">
              {searching ? 'Buscando…' : 'Buscar'}
            </button>
          </form>

          {source === 'local' && (
            <p className="mb-3 border-2 border-dashed border-ink/30 p-2 text-xs text-ink/60">
              Sem TICKETMASTER_API_KEY configurada no backend — mostrando catálogo local de
              exemplo (ver README).
            </p>
          )}

          {error && (
            <p className="mb-3 border-2 border-stamp p-2 text-xs font-medium text-stamp">{error}</p>
          )}

          {!searching && !error && source && items.length === 0 && (
            <p className="mb-3 text-xs text-ink/60">Nenhum resultado para essa busca.</p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <button
                key={item.externalId}
                onClick={() => pickItem(item)}
                className="stub-shadow flex flex-col overflow-hidden border-2 border-ink bg-paper text-left hover:-translate-y-0.5"
              >
                {item.imageUrl && <img src={item.imageUrl} className="h-28 w-full border-b-2 border-ink object-cover" />}
                <div className="p-3">
                  <p className="font-display font-semibold">{item.title}</p>
                  <p className="text-xs text-ink/60">{item.venueName} · {item.venueCity}</p>
                </div>
              </button>
            ))}
          </div>

          <button onClick={skipCatalog} className="mt-6 text-sm font-semibold underline">
            Preferir montar manualmente, sem usar o catálogo →
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={onSubmit} className="stub-shadow flex flex-col gap-4 border-2 border-ink bg-paper p-6">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Categoria
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border-2 border-ink bg-white px-3 py-2 text-sm"
              >
                <option value="SHOW">Show</option>
                <option value="FILME">Filme</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Modo de ingresso
              <select
                value={form.ticketingMode}
                onChange={(e) => setForm({ ...form, ticketingMode: e.target.value })}
                className="border-2 border-ink bg-white px-3 py-2 text-sm"
              >
                <option value="GENERAL">Pista (quantidade)</option>
                <option value="SEATED">Mapa de assentos</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Título
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border-2 border-ink bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Subtítulo
            <input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="border-2 border-ink bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Descrição
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border-2 border-ink bg-white px-3 py-2 text-sm"
              rows={3}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Local
              <input
                required
                value={form.venueName}
                onChange={(e) => setForm({ ...form, venueName: e.target.value })}
                className="border-2 border-ink bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Cidade
              <input
                required
                value={form.venueCity}
                onChange={(e) => setForm({ ...form, venueCity: e.target.value })}
                className="border-2 border-ink bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Endereço
            <input
              value={form.venueAddress}
              onChange={(e) => setForm({ ...form, venueAddress: e.target.value })}
              className="border-2 border-ink bg-white px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Data e hora
              <input
                required
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="border-2 border-ink bg-white px-3 py-2 font-mono text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Preço (R$)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border-2 border-ink bg-white px-3 py-2 font-mono text-sm"
              />
            </label>
          </div>

          {form.ticketingMode === 'GENERAL' ? (
            <label className="flex flex-col gap-1 text-sm font-medium">
              Capacidade (ingressos de pista)
              <input
                required
                type="number"
                min="1"
                value={form.generalCapacity}
                onChange={(e) => setForm({ ...form, generalCapacity: Number(e.target.value) })}
                className="border-2 border-ink bg-white px-3 py-2 font-mono text-sm"
              />
            </label>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Fileiras
                <input
                  required
                  type="number"
                  min="1"
                  max="26"
                  value={form.seatRows}
                  onChange={(e) => setForm({ ...form, seatRows: Number(e.target.value) })}
                  className="border-2 border-ink bg-white px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Poltronas por fileira
                <input
                  required
                  type="number"
                  min="1"
                  max="40"
                  value={form.seatsPerRow}
                  onChange={(e) => setForm({ ...form, seatsPerRow: Number(e.target.value) })}
                  className="border-2 border-ink bg-white px-3 py-2 font-mono text-sm"
                />
              </label>
            </div>
          )}

          {error && <p className="text-sm font-medium text-stamp">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="border-2 border-ink bg-paper px-4 py-2 font-semibold hover:bg-marquee-light"
            >
              ← Voltar
            </button>
            <button
              disabled={submitting}
              className="stub-shadow flex-1 border-2 border-ink bg-marquee px-4 py-2 font-display font-semibold hover:bg-marquee-dark disabled:opacity-60"
            >
              {submitting ? 'Publicando…' : 'Publicar evento'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
