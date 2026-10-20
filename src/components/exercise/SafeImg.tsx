import { useEffect, useState, type ReactNode } from 'react';
import { imageSources } from '../../lib/exerciseLibrary';

interface Props {
  path: string | undefined;
  alt: string;
  className?: string;
  /** mostrato quando nessuna sorgente riesce a caricare la foto */
  fallback?: ReactNode;
  onFail?: () => void;
  eager?: boolean;
}

/** Foto della libreria: prova il CDN, poi GitHub, poi mostra un segnaposto. */
export function SafeImg({ path, alt, className = '', fallback = null, onFail, eager }: Props) {
  const sources = path ? imageSources(path) : [];
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [path]);

  if (!path || attempt >= sources.length) return <>{fallback}</>;
  return (
    <img
      src={sources[attempt]}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      onError={() => {
        if (attempt + 1 >= sources.length) onFail?.();
        setAttempt(attempt + 1);
      }}
    />
  );
}
