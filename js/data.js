/* Hidd el, én vagyok! — játéktartalom
   Minden szöveg itt van, így bővítéshez elég ezt a fájlt szerkeszteni. */
window.HEV = window.HEV || {};

HEV.data = {
  /* Kártyakategóriák. A glyph egyszerű jel, nem emoji, hogy illeszkedjen a letisztult stílushoz. */
  categories: [
    { id: 'people', name: 'Emberek', glyph: '◯', prompts: [
      'Valaki, akit akkor még nem ismertél, de ma fontos neked.',
      'Egy kapcsolat, ami azóta megváltozott.',
      'Egy ember, akire ma büszke vagy.',
      'Valaki, aki meglepett — jó vagy rossz értelemben.',
      'Akivel ma a legtöbbet beszélsz.',
      'Egy barátság, ami kibírta az éveket.'
    ]},
    { id: 'work', name: 'Hivatás', glyph: '△', prompts: [
      'Mivel töltöd most a hétköznapjaidat?',
      'Egy készség, amit azóta tanultál meg.',
      'Egy munkahelyi kudarc, ami végül jól jött.',
      'Egy döntés, amit akkor el sem tudtál volna képzelni.',
      'Valami, amiért ma fizetnek — és akkor nevettél volna rajta.'
    ]},
    { id: 'home', name: 'Otthon', glyph: '⌂', prompts: [
      'Hol laksz most, és milyen az ablakodból a kilátás?',
      'Egy tárgy, ami most mindennap a kezedben van.',
      'Mi van a hűtődben, ami akkor furcsa lett volna?',
      'Egy szokás, ami nálad most otthon törvény.',
      'Hogyan telik nálad egy vasárnap?'
    ]},
    { id: 'body', name: 'Test', glyph: '◐', prompts: [
      'Valami, amit a tested azóta megtanított neked.',
      'Egy szokás, amit felvettél vagy végre elhagytál.',
      'Mit bírsz ma jobban, mint akkor — és mit kevésbé?',
      'Hány órát alszol, és ez mit árul el rólad?'
    ]},
    { id: 'soul', name: 'Belső élet', glyph: '✦', prompts: [
      'Egy kérdés, amire azóta választ találtál.',
      'Egy kérdés, ami azóta is nyitva maradt.',
      'Mi ad most reményt?',
      'Egy gondolat vagy imádság, ami elkísér.',
      'Valami, amit megbocsátottál — magadnak vagy másnak.',
      'Mitől féltél akkor, amitől ma már nem?'
    ]},
    { id: 'tech', name: 'Technika', glyph: '▢', prompts: [
      'Egy eszköz, amit akkor még nem ismertél.',
      'Egy szó, ami akkor még nem létezett, vagy mást jelentett.',
      'Hogyan tartod ma a kapcsolatot az emberekkel?',
      'Mit csinálsz ma a telefonoddal, ami akkor sci-fi lett volna?'
    ]},
    { id: 'world', name: 'Világ', glyph: '◎', prompts: [
      'Egy esemény, amit akkor mindenki átélt, te is.',
      'Valami, amiről azt hitted, sosem változik — mégis megváltozott.',
      'Egy hír, amit elsőre el sem hittél.',
      'Mi lett divat azóta, ami akkor nevetséges lett volna?'
    ]},
    { id: 'turn', name: 'Fordulat', glyph: '↻', prompts: [
      'Egy terv, ami nem jött össze — és mi lett helyette.',
      'Egy félelem, ami végül nem igazolódott.',
      'A legjobb rossz döntésed.',
      'Egy pillanat, amikor minden megfordult.'
    ]},
    { id: 'wild', name: 'Meglepetés', glyph: '✧', prompts: [
      'A legabszurdabb igaz mondat az életedről.',
      'Egy hobbi, amin a régi éned hangosan nevetne.',
      'Valami, amit ma szeretsz, de akkor ki nem állhattál.',
      'Egy hely, ahová eljutottál, pedig akkor nem is tudtál róla.',
      'Egy dal, ami azóta a tiéd lett.'
    ]}
  ],

  /* Időutazó-bingó: minden úthoz 9 mező kerül kisorsolásra. */
  bingo: [
    'Egy szó, ami akkor még nem létezett',
    'Egy ember, akit akkor még nem ismertél',
    'Egy félelem, ami nem igazolódott',
    'Egy jóslatod, ami bejött',
    'Egy hely, ahol azóta jártál',
    'Egy tárgy, amit mindennap használsz',
    'Egy dal, ami azóta fontos lett',
    'Egy kudarc, ami jól jött',
    'Valami, amit megbocsátottál',
    'Egy szokás, amit elhagytál',
    'Egy új felelősség',
    'Egy könyv, ami megváltoztatott',
    'Egy étel, amit akkor nem ettél volna meg',
    'Valami, amin a régi éned nevetne',
    'Egy mondat, amit sokszor mondasz',
    'Egy döntés, amit ma is vállalsz',
    'Egy meglepően jó nap',
    'Valami, ami olcsóbb vagy drágább lett'
  ],
  prophetSquare: 'Egy jóslatod, ami bejött',

  /* Világkártyák. Válogatás, nem teljes lista; az évszámokat ellenőriztük. */
  world: [
    { y: 1953, t: 'Az Aranycsapat 6:3-ra nyer a Wembleyben' },
    { y: 1954, t: 'A berni vb-döntő' },
    { y: 1956, t: 'Az 1956-os forradalom' },
    { y: 1957, t: 'Felbocsátják a Szputnyik–1-et' },
    { y: 1961, t: 'Gagarin az első ember az űrben' },
    { y: 1963, t: 'Meggyilkolják Kennedy elnököt' },
    { y: 1969, t: 'Ember lép a Holdra' },
    { y: 1974, t: 'Rubik Ernő megalkotja a bűvös kockát' },
    { y: 1978, t: 'II. János Pált pápává választják' },
    { y: 1980, t: 'Farkas Bertalan, az első magyar űrhajós' },
    { y: 1981, t: 'Megjelenik az IBM PC' },
    { y: 1984, t: 'Megjelenik az első Macintosh' },
    { y: 1986, t: 'A csernobili katasztrófa' },
    { y: 1989, t: 'Leomlik a berlini fal' },
    { y: 1989, t: 'Kikiáltják a Magyar Köztársaságot' },
    { y: 1990, t: 'Az első szabad választások Magyarországon' },
    { y: 1991, t: 'Felbomlik a Szovjetunió' },
    { y: 1991, t: 'Nyilvános lesz a világháló' },
    { y: 1995, t: 'Megjelenik a Windows 95' },
    { y: 1996, t: 'Megszületik Dolly, a klónozott bárány' },
    { y: 1998, t: 'Megalapítják a Google-t' },
    { y: 1999, t: 'Magyarország a NATO tagja lesz' },
    { y: 1999, t: 'Teljes napfogyatkozás a Balatonnál' },
    { y: 2000, t: 'Az ezredforduló és a Y2K-pánik' },
    { y: 2001, t: 'Elindul a Wikipédia' },
    { y: 2001, t: 'Szeptember 11.' },
    { y: 2002, t: 'Bevezetik az euró-készpénzt' },
    { y: 2003, t: 'Elkészül az emberi genom térképe' },
    { y: 2004, t: 'Magyarország az Európai Unió tagja lesz' },
    { y: 2004, t: 'Elindul a Facebook' },
    { y: 2005, t: 'Elindul a YouTube' },
    { y: 2005, t: 'XVI. Benedeket pápává választják' },
    { y: 2006, t: 'A Plútó törpebolygó lesz' },
    { y: 2007, t: 'Bemutatják az első iPhone-t' },
    { y: 2007, t: 'Magyarország csatlakozik a schengeni övezethez' },
    { y: 2008, t: 'Kitör a gazdasági világválság' },
    { y: 2008, t: 'Megjelenik az első androidos telefon' },
    { y: 2009, t: 'Megszületik a Bitcoin' },
    { y: 2010, t: 'A vörösiszap-katasztrófa' },
    { y: 2010, t: 'Elindul az Instagram' },
    { y: 2011, t: 'A fukusimai katasztrófa' },
    { y: 2012, t: 'A Curiosity leszáll a Marson' },
    { y: 2013, t: 'Ferenc pápát megválasztják' },
    { y: 2014, t: 'Németország 7:1-re veri Brazíliát' },
    { y: 2014, t: 'Űrszonda landol egy üstökösön' },
    { y: 2016, t: 'Magyarország csoportelső az Eb-n' },
    { y: 2016, t: 'Bejelentik a gravitációs hullámok észlelését' },
    { y: 2016, t: 'A brexit-népszavazás' },
    { y: 2018, t: 'Először használnak VAR-t világbajnokságon' },
    { y: 2019, t: 'Leég a párizsi Notre-Dame teteje' },
    { y: 2020, t: 'A koronavírus-járvány és a lezárások' },
    { y: 2021, t: 'Felbocsátják a James Webb űrtávcsövet' },
    { y: 2022, t: 'Oroszország megtámadja Ukrajnát' },
    { y: 2022, t: 'Megjelenik a ChatGPT' },
    { y: 2022, t: 'Messi és Argentína világbajnok' },
    { y: 2024, t: 'A párizsi olimpia' },
    { y: 2025, t: 'Meghal Ferenc pápa, XIV. Leót választják' },
    { y: 2026, t: 'Téli olimpia Milánóban és Cortinában' },
    { y: 2026, t: 'Foci-vb Észak-Amerikában, 48 csapattal' }
  ],

  /* Kezdőlapi forgó évpárok. */
  homePairs: [
    { a: 2019, b: 2026, c: 'A régi éned még sosem ült online meetingen.' },
    { a: 2007, b: 2026, c: 'A régi éned még nyomógombos telefont nyomkod.' },
    { a: 1999, b: 2026, c: 'Napfogyatkozás a Balatonnál, és még nincs Wikipédia.' },
    { a: 2013, b: 2026, c: 'Most választották meg Ferenc pápát.' },
    { a: 2020, b: 2026, c: 'Otthon ül maszkban, és azt hiszi, ez így marad.' },
    { a: 2004, b: 2026, c: 'Épp most lettünk uniós tagok.' }
  ],

  /* A régi én reakciói. {old} {now} {gap} {event} behelyettesítődik. */
  reactions: {
    opening: [
      'Halló? Ki beszél? … Hogy én vagyok, csak {now}-ből? Na, ezt bizonyítsd be.',
      'Ez valami vicc? Jó, figyelek. De ha hazudsz, leteszem.',
      'A hangod ismerős. Ijesztően ismerős. Mondj valamit, amiből tudom, hogy tényleg te vagy.'
    ],
    low: [
      'Hm. Ez valahogy nem lep meg. Mindig is ilyen voltam, nem?',
      'Oké, ezt el tudom képzelni. Mesélj még.',
      'Ennyi? {gap} év alatt azt hittem, nagyobb dolgok történnek.',
      'Ezt simán elhiszem. Túl simán, talán.'
    ],
    mid: [
      'Na ne… komolyan? Jó, elhiszem. Talán.',
      'Ezt le kell írnom valahova.',
      'Furcsa, de valahogy stimmel.',
      'Egy pillanatra elhallgattam. Folytasd.'
    ],
    highEv: [
      'Ezt… ezt tényleg csak én tudhatom. Te tényleg én vagy.',
      'Kirázott a hideg. Folytasd.',
      'Ha ezt nem tudnád, azt mondanám, átverés. De tudod.',
      'Jó. Hiszek neked. Ez a részlet mindent eldöntött.'
    ],
    highTrust: [
      'Nem tudom, miért, de hiszek neked.',
      'Mintha a saját hangomat hallanám. Jó, elhiszem.',
      'Ha bárki más mondaná, kinevetném.'
    ],
    disbelief: [
      'Na persze. És repülni is tudok, igaz?',
      'Ki vagy te valójában? Ezt bárki mondhatná.',
      'Ez túl sok. Mondj valamit, amit csak én tudhatok!',
      'Hallgatom, de egy szavát se hiszem.'
    ],
    world: [
      '„{event}”? Ezt honnan tudhatnád előre?',
      'Ha tényleg így lesz — „{event}” —, akkor te tényleg a jövőből jössz.',
      'Várj. „{event}”? Ezt megjegyzem.'
    ],
    advice: [
      'Miért mondod meg, mit csináljak? Ez mindent megváltoztathat.',
      'Érzem, hogy valami megremeg körülöttünk. Óvatosan a tanácsokkal!',
      'Ha most hallgatok rád, te még ugyanaz leszel?'
    ],
    trustWarn: 'A vonal recseg. A régi éned egyre kevésbé hisz neked.',
    paradoxWarn: 'Az ég furcsán vibrál. Közel az időparadoxon.',
    finalAsk: 'Mielőtt letesszük… mondd, mi az, ami megmaradt belőlem?',
    finalReply: 'Szóval maradtam én — én. Köszönöm, hogy felhívtál.',
    hangup: 'A régi éned letette a kagylót. Talán legközelebb több bizonyítékot hozol.',
    paradox: 'A régi éned alakja elhalványul. Túl sokat mondtál el, és az idő visszavette a szavaidat.'
  },

  achievements: [
    { id: 'first', glyph: '☾', title: 'Első hívás', desc: 'Végigmentél egy csendes úton.' },
    { id: 'leap', glyph: '⟿', title: 'Nagy ugrás', desc: 'Legalább 10 év különbséget hidaltál át.' },
    { id: 'unbelievable', glyph: '✦', title: 'Hihetetlen, de igaz', desc: 'Két „lehetetlen” fokú hírt is elhitettél a régi éneddel.' },
    { id: 'prophet', glyph: '◉', title: 'Próféta', desc: 'Megtaláltad egy jóslatodat, ami bejött.' },
    { id: 'quiet', glyph: '◌', title: 'Csendes megfigyelő', desc: 'Egyetlen tanács nélkül végigmentél.' },
    { id: 'paradox', glyph: '∞', title: 'Időparadoxon', desc: 'Túl sokat mondtál el. Megtörtént.' },
    { id: 'hangup', glyph: '☏', title: 'Letett kagyló', desc: 'A régi éned nem hitt neked.' },
    { id: 'bingo', glyph: '▦', title: 'Bingó', desc: 'Kiraktál egy sort az időutazó-bingón.' },
    { id: 'bingo2', glyph: '▩', title: 'Dupla sor', desc: 'Két bingósort is kiraktál egy úton.' },
    { id: 'worldly', glyph: '◎', title: 'Világpolgár', desc: 'Három világeseményt is a saját történetedhez kötöttél.' },
    { id: 'collector', glyph: '❖', title: 'Időkapszula-gyűjtő', desc: 'Öt kapszulát elmentettél.' },
    { id: 'party', glyph: '☀', title: 'Társaság', desc: 'Végigjátszottál egy társasjátékot.' },
    { id: 'liar', glyph: '✧', title: 'Mestercsaló', desc: 'Egy körben mindenkit becsaptál (legalább ketten tippeltek).' },
    { id: 'oracle', glyph: '◈', title: 'Időjós', desc: 'Egy egész játékban minden tipped talált (legalább két tipp).' }
  ],

  /* Társasjáték: eseménykártyák. A nyugodt kör kétszer szerepel, így gyakrabban jön. */
  twists: [
    { id: 'calm', title: 'Nyugodt kör', desc: 'Nincs különleges szabály. Csak mesélj.' },
    { id: 'calm', title: 'Nyugodt kör', desc: 'Nincs különleges szabály. Csak mesélj.' },
    { id: 'double', title: 'Dupla ugrás', desc: 'Ebben a körben minden pont duplán ér.' },
    { id: 'whisper', title: 'Suttogás', desc: 'Minden állítás legfeljebb 8 szó lehet.' },
    { id: 'world', title: 'Világkapocs', desc: 'A hamis állításnak egy valódi világeseményhez kell kapcsolódnia.' },
    { id: 'good', title: 'Csak jó hír', desc: 'Mindhárom állítás legyen jó hír a régi énednek.' },
    { id: 'small', title: 'Apróságok', desc: 'Csak hétköznapi apróságokról mesélhetsz: étel, tárgyak, szokások.' },
    { id: 'invert', title: 'Fordított világ', desc: 'Két hamis és egy igaz állítás. A többiek az igazat keresik!' },
    { id: 'same', title: 'Ami megmaradt', desc: 'Az egyik igaz állítás arról szóljon, ami nem változott.' }
  ]
};
