import type { ReactNode } from 'react';
import { BookOpen, ClipboardList, Dumbbell, LineChart, UserRound, WifiOff } from 'lucide-react';
import { Logo } from './Logo';
import { useOnline } from '../../hooks/usePWA';

export type Tab = 'workout' | 'program' | 'library' | 'progress';

const TABS: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
  { id: 'workout', label: 'Allenamento', icon: Dumbbell },
  { id: 'program', label: 'Scheda', icon: ClipboardList },
  { id: 'library', label: 'Esercizi', icon: BookOpen },
  { id: 'progress', label: 'Progressi', icon: LineChart }
];

interface Props {
  tab: Tab;
  onTab: (t: Tab) => void;
  accountLabel: string;
  onAccount: () => void;
  children: ReactNode;
}

export function AppShell({ tab, onTab, accountLabel, onAccount, children }: Props) {
  const online = useOnline();

  return (
    <div className="min-h-dvh">
      {/* Barra laterale da computer */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-panel px-3 py-5 lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <Logo />
          <span className="font-display text-2xl font-bold">IronTrack</span>
        </div>
        <nav aria-label="Sezioni" className="flex-1">
          <ul className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onTab(id)}
                  aria-current={tab === id ? 'page' : undefined}
                  className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition ${tab === id ? 'bg-raised text-chalk' : 'text-muted hover:text-chalk'}`}
                >
                  <Icon className={`h-5 w-5 ${tab === id ? 'text-plate' : ''}`} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <button type="button" onClick={onAccount} className="flex h-12 items-center gap-3 rounded-xl px-3 text-left text-[15px] text-muted hover:bg-raised hover:text-chalk">
          <UserRound className="h-5 w-5 shrink-0" />
          <span className="truncate">{accountLabel}</span>
        </button>
      </aside>

      {/* Testata da telefono e tablet */}
      <header className="pt-safe sticky top-0 z-30 border-b border-line bg-ink/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-display text-xl font-bold">IronTrack</span>
          </div>
          <button type="button" onClick={onAccount} className="inline-flex h-11 max-w-[55%] items-center gap-2 rounded-xl px-3 text-sm text-muted hover:text-chalk" aria-label="Account e impostazioni">
            <span className="truncate">{accountLabel}</span>
            <UserRound className="h-5 w-5 shrink-0" />
          </button>
        </div>
      </header>

      {!online && (
        <div role="status" className="flex items-center justify-center gap-2 bg-raised px-4 py-2 text-sm text-muted lg:ml-60">
          <WifiOff className="h-4 w-4" /> Sei offline: i dati vengono salvati e inviati appena torna la rete.
        </div>
      )}

      <div className="lg:pl-60">
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>
      </div>

      {/* Barra in basso da telefono e tablet */}
      <nav aria-label="Sezioni" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel lg:hidden">
        <ul className="mx-auto grid h-16 max-w-xl grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex h-full w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold ${tab === id ? 'text-chalk' : 'text-faint'}`}
              >
                <Icon className={`h-6 w-6 ${tab === id ? 'text-plate' : ''}`} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
