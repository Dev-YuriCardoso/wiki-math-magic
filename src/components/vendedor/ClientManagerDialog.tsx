import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useLMS } from '@/contexts/LMSContext';
import { supabase } from '@/integrations/supabase/client';
import { getSessionRemainingSeconds } from '@/types/lms';
import { formatMinutes } from '@/lib/lanhouse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientManagerDialog({ open, onOpenChange }: Props) {
  const { users, gameSessions, computers } = useLMS();
  const [search, setSearch] = useState('');
  const [saldos, setSaldos] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('lan_clientes')
        .select('id, saldo_minutos');
      if (error) {
        console.warn('[client manager] load saldos failed:', error.message);
        return;
      }
      if (cancelled) return;
      const map: Record<string, number> = {};
      for (const row of (data || []) as unknown as { id: string; saldo_minutos?: number }[]) {
        map[row.id] = Number(row.saldo_minutos) || 0;
      }
      setSaldos(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const clientes = useMemo(
    () => users.filter((u) => u.role === 'cliente' || u.role === 'aluno'),
    [users]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = clientes.map((u) => {
      const session = (gameSessions || []).find((s) => s.userId === u.id);
      const activeMinutes = session ? Math.ceil(getSessionRemainingSeconds(session) / 60) : 0;
      const savedMinutes = saldos[u.id] ?? 0;
      const remaining = session ? activeMinutes : savedMinutes;
      const pc = session?.computerId
        ? computers.find((c) => c.id === session.computerId)?.name
        : undefined;
      return { user: u, remaining, pc, active: !!session };
    });
    const sorted = list.sort((a, b) => a.user.name.localeCompare(b.user.name, 'pt-BR'));
    if (!q) return sorted;
    return sorted.filter(({ user }) =>
      user.name.toLowerCase().includes(q) ||
      (user.cpf || '').toLowerCase().includes(q) ||
      (user.phone || '').toLowerCase().includes(q)
    );
  }, [clientes, gameSessions, saldos, search, computers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Gerenciar clientes
          </DialogTitle>
          <DialogDescription>
            Todos os clientes cadastrados no banco de dados, com o saldo de tempo restante.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone…"
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-border divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              Nenhum cliente encontrado.
            </p>
          ) : (
            filtered.map(({ user, remaining, pc, active }) => (
              <div key={user.id} className="flex items-center justify-between px-3 py-2 gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[user.cpf, user.phone].filter(Boolean).join(' • ') || 'Sem contato'}
                    {active && pc && ` • conectado em ${pc}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={remaining > 0 ? 'text-success font-semibold' : 'text-muted-foreground'}>
                    {formatMinutes(remaining)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {active ? 'em sessão' : 'saldo salvo'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Total: {filtered.length} {filtered.length === 1 ? 'cliente' : 'clientes'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
