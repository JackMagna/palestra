/** Foglio nel formato della scheda del coach (titolo in colonna B, giorni in colonna A). */
export const W = ['3X10', '4X10', '3X8 AUMENTO PESO', '4X8', '3X6 AUMENTO PESO', '4X6'];
export const row = (...c: string[]) => c;

/** Foglio nel formato della scheda del coach (titolo in colonna B, giorni in colonna A). */
export const SHEET: string[][] = [
  row('', '', '', '', '', '', '', ''),
  row('', 'PROGRAMMA PALESTRA'),
  row(''),
  row('', 'GIACOMO •   DARIO PERSONAL TRAINER'),
  row(''),
  row('GIORNO 1', 'NOTE', '1 SETT.', '2 SETT.', '3 SETT.', '4 SETT.', '5 SETT.', ' 6 SETT.'),
  row("PROGRESSIONE SERIE X REP RIP. 2'", 'fare 2 serie di avvicinamento carico', ...W),
  row('CHEST PRESS PRESA SOPRA', 'presa orizzontale, petto alto', ...W),
  row('REMATORE AL PULLEY TRIANGOLO', 'adduzione scapolare', ...W),
  row("CEDIMENTO SERIE X REP RIP. 2'", 'fare 1 serie di avvicinamento carico'),
  row('CROCI AI CAVI ALTI', 'gomiti bloccati', ...Array(6).fill('10-9-8..')),
  row(''),
  row('GIORNO 2', 'NOTE', '1 SETT.', '2 SETT.', '3 SETT.', '4 SETT.', '5 SETT.', '6 SETT.'),
  row("PROGRESSIONE SERIE X REP RIP. 2'"),
  row('PRESSA 45', 'talloni', ...W),
  row('HIPEREXTENSION', '', ...Array(6).fill('4xMAX')),
  row(''),
  row("MODALITÀ D'ESECUZIONE"),
  row('fare 3 allenamenti a settimana alternando i due giorni'),
  row('fare movimenti controllati'),
  row(''),
  row('PROGRESSIONE'),
  row('utilizzare un carico e aumentarlo ogni due settimane'),
  row('CEDIMENTO'),
  row('portare tutte le serie a cedimento tecnico')
];

