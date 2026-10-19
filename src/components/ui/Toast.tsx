import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, Trophy } from 'lucide-react';

type Kind = 'success' | 'error' | 'record';
interface ToastItem { id: number; message: string; kind: Kind }

const ToastContext = createContext<(message: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(0);

  const show = useCallback((message: string, kind: Kind = 'success') => {
    const id = ++next.current;
    setItems((list) => [...list.slice(-2), { id, message, kind }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] flex flex-col items-center gap-2 lg:left-auto lg:right-6 lg:items-end">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl border px-4 py-3 text-[15px] shadow-xl ${
              t.kind === 'error' ? 'border-stop/50 bg-[#2f2220]' : t.kind === 'record' ? 'border-plate/60 bg-[#2e2a1c]' : 'border-line bg-raised'
            }`}
          >
            {t.kind === 'error' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-stop" /> : t.kind === 'record' ? <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-plate" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-go" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
