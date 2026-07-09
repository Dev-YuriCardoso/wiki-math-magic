import { useState, useMemo, useEffect } from 'react';
import { Timer, Clock, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLMS } from '@/contexts/LMSContext';
import { getSessionRemainingSeconds } from '@/types/lms';

function formatClock(totalSeconds: number) {
  const abs = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function VendedorAtivos() {
  const { currentUser, users, gameSessions, getUserById } = useLMS();

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const active = useMemo(() => {
    return (gameSessions || [])
      .filter((s) => s.status === 'running')
      .map((s) => ({
        session: s,
        user: getUserById(s.userId),
        remaining: getSessionRemainingSeconds(s, now),
      }))
      .filter((x) => x.user)
      .sort((a, b) => a.remaining - b.remaining);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSessions, users, now]);

  if (!currentUser) return null;

  return (
    <MainLayout title="Tempos em andamento">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Timer className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tempos em andamento</h2>
          <p className="text-sm text-muted-foreground">
            {active.length} sessão(ões) em contagem • ordenadas por quem termina primeiro
          </p>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
          Nenhum tempo em andamento no momento.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map(({ user, remaining }) => {
            const ending = remaining <= 300;
            return (
              <div
                key={user!.id}
                className={`rounded-2xl border p-5 bg-card ${
                  ending ? 'border-destructive/60' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground truncate">{user!.name}</p>
                  <span
                    className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                      ending ? 'bg-destructive' : 'bg-success'
                    }`}
                  />
                </div>
                <p
                  className={`text-4xl font-bold tabular-nums flex items-center gap-2 ${
                    ending ? 'text-destructive' : 'text-success'
                  }`}
                >
                  <Clock className="h-7 w-7" />
                  {formatClock(remaining)}
                </p>
                {ending && (
                  <p className="mt-2 text-xs font-medium text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Prestes a terminar
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}
