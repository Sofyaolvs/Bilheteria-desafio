import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/auth-store';
import { DoodleSparkle, DoodleTicketStub } from './Doodles';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="relative border-b-2 border-ink bg-paper">
      <DoodleSparkle className="pointer-events-none absolute -top-1 left-24 hidden h-4 w-4 -rotate-12 text-marquee-dark sm:block" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="group flex items-center gap-2 font-display text-xl font-bold">
          <span className="flex h-8 w-8 -rotate-6 items-center justify-center rounded-none border-2 border-ink bg-marquee transition-transform group-hover:rotate-3">
            <DoodleTicketStub className="h-5 w-5 text-ink" />
          </span>
          Eventus
        </Link>

        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link to="/" className="hover:text-marquee-dark">
            Eventos
          </Link>

          {user?.role === 'ORGANIZER' && (
            <Link to="/organizador" className="hover:text-marquee-dark">
              Painel do organizador
            </Link>
          )}
          {user?.role === 'GATE' && (
            <Link to="/portaria" className="hover:text-marquee-dark">
              Portaria
            </Link>
          )}
          {user?.role === 'CLIENT' && (
            <Link to="/meus-ingressos" className="hover:text-marquee-dark">
              Meus ingressos
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2 border-l-2 border-ink pl-3">
              <span className="hidden text-ink/70 sm:inline">Olá, {user.name.split(' ')[0]}</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="stub-shadow border-2 border-ink bg-paper px-3 py-1 font-semibold hover:bg-ink hover:text-paper"
              >
                Saír
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l-2 border-ink pl-3">
              <Link to="/entrar" className="hover:text-marquee-dark">
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="stub-shadow border-2 border-ink bg-marquee px-3 py-1 font-semibold hover:bg-marquee-dark"
              >
                Criar conta
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
