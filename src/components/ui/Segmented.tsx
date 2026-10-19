interface Option<T extends string | number> { value: T; label: string }

export function Segmented<T extends string | number>({
  options, value, onChange, label, className = ''
}: { options: Option<T>[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={`no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-ink p-1 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`h-9 min-w-9 shrink-0 rounded-lg px-3 text-sm font-semibold transition ${active ? 'bg-chalk text-ink' : 'text-muted hover:text-chalk'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
