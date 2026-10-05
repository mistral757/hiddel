# Hidd el, én vagyok!

Időutazó beszélgetőjáték a böngészőben. Választasz két évet az életedből: a régebbi éned felveszi a telefont, a mostani éned elmeséli neki, mi történt azóta. A csavar: a régi éned nem hisz neked.

Két mód van, a kezdőlapon lehet választani:

- **Csendes út** – egyszemélyes, elmélkedő mód. Kártyák, bizalommérő, időparadoxon, időutazó-bingó, világesemények, kitüntetések, a végén megosztható időkapszula-kép.
- **Társasjáték** – 2–6 fő, egy telefon körbeadva. Mindenki két igaz és egy hamis „azóta történt” állítást mesél, a többiek tippelnek. Eseménykártyák csavarnak a szabályokon.

A látványvilág rétegzett hegyeket, párás levegőt és lassú napszakváltást használ; minden procedurálisan rajzolódik, nincs benne külső kép. A zene generatív: a böngésző Web Audióval élőben játssza, hangfájl nélkül.

## Futtatás

Nincs build lépés, nincs függőség.

- **Legegyszerűbb:** nyisd meg az `index.html`-t a böngészőben.
- **Helyi szerverrel** (ajánlott, így a betűtípusok is biztosan betöltődnek):
  ```bash
  python3 -m http.server 8000
  # majd: http://localhost:8000
  ```

A zene csak az első érintés vagy kattintás után indul, mert a böngészők nem engednek automatikus hanglejátszást. A jobb felső gombbal ki- és bekapcsolható, a beállítást megjegyzi.

## Feltöltés GitHubra és közzététel

```bash
cd hidd-el-en-vagyok
git init
git add .
git commit -m "Első változat"
git branch -M main
git remote add origin https://github.com/FELHASZNALONEV/hidd-el-en-vagyok.git
git push -u origin main
```

GitHub Pages bekapcsolása: a repó **Settings → Pages** oldalán a *Source* legyen *Deploy from a branch*, az ág `main`, a mappa `/ (root)`. Pár perc múlva elérhető lesz itt: `https://FELHASZNALONEV.github.io/hidd-el-en-vagyok/`. A `.nojekyll` fájl miatt a GitHub nem dolgozza fel a fájlokat, egy az egyben kiszolgálja őket.

## Felépítés

```
index.html          az oldal váza
css/style.css       minden stílus
js/data.js          minden szöveg: kártyák, bingó, világesemények, reakciók, kitüntetések, eseménykártyák
js/ui.js            tárolás, megjelenítési segédek, kitüntetések, statisztika
js/scenery.js       a táj: hegyrétegek, pára, nap/hold, csillagok, madarak, hó
js/audio.js         generatív zene és apró hangjelzések
js/capsule.js       időkapszula-kép (1080×1350 PNG) és a gyűjtemény
js/solo.js          Csendes út
js/party.js         Társasjáték
js/app.js           kezdőlap, súgó, gyűjtemény, navigáció, zenegomb
assets/favicon.svg  ikon
```

A szkriptek sima `<script>` címkékkel töltődnek (nem ES-modulok), így a játék `file://` címről megnyitva is működik.

## Szabályok röviden

**Csendes út.** A két év különbsége határozza meg az üzenetek számát (`9 − ⌈különbség/2⌉`, 3 és 7 között) és a pontszorzót (`1 + 0,15 × különbség`, legfeljebb 6). Minden üzenetnél:

- választasz egyet három kártyából (két alkalommal kérhetsz újakat);
- beállítod, mennyire hihetetlen a hír (1–5);
- ha legalább 10 karakteres bizonyítékot adsz, a régi éned elhiszi; ha nem, akkor csak akkor, ha `hihetetlenség × 20 ≤ bizalom + 20`;
- elhitt üzenet: hihetetlenség × 10 pont, el nem hitt: × 3;
- világkapocs +15, tanács +20 (de időparadoxon +22 + 4 × hihetetlenség), bingómező +5, kirakott bingósor +30.

Ha a bizalom nullára esik, a régi éned leteszi a kagylót; ha az időparadoxon eléri a 100-at, a hívás megszakad. A végén a kötelező „Ami ugyanaz maradt” kártya +20 pont, majd minden a szorzóval szorzódik.

**Társasjáték.** Aki eltalálja a kakukktojást, 2 pontot kap. A mesélő minden becsapott játékosért 2 pontot kap, ha mindenkit becsapott, további 2-t, és legalább 10 év különbségnél +1-et. A „Dupla ugrás” eseménykártya duplázza a kör pontjait, a „Fordított világ” két hamis és egy igaz állítást kér.

## Bővítés

Szinte minden a `js/data.js` fájlban van. Új kártyát a `categories` megfelelő `prompts` tömbjébe, új világeseményt a `world` tömbbe (`{ y: évszám, t: 'szöveg' }`), új eseménykártyát a `twists` tömbbe írhatsz. Ha új eseménykártyának saját szabálya is van, azt a `js/party.js` kezeli (`twist.id` alapján).

## Adatkezelés

Minden beírt szöveg, mentett kapszula és kitüntetés csak az adott eszköz böngészőjében (localStorage) marad. A játék semmit nem küld el. A súgóoldal alján egy gombbal minden mentett adat törölhető.

## Ötletek a folytatáshoz

- A régi ént játszó MI, amelyik csak azt tudja, amit abban az évben tudhattál. Ehhez kell egy kis szerveroldali közvetítő (például egy Cloudflare Worker), mert API-kulcsot nem szabad a nyilvános oldalba tenni.
- Közös kapszulafal a társasjáték végén.
- Telepíthető alkalmazás (PWA) offline működéssel.

## Licenc

MIT – lásd a `LICENSE` fájlt.
