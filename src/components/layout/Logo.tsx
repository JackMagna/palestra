export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#f0c33c" />
      <rect x="10" y="20" width="7" height="24" rx="2" fill="#2a2104" />
      <rect x="19" y="25" width="5" height="14" rx="1.5" fill="#2a2104" />
      <rect x="47" y="20" width="7" height="24" rx="2" fill="#2a2104" />
      <rect x="40" y="25" width="5" height="14" rx="1.5" fill="#2a2104" />
      <rect x="24" y="30" width="16" height="4" rx="1" fill="#2a2104" />
    </svg>
  );
}
