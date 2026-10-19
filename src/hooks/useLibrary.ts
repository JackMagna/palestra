import { useEffect, useMemo, useState } from 'react';
import { loadLibrary, type LibraryExercise } from '../lib/exerciseLibrary';

type Status = 'loading' | 'ready' | 'error';

export function useLibrary() {
  const [list, setList] = useState<LibraryExercise[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    loadLibrary()
      .then((data) => {
        if (!alive) return;
        setList(data);
        setStatus('ready');
      })
      .catch((err) => {
        console.warn(err);
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const byId = useMemo(() => new Map(list.map((e) => [e.id, e])), [list]);
  return { list, byId, status, retry: () => setAttempt((n) => n + 1) };
}
