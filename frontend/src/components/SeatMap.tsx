import type { Seat } from '../types';

interface Props {
  seats: Seat[];
  selected: string[];
  onToggle: (seatId: string) => void;
  maxSelectable?: number;
}

// Mapa simplificado por fileiras x poltronas (como uma sala de cinema
// convencional). Decisão registrada no README: um editor de mapa livre
// (formatos de teatro, curvas, camarotes) ficaria fora do orçamento de
// 7 dias sem comprometer o resto do fluxo — aqui o valor está em mostrar o
// conceito ponta a ponta (seleção → hold → pagamento → bloqueio de
// concorrência), não em um editor de mapas genérico.
export function SeatMap({ seats, selected, onToggle, maxSelectable = 8 }: Props) {
  const rows = Array.from(new Set(seats.map((s) => s.row))).sort();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="mb-2 h-2 w-full max-w-md rounded-full bg-ink/80" title="Tela" />
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-4 font-mono text-xs text-ink/50">{row}</span>
            <div className="flex gap-1.5">
              {seats
                .filter((s) => s.row === row)
                .sort((a, b) => a.number - b.number)
                .map((seat) => {
                  const isSelected = selected.includes(seat.id);
                  const disabled =
                    seat.status !== 'AVAILABLE' && !isSelected;
                  const blockSelection = !isSelected && selected.length >= maxSelectable;
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={disabled || blockSelection}
                      onClick={() => onToggle(seat.id)}
                      title={`${seat.row}${seat.number} — ${seat.status}`}
                      className={[
                        'flex h-7 w-7 items-center justify-center border-2 text-[10px] font-mono font-semibold transition-colors',
                        isSelected
                          ? 'border-ink bg-marquee text-ink'
                          : seat.status === 'AVAILABLE'
                            ? 'border-ink/40 bg-paper hover:border-ink hover:bg-marquee-light disabled:hover:bg-paper'
                            : 'cursor-not-allowed border-ink/20 bg-ink/20 text-ink/40',
                      ].join(' ')}
                    >
                      {seat.number}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs">
        <Legend swatch="bg-paper border-ink/40" label="Disponível" />
        <Legend swatch="bg-marquee border-ink" label="Selecionado" />
        <Legend swatch="bg-ink/20 border-ink/20" label="Ocupado" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3.5 w-3.5 border-2 ${swatch}`} />
      {label}
    </span>
  );
}
