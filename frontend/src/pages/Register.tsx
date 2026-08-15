import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

export function Register() {
  const [name, setName] = useState('');
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
      const { data } = await api.post('/auth/register', { name, email, password });
      login(data.accessToken, data.user);
      navigate('/');
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível criar sua conta.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-1 font-display text-3xl font-bold">Criar conta</h1>
      <p className="mb-6 text-sm text-ink/60">
        Cadastro aberto apenas para clientes. Contas de organizador e portaria são provisionadas
        pela plataforma (veja o README).
      </p>

      <form onSubmit={onSubmit} className="stub-shadow flex flex-col gap-4 border-2 border-ink bg-paper p-6">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nome
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:bg-marquee-light"
          />
        </label>
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
          Senha (mín. 6 caracteres)
          <input
            type="password"
            required
            minLength={6}
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
          {loading ? 'Criando…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink/70">
        Já tem conta? <Link to="/entrar" className="font-semibold underline">Entrar</Link>
      </p>
    </div>
  );
}
