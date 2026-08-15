import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { EventDetail } from './pages/EventDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Checkout } from './pages/Checkout';
import { MyTickets } from './pages/MyTickets';
import { SharedTicket } from './pages/SharedTicket';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { OrganizerNewEvent } from './pages/OrganizerNewEvent';
import { Gate } from './pages/Gate';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col font-body">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/eventos/:id" element={<EventDetail />} />
            <Route path="/entrar" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/t/:token" element={<SharedTicket />} />

            <Route
              path="/checkout/:id"
              element={
                <ProtectedRoute roles={['CLIENT']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meus-ingressos"
              element={
                <ProtectedRoute roles={['CLIENT']}>
                  <MyTickets />
                </ProtectedRoute>
              }
            />

            <Route
              path="/organizador"
              element={
                <ProtectedRoute roles={['ORGANIZER']}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizador/novo"
              element={
                <ProtectedRoute roles={['ORGANIZER']}>
                  <OrganizerNewEvent />
                </ProtectedRoute>
              }
            />

            <Route
              path="/portaria"
              element={
                <ProtectedRoute roles={['GATE']}>
                  <Gate />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="border-t-2 border-ink bg-paper py-6 text-center text-xs text-ink/50">
          Eventus. Nenhuma cobrança real é feita nesta plataforma.
        </footer>
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="p-16 text-center">
      <p className="font-display text-2xl font-bold">404</p>
      <p className="text-ink/60">Página não encontrada.</p>
    </div>
  );
}

export default App;
