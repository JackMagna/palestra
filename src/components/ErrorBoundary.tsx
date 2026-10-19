import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State { error: Error | null; key?: unknown }
interface Props { children: ReactNode; /** errore dentro una sezione: il resto dell'app resta usabile */ inline?: boolean; resetKey?: unknown }

/** Se qualcosa si rompe, mostra cosa è successo invece di lasciare lo schermo vuoto. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey };

  // cambiando sezione si riprova da capo
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Errore dell\'app', error, info.componentStack);
  }

  private resetCaches = async () => {
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
      await Promise.all(regs.map((r) => r.unregister()));
      await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
    } catch {
      /* se non si può, si ricarica comunque */
    }
    window.location.reload();
  };

  private resetWorkout = () => {
    try {
      localStorage.removeItem('irontrack:workout-draft');
    } catch {
      /* storage non disponibile */
    }
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.inline) {
      return (
        <div role="alert" className="card space-y-3 p-5">
          <h2 className="font-display text-xl font-semibold">Questa sezione non si è caricata</h2>
          <p className="text-[15px] text-muted">Il resto dell'app funziona: puoi cambiare sezione dalla barra in basso. Se mi scrivi, mandami lo schermo con il testo qui sotto.</p>
          <pre className="whitespace-pre-wrap break-words rounded-xl bg-ink p-3 text-sm text-faint">{error.name}: {error.message}</pre>
          <button type="button" className="min-h-11 rounded-xl border border-line bg-raised px-4 py-2 text-[15px] font-semibold" onClick={() => this.setState({ error: null })}>Riprova</button>
        </div>
      );
    }
    const btn = 'min-h-12 rounded-xl border border-[#3a3f45] bg-[#2c3035] px-4 py-2 text-[15px] font-semibold text-[#eeebe4]';
    return (
      <div role="alert" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-5 py-10">
        <h1 className="font-display text-3xl font-bold">Qualcosa non ha funzionato</h1>
        <p className="text-[15px] text-[#a8a69e]">
          Le tue serie e le tue misure sono al sicuro. Prova a ricaricare; se si ripete, usa gli altri due pulsanti, uno alla volta.
        </p>
        <button type="button" className={`${btn} !bg-[#f0c33c] !text-[#2a2104]`} onClick={() => window.location.reload()}>Ricarica</button>
        <button type="button" className={btn} onClick={this.resetWorkout}>Scarta l'allenamento in corso e ricarica</button>
        <button type="button" className={btn} onClick={this.resetCaches}>Svuota la cache dell'app e ricarica</button>
        <details className="text-sm text-[#7a7973]">
          <summary className="cursor-pointer">Dettagli per chi mi aiuta</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words">{error.name}: {error.message}</pre>
        </details>
      </div>
    );
  }
}
