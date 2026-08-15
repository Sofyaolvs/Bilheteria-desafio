import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';
import { DoodleStar } from '../components/Doodles';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.accessToken, data.user);
      navigate(data.user.role === 'ORGANIZER' ? '/organizador' : data.user.role === 'GATE' ? '/portaria' : '/');
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível entrar.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-sm px-4 py-16">
      <DoodleStar className="pointer-events-none absolute -left-2 top-6 h-9 w-9 -rotate-12 text-marquee/70 sm:-left-10" />
      <h1 className="mb-1 font-display text-3xl font-bold">Entrar</h1>
      <p className="mb-6 text-sm text-ink/60">Acesse sua conta de cliente, organizador ou portaria.</p>

      <form onSubmit={onSubmit} className="stub-shadow flex flex-col gap-4 border-2 border-ink bg-paper p-6">
        <label className="flex flex-col gap-1 text-sm font-medium">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-2 border-ink bg-white px-3 py-2 font-mono text-sm outline-none focus:bg-marquee-light"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Senha
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-2 border-ink bg-white px-3 py-2 font-mono text-sm outline-none focus:bg-marquee-light"
          />
        </label>
        {error && <p className="text-sm font-medium text-stamp">{error}</p>}
        <button
          disabled={loading}
          className="stub-shadow border-2 border-ink bg-marquee px-4 py-2 font-display font-semibold hover:bg-marquee-dark disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink/70">
        Não tem conta? <Link to="/cadastro" className="font-semibold underline">Cadastre-se como cliente</Link>
      </p>

      <div className="mt-8 border-2 border-dashed border-ink/30 p-4 text-xs text-ink/60">
        <p className="mb-1 font-semibold">Contas de teste (senha: senha123)</p>
        <p>organizador@demo.com · cliente1@demo.com · cliente2@demo.com · portaria@demo.com</p>
      </div>
    </div>
  );
}
