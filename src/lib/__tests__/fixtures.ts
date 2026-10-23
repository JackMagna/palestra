/** Foglio nel formato della scheda del coach (titolo in colonna B, giorni in colonna A). */
export const W = ['3X10', '4X10', '3X8 AUMENTO PESO', '4X8', '3X6 AUMENTO PESO', '4X6'];
export const row = (...c: string[]) => c;
const HEAD = (g: string) => row(g, 'NOTE', '1 SETT.', '2 SETT.', '3 SETT.', '4 SETT.', '5 SETT.', '6 SETT.');
const PROG = (note: string) => row("PROGRESSIONE SERIE X REP RIP. 2'", note, ...W);
const CED = (note: string) => row("CEDIMENTO SERIE X REP RIP. 2'", note, ...Array(6).fill('10-9-8..'));
const EX = (name: string, note = '') => row(name, note); // celle delle settimane vuote: lì si scrivono i carichi
const CORE = (name: string) => row(name, '', ...Array(6).fill('4xMAX'));

/** La scheda ALLENAMENTO del coach, riga per riga come nel foglio (la riga n del foglio è l'indice n-1). */
export const SHEET: string[][] = [
  row(''),                                                   // 1
  row('', 'PROGRAMMA PALESTRA'), row(''), row('', 'GIACOMO •  DARIO PERSONAL TRAINER'), row(''), // 2-5
  row(''),                                                   // 6
  HEAD('GIORNO 1'),                                          // 7
  PROG('fare 2 serie di avvicinamento carico'),              // 8
  EX('CHEST PRESS PRESA SOPRA'),                             // 9
  EX('REMATORE AL PULLEY TRIANGOLO', 'adduzione scapolare'), // 10
  CED('fare 1 serie di avvicinamento carico'),               // 11
  EX('CROCI AI CAVI ALTI'),                                  // 12
  EX('TRAZIONI AL PULL DOWN MACHINE', 'focus dorsali'),      // 13
  PROG('fare 1 serie di avvicinamento carico'),              // 14
  EX('LENTO MANUBRI PANCA 70'),                              // 15
  CED('fare 1 serie di avvicinamento carico'),               // 16
  EX('ALZATE LATERALI PRONO PANCA 60'),                      // 17
  CORE('REVERS CRUNCH DECLINATA'),                           // 18
  row(''), row(''),                                          // 19-20
  HEAD('GIORNO 2'),                                          // 21
  PROG('fare 2 serie di avviciamento carico'),               // 22
  EX('PRESSA 45'), EX('LEG CURL SEDUTO'), EX('CURL BILANCIERE'), EX('PUSH DOWN SBARRA'), // 23-26
  CED('fare 1 serie di avvicinamento carico'),               // 27
  EX('CURL MANUBRI PANCA 45'), EX('FRENCH PRESS MANUBRI PANCA PIANA'), // 28-29
  CORE('HIPEREXTENSION'),                                    // 30
  row(''), row(''),                                          // 31-32
  row("MODALITÀ D'ESECUZIONE"),                              // 33
  row('fare 3 allenamenti a settimana alternando i due giorni'), row('fare movimenti controllati'), // 34-35
  row(''),                                                   // 36
  row('PROGRESSIONE'), row('utilizzare un carico e aumentarlo ogni due settimane abbassando le rep'), // 37-38
  row(''),                                                   // 39
  row('CEDIMENTO'), row('portare tutte le serie a cedimento tecnico e se su superano aumentare il carico') // 40-41
];

/** La scheda MISURE del coach, come nello screenshot (righe 1-7 banner, riga 8 intestazione). */
export const MISURE: string[][] = [
  [], ['', 'PROGRAMMA PALESTRA'], [], ['', 'GIACOMO •  DARIO PERSONAL TRAINER'], [], [], [],
  ['SETTIMANE', '1 SETT.', '2 SETT.', '3 SETT.', '4 SETT.', '5 SETT.', '6 SETT.', '7 SETT.'],
  ['PESO', '106'], ['VITA', '102'], ['ADDOME', '110'], ['FIANCHI', '114'], ['BRACCIO CONTRAIONE', '39,5'], ['COSCIA', '73']
];

