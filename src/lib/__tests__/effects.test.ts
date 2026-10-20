import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? (f === '__tests__' ? [] : files(join(dir, f))) : /\.tsx?$/.test(f) ? [join(dir, f)] : []));

describe('useEffect', () => {
  it('non restituisce mai un valore per sbaglio', () => {
    // Chrome 155 fa tornare una Promise da window.scrollTo: se l'effetto la restituisce, React la chiama
    // come funzione di pulizia e l'app va in crash ("l is not a function"). Servono sempre le graffe.
    const bad = files(new URL('../..', import.meta.url).pathname).filter((f) => /use(Layout)?Effect\(\s*\(\)\s*=>\s*[^{\s]/.test(readFileSync(f, 'utf8')));
    expect(bad).toEqual([]);
  });
});
