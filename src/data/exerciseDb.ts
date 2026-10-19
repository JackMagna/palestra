export interface ExerciseDBItem {
  id: string;
  name: string;
  italianName: string;
  bodyPart: 'Petto' | 'Dorso' | 'Spalle' | 'Bicipiti' | 'Tricipiti' | 'Gambe' | 'Addome' | 'Lombari';
  targetMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  trainerCues: string[];
  instructions: string[];
  videoTutorialUrl: string;
  gifUrl: string;
}

export const EXERCISE_DATABASE: Record<string, ExerciseDBItem> = {
  'chest-press-sopra': {
    id: 'chest-press-sopra',
    name: 'Lever Chest Press Overhand',
    italianName: 'Chest Press Presa Sopra',
    bodyPart: 'Petto',
    targetMuscle: 'Grande Pettorale (Fascio Sterno-Costale e Clavicolare)',
    secondaryMuscles: ['Deltoide Anteriore', 'Tricipiti Brachiali'],
    equipment: 'Macchina Chest Press guidata',
    trainerCues: [
      'Regola il sellino: maniglie all\'altezza media dello sterno.',
      'Mantieni le scapole addotte e depresse (spalle bloccate indietro e in basso).',
      'Espira durante la spinta senza iperestendere i gomiti.',
      'Fase eccentrica lenta e controllata in 2-3 secondi.'
    ],
    instructions: [
      'Siediti saldamente con la schiena e la testa a contatto con lo schienale.',
      'Afferra le maniglie orizzontali (presa prona / sopra) con i polsi dritti.',
      'Spingi in avanti contraendo il petto fino alla quasi distensione delle braccia.',
      'Ritorna lentamente alla posizione iniziale sentendo l\'allungamento delle fibre pettorali.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=chest+press+macchina+esecuzione+corretta',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press.gif'
  },

  'rematore-pulley-triangolo': {
    id: 'rematore-pulley-triangolo',
    name: 'Cable Low Seated Row V-Bar',
    italianName: 'Rematore al Pulley Triangolo',
    bodyPart: 'Dorso',
    targetMuscle: 'Gran Dorsale, Romboidi e Trapezio Medio',
    secondaryMuscles: ['Bicipiti Brachiali', 'Deltoide Posteriore', 'Brachioradiale'],
    equipment: 'Cavo Basso con Triangolo V-Bar',
    trainerCues: [
      'FOCUS DARIO PT: Adduzione scapolare attiva prima del tiraggio!',
      'Petto aperto e schiena in posizione neutrale.',
      'Tira verso il basso ventre/ombelico, non verso il mento.',
      'Non dondolare col busto.'
    ],
    instructions: [
      'Siediti sulla panca del pulley con i piedi saldi sulle pedane e ginocchia leggermente flesse.',
      'Afferra il triangolo a presa neutra con le braccia distese.',
      'Inizia il movimento chiudendo le scapole verso la colonna vertebrale.',
      'Tira i gomiti indietro radenti ai fianchi fino a sfiorare l\'addome, fermati 1 secondo in contrazione di picco.',
      'Rilascia il carico in modo controllato senza incurvare la schiena.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=rematore+pulley+triangolo+adduzione+scapolare',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-seated-row.gif'
  },

  'croci-cavi-alti': {
    id: 'croci-cavi-alti',
    name: 'Cable High to Low Fly',
    italianName: 'Croci ai Cavi Alti',
    bodyPart: 'Petto',
    targetMuscle: 'Grande Pettorale (Fasci Inferiori e Sternali)',
    secondaryMuscles: ['Deltoide Anteriore', 'Capo Breve Bicipite'],
    equipment: 'Cavi Doppi Alti (Cable Crossover)',
    trainerCues: [
      'CEDIMENTO TECNICO: Angolo gomito fisso e costante (abbraccia una botte).',
      'Fai 1 serie di avvicinamento carico prima delle serie effettive.',
      '10-9-8.. a cedimento tecnico.'
    ],
    instructions: [
      'Posiziona i carrelli dei cavi nella parte alta.',
      'Afferra le maniglie a D, fai un passo in avanti a gambe sfalsate.',
      'Porta le maniglie in avanti e verso il basso facendole incrociare o toccare davanti al bacino.',
      'Ritorna lentamente sentendo l\'espansione toracica.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=croci+ai+cavi+alti+pettorali+tutorial',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/cable-middle-fly.gif'
  },

  'pull-down-machine': {
    id: 'pull-down-machine',
    name: 'Cable Lat Pulldown Machine',
    italianName: 'Trazioni al Pull Down Machine',
    bodyPart: 'Dorso',
    targetMuscle: 'Gran Dorsale (Focus Apertura e Spessore)',
    secondaryMuscles: ['Bicipiti', 'Grande Rotondo', 'Romboidi'],
    equipment: 'Macchina Lat Pulldown guidata',
    trainerCues: [
      'FOCUS DARIO PT: Focus dorsali! Tira guidando con i gomiti verso il basso.',
      'Non tirare con le braccia o piegando i polsi.',
      'Controlla la risalita allungando completamente i dorsali.'
    ],
    instructions: [
      'Regola il blocco cosce per essere saldo sulla seduta.',
      'Afferra la sbarra con presa prona poco più larga delle spalle.',
      'Abbassa le spalle e tira la sbarra verso la parte alta del petto.',
      'Fermati 1 secondo in contrazione e risali lentamente.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=pull+down+machine+focus+dorsali+palestra',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-lat-pulldown-full-range-of-motion.gif'
  },

  'lento-manubri-70': {
    id: 'lento-manubri-70',
    name: 'Lever Incline Shoulder Press 70 Deg',
    italianName: 'Lento Manubri Panca 70°',
    bodyPart: 'Spalle',
    targetMuscle: 'Deltoide Anteriore e Mediale',
    secondaryMuscles: ['Tricipite Brachiale', 'Trapezio Superiore'],
    equipment: 'Panca 70° + Manubri / Shoulder Machine',
    trainerCues: [
      'Panca a 70°: scarica la colonna lombare e protegge la cuffia dei rotatori.',
      'Gomiti a 45°-60° sul piano scapolare, mai aperti a 90° piatti.',
      'Progressione bisettimanale con aumento peso.'
    ],
    instructions: [
      'Siediti sulla panca a 70° e porta i manubri all\'altezza delle spalle.',
      'Spingi verticalmente verso l\'alto lungo una traiettoria convergente.',
      'Fermati prima del contatto tra i manubri e scendi controllando il peso.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=lento+avanti+manubri+panca+70+gradi',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/lever-shoulder-press.gif'
  },

  'alzate-laterali-prono-60': {
    id: 'alzate-laterali-prono-60',
    name: 'Prone Incline Rear Delt Lateral Raise 60 Deg',
    italianName: 'Alzate Laterali Prono Panca 60°',
    bodyPart: 'Spalle',
    targetMuscle: 'Deltoide Posteriore e Mediale',
    secondaryMuscles: ['Trapezio Medio', 'Romboidi', 'Infraspinato'],
    equipment: 'Panca 60° + Manubri',
    trainerCues: [
      'Petto aderente allo schienale a 60°: impedisce slanci e cheating.',
      'Porta le serie a cedimento tecnico (10-9-8..).',
      'Mantieni i gomiti leggermente flessi durante l\'alzata.'
    ],
    instructions: [
      'Appoggia il petto contro lo schienale inclinato a 60°.',
      'Braccia verso il basso, solleva lateralmente aprendo le braccia fino all\'altezza delle spalle.',
      'Trattieni un istante in alto e scendi lentamente.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=alzate+laterali+petto+appoggiato+panca+inclinata',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-lateral-raise.gif'
  },

  'reverse-crunch-declinata': {
    id: 'reverse-crunch-declinata',
    name: 'Decline Bench Reverse Crunch',
    italianName: 'Reverse Crunch Panca Declinata',
    bodyPart: 'Addome',
    targetMuscle: 'Retto dell\'Addome (Regione Sotto-ombelicale)',
    secondaryMuscles: ['Obliqui', 'Ileo-Psoas'],
    equipment: 'Panca Declinata per Addominali',
    trainerCues: [
      '4 serie x MAX ripetizioni.',
      'Arrotola il bacino verso il torace, non lanciare le gambe in aria.',
      'Discesa controllata senza inarcare la schiena.'
    ],
    instructions: [
      'Sdraiati sulla panca declinata e afferra la maniglia dietro la testa.',
      'Ginocchia a 90°, stacca i piedi e arriccia il bacino sollevando i glutei.',
      'Riscendi lentamente sfiorando la panca e riparti.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=reverse+crunch+panca+declinata+addominali',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/decline-crunch.gif'
  },

  'pressa-45': {
    id: 'pressa-45',
    name: 'Sled 45 Incline Leg Press',
    italianName: 'Pressa 45°',
    bodyPart: 'Gambe',
    targetMuscle: 'Quadricipiti (Vasto Laterale, Mediale, Retto Femorale)',
    secondaryMuscles: ['Glutei', 'Ischiocrurali', 'Adduttori'],
    equipment: 'Macchina Leg Press a 45°',
    trainerCues: [
      'PROGRESSIONE: 2 serie di avvicinamento al carico.',
      'Piedi al centro della pedana a larghezza spalle.',
      'MAI staccare la zona lombare dallo schienale.',
      'MAI bloccare le ginocchia a fine spinta.'
    ],
    instructions: [
      'Siediti con la schiena ben aderente e sblocca i fermi laterali.',
      'Scendi controllando il carrello fino a 90° alle ginocchia.',
      'Spingi forte attraverso i talloni tornando su senza iperestendere.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=leg+press+45+esecuzione+corretta',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-45-leg-press.gif'
  },

  'leg-curl-seduto': {
    id: 'leg-curl-seduto',
    name: 'Lever Seated Leg Curl Machine',
    italianName: 'Leg Curl Seduto',
    bodyPart: 'Gambe',
    targetMuscle: 'Ischiocrurali / Femorali (Bicipite Femorale)',
    secondaryMuscles: ['Polpacci (Gastrocnemio)'],
    equipment: 'Macchina Seated Leg Curl',
    trainerCues: [
      'Perno di rotazione allineato esattamente al ginocchio.',
      'Cuscinetto cosce ben serrato per non far salire il bacino.',
      'Discesa eccentrica in 3 secondi.'
    ],
    instructions: [
      'Blocca le cosce sotto il cuscinetto e posiziona il rullo posteriore sopra le caviglie.',
      'Fletti le ginocchia tirando verso il basso.',
      'Mantieni 1 secondo la contrazione e ritorna controllando.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=leg+curl+seduto+macchina+femorali',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-seated-leg-curl.gif'
  },

  'curl-bilanciere': {
    id: 'curl-bilanciere',
    name: 'Standing Barbell Bicep Curl',
    italianName: 'Curl Bilanciere',
    bodyPart: 'Bicipiti',
    targetMuscle: 'Bicipite Brachiale (Capo Lungo e Breve)',
    secondaryMuscles: ['Brachiale Anteriore', 'Avambracci'],
    equipment: 'Bilanciere Dritto o Sagomato EZ',
    trainerCues: [
      'Gomiti incollati ai fianchi senza oscillare.',
      'No cheating lombare.',
      'Progressione: aumento peso bisettimanale.'
    ],
    instructions: [
      'In piedi con schiena dritta e presa supina alla larghezza spalle.',
      'Fletti i gomiti portando il bilanciere verso le clavicole.',
      'Spremi i bicipiti e scendi lentamente.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=curl+bilanciere+in+piedi+bicipiti+tutorial',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif'
  },

  'push-down-sbarra': {
    id: 'push-down-sbarra',
    name: 'Cable Straight Bar Triceps Pushdown',
    italianName: 'Push Down Sbarra',
    bodyPart: 'Tricipiti',
    targetMuscle: 'Tricipite Brachiale (Capo Laterale e Mediale)',
    secondaryMuscles: ['Capo Lungo Tricipite', 'Anconeo'],
    equipment: 'Cavo Alto con Sbarra dritta',
    trainerCues: [
      'Gomiti bloccati ai fianchi come fulcro.',
      'Distendi completamente verso il basso.',
      '2 minuti di recupero tra le serie.'
    ],
    instructions: [
      'Afferra la sbarra con presa prona a livello dello sterno.',
      'Spingi verso il basso fino alla completa estensione dei gomiti.',
      'Rilascia controllando fino a 90°.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=pushdown+sbarra+cavi+tricipiti+palestra',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif'
  },

  'curl-manubri-panca-45': {
    id: 'curl-manubri-panca-45',
    name: 'Incline Bench 45 Deg Dumbbell Curl',
    italianName: 'Curl Manubri Panca 45°',
    bodyPart: 'Bicipiti',
    targetMuscle: 'Bicipite Brachiale (Massimo Allungamento)',
    secondaryMuscles: ['Brachioradiale'],
    equipment: 'Panca 45° + Manubri',
    trainerCues: [
      'CEDIMENTO 10-9-8..: lascia cadere le braccia perpendicolari.',
      'Massimo allungamento del capo lungo in partenza.',
      '1 serie di avvicinamento carico.'
    ],
    instructions: [
      'Siediti sulla panca a 45° con manubri verso il pavimento.',
      'Fletti i gomiti supinando i polsi in salita.',
      'Contrai con forza in alto e abbassa lentamente.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=curl+manubri+panca+45+gradi+bicipiti',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/ez-barbell-curl.gif'
  },

  'french-press-manubri-piana': {
    id: 'french-press-manubri-piana',
    name: 'Flat Bench Dumbbell French Press Skull Crusher',
    italianName: 'French Press Manubri Piana',
    bodyPart: 'Tricipiti',
    targetMuscle: 'Tricipite Brachiale (Capo Lungo e Mediale)',
    secondaryMuscles: ['Capo Laterale'],
    equipment: 'Panca Piana + Manubri',
    trainerCues: [
      'Gomiti leggermente inclinati indietro verso la testa (tensione continua).',
      'Muovi solo gli avambracci, i gomiti sono perni fissi.',
      'Cedimento 10-9-8..'
    ],
    instructions: [
      'Sdraiati sulla panca piana con manubri sopra il petto.',
      'Inclina le braccia 15° indietro rispetto alla verticale.',
      'Fletti i gomiti abbassando i manubri verso le orecchie e riestendi con forza.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=french+press+manubri+panca+piana+tricipiti',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-high-pulley-overhead-tricep-extension.gif'
  },

  'hiperextension': {
    id: 'hiperextension',
    name: '45 Degree Roman Chair Hyperextension',
    italianName: 'Hyperextension',
    bodyPart: 'Lombari',
    targetMuscle: 'Erettori Spinali, Glutei, Catena Posteriore',
    secondaryMuscles: ['Bicipiti Femorali'],
    equipment: 'Panca Romana 45°',
    trainerCues: [
      '4 serie x MAX ripetizioni.',
      'Cuscinetto sotto le creste iliache per flettere l\'anca.',
      'NON iperestendere la schiena a fine corsa.'
    ],
    instructions: [
      'Posizionati sul supporto con caviglie bloccate e bacino sul cuscinetto.',
      'Fletti il tronco in avanti piegandoti alle anche.',
      'Risali contraendo i lombari e i glutei fino all\'allineamento con le gambe.'
    ],
    videoTutorialUrl: 'https://www.youtube.com/results?search_query=iperextension+45+gradi+lombari+palestra',
    gifUrl: 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/hyperextension.gif'
  }
};
