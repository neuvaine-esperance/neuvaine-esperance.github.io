# Neuvaine au Sacré-Cœur

Site mobile-first pour la neuvaine du 16 au 24 septembre 2026, en préparation de la
veillée avec le pape Léon XIV au Stade de France le 25 septembre.

Construit d'après la maquette Claude Design « Maquettes v2 WhatsApp ». Site statique,
aucune dépendance, aucun outil de construction : on ouvre `index.html` et ça fonctionne.

## Contenu

```
index.html                    les trois écrans : accueil, jour, consécration
assets/css/styles.css         palette, typographie, mise en page
assets/css/fonts.css          déclaration des polices auto-hébergées
assets/fonts/                 Archivo Black et League Spartan en woff2, 75 Ko
assets/js/contenu.js          le texte des neuf jours, et rien d'autre
assets/js/app.js              dates, navigation, lecteur, suivi mot à mot
assets/audio/jour-N.mp3       l'enregistrement de chaque jour
assets/audio/jour-N.sync.js   les horaires du surlignage, quand ils existent
assets/transcriptions/        les transcriptions horodatées, source de l'alignement
outils/aligner.py             fabrique les fichiers de synchronisation
_headers                      en-têtes de sécurité, Netlify et Cloudflare Pages
.htaccess                     en-têtes de sécurité, hébergement Apache et LiteSpeed
sources/                      documents de référence, à ne jamais publier
```

## Identité visuelle

| Rôle | Valeur |
| --- | --- |
| Pourtour de page, texte d'appui sur vert | `#DBD0B4` sable |
| Fond de l'application | `#F6F0E8` crème |
| Panneaux, lecteur, cartouches | `#274E17` vert |
| Boutons principaux, répons, accents | `#8B1A2F` cramoisi |
| Étiquettes et acclamation sur vert | `#E8B84B` or |

Le vert a été foncé de 3 % de clarté par rapport à la maquette — `#2D5A1B` devient
`#274E17` — pour que l'or tienne 5,20:1 par-dessus. Cette combinaison est partout :
étiquette du lecteur, acclamation, intertitres des cartouches.

Titres en Archivo Black, tout le reste en League Spartan. Les tailles sont en rem,
sur une base de 17 px qui passe à 18 px au-delà de 768 px : le réglage de taille de
texte du navigateur est donc respecté. La colonne est limitée à 480 px, 600 px sur
grand écran.

## Comment fonctionne la numérotation

Le premier jour est le 16 septembre, le neuvième le 24. Les cartes portent `J1` à
`J9`. Tout se déduit d'une seule constante dans `assets/js/app.js` :

```js
var START = new Date(2026, 8, 16);   // les mois sont indexés à partir de zéro
```

Un jour s'ouvre le matin même, comme la page d'attente l'annonce : il lui faut son
texte **et** sa date arrivée. Deux réglages, en tête du même fichier :

```js
var OUVRIR_TOUT = false;      // true ouvre les neuf jours d'un coup
var OUVERTS_DAVANCE = [1];    // ces jours-là s'ouvrent sans attendre leur date
```

Chaque carte prend l'un de ces états : **aujourd'hui** sur fond vert avec une pastille
dorée, **prié** pour un jour passé, **disponible** pour un jour ouvert d'avance,
**en attente** sinon.

## Ajouter ou corriger le contenu d'un jour

Tout le texte vit dans `assets/js/contenu.js`, et rien d'autre n'y est. On peut le
corriger sans jamais ouvrir `app.js`.

```js
2: {
  titre:      'Titre du jour',
  verset:     '« Citation »',              // ou un tableau de lignes, pour un poème
  source:     'Luc 6, 6-11',
  meditation: ['premier paragraphe', 'deuxième paragraphe'],
  musique:    'Titre — interprète',        // facultatif
  intention:  'Intention du jour.',        // facultatif
  priere:     ['paragraphe', '— Répons de litanie'],
  lecteur:    'Ludivine',                  // facultatif
  audio:      'assets/audio/jour-2.mp3?v=2',
  sync:       'assets/audio/jour-2.sync.js',
  chapitres:  { meditation: 9.98, chant: 126.6 }
}
```

Une entrée de `priere` commençant par un tiret cadratin est le répons d'une litanie :
elle s'affiche en cramoisi, détachée du reste.

Les trois derniers champs — `audio`, `sync`, `chapitres` — sont écrits par
`outils/aligner.py` : inutile de les saisir à la main. Sans `audio`, le lecteur reste
désactivé et affiche « Enregistrement audio à venir ». Sans `sync`, le lecteur
fonctionne mais le texte n'est pas surligné.

Le signe de croix, les prières d'ancrage, l'acclamation et l'envoi sont les mêmes tous
les jours : ils sont dans `index.html`, pas ici. La voix qui reprend chaque jour à
partir de la prière est la constante `LECTEUR_PRIERES` d'`app.js`.

## Préparer un enregistrement

Les sources sont des WAV bruts, trop lourds et trop faibles pour le web. La recette
utilisée pour le jour 1, à reprendre pour les suivants, tient en deux étapes.

Mesurer d'abord la sonie du fichier source :

```bash
ffmpeg -i source.wav -af "pan=mono|c0=0.5*c0+0.5*c1,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null -
```

Reporter ensuite les quatre valeurs mesurées dans l'encodage :

```bash
ffmpeg -i source.wav \
  -af "pan=mono|c0=0.5*c0+0.5*c1,highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=…:measured_TP=…:measured_LRA=…:measured_thresh=…" \
  -ar 44100 -ac 1 -c:a libmp3lame -b:a 96k -write_xing 1 \
  assets/audio/jour-N.mp3
```

Le passage en mono est sans perte quand les deux canaux sont identiques, ce qui était
le cas du jour 1. Le coupe-bas à 70 Hz reste sous la voix et évite d'amplifier les
grondements. La cible de -16 LUFS est le niveau habituel de la parole sur le web.

## Synchronisation mot à mot

Pendant la lecture, le mot prononcé est surligné et la page se déplace pour le garder
sous les yeux. Cela demande deux fichiers par jour : l'enregistrement, et une
transcription horodatée.

### Déposer un nouveau jour

1. L'enregistrement dans `assets/audio/jour-N.mp3`, encodé selon la recette ci-dessus.
2. La transcription dans `assets/transcriptions/jour-N.json`. Le projet Remotion la
   produit sous `public/transcription-jour-N.json` : il suffit de la recopier.

Attention : la transcription doit venir **du rendu que le site publie**. Le jour 1 l'a
montré — un nouveau rendu de deux secondes plus long a décalé toute la seconde moitié,
et le surlignage aurait dérivé d'autant.

La transcription attendue a cette forme — c'est celle que Remotion écrit déjà :

```json
{ "jour": 1,
  "sections": [
    { "id": "signe-de-croix", "label": "SIGNE DE CROIX",
      "debut": 0.8, "fin": 9.38, "chante": false,
      "mots": [ { "mot": "Au", "debut": 0.94, "fin": 1.05 } ] }
  ] }
```

Les six sections attendues sont `signe-de-croix`, `meditation`, `chant`, `prions`,
`prieres` et `envoi`. Les horaires sont en secondes.

### Lancer l'alignement

```bash
python outils/aligner.py 1       # un jour
python outils/aligner.py tout    # tous les jours disponibles
```

L'outil écrit `assets/audio/jour-N.sync.js`, remplit les champs `audio`, `sync` et
`chapitres` du jour dans `contenu.js`, et laisse un compte rendu dans
`outils/rapport-jour-N.txt`. **Il ne touche jamais aux textes.**

Lisez le compte rendu. Sous 85 % d'appariement, l'outil le dit et refuse de conclure :
cela signifie que la personne a lu autre chose que le texte affiché. Le jour 1 est à
95,9 %.

### Corriger un décalage

Si le surlignage est systématiquement en avance ou en retard, il n'y a rien à
réaligner : ouvrez `assets/audio/jour-N.sync.js` et modifiez le seul champ
`decalage`, exprimé en secondes et signé.

```js
window.NEUVAINE_SYNC[1] = {"version":1,"jour":1,"decalage":-0.4,"mots":[ … ]};
```

Ce fichier est un script plutôt qu'un JSON à dessein : la page doit pouvoir le
charger même ouverte directement depuis le disque, où le navigateur refuse toute
requête. Cela permet aussi de laisser `connect-src` fermé dans la politique de
sécurité.

Une valeur négative avance le surlignage, une valeur positive le retarde. Le fichier
étant regénéré à chaque alignement, reportez la valeur trouvée si vous relancez
l'outil.

### Ouvrir la page depuis le disque

Le texte, le lecteur et le surlignage fonctionnent en double-cliquant sur
`index.html`. Deux réserves : les polices Archivo Black et League Spartan ne se
chargent pas — le navigateur les refuse hors serveur, et la page retombe sur les
polices du système — et la mise en cache ne se teste pas. Pour juger du rendu,
passez par un serveur :

```bash
python -m http.server 8750
```

puis `http://127.0.0.1:8750/`.

### Ce que le suivi ne fait pas

Le chant n'est pas affiché sur le site : pendant ces deux minutes aucun mot n'est
allumé, seul le chapitre l'indique. Treize mots du jour 1, presque tous de la
ponctuation isolée, n'ont pas d'équivalent sonore : le surlignage passe simplement
par-dessus.

Le texte affiché doit dire ce que la voix dit. Quand les deux s'écartent, c'est
l'enregistrement qui fait foi — à une réserve près : la transcription contient des
fautes, et il ne faut pas les recopier. Elle a écrit « de commencement » pour « au
commencement », et « aimons-nous les âmes et les autres » dans le chant.

## Vérifier l'affichage à une autre date

Ajoutez un paramètre à l'adresse pour simuler un jour donné, sans toucher au code :

```
index.html?date=2026-09-20
```

## Ce qui reste à compléter

- Les transcriptions des jours 2 à 9. Sans elles, ces jours ont le son et le texte,
  mais pas le surlignage mot à mot.
- Une transcription du nouveau rendu du jour 1, si l'on veut le publier à la place de
  celui qui est en ligne.
- L'adresse du canal WhatsApp et le compte Instagram : deux constantes vides en tête
  d'`app.js`. Tant qu'elles le sont, les invitations à rejoindre le canal n'apparaissent
  pas.
- Les horaires et les modalités d'accès de la veillée, à confirmer par le diocèse.
  Ils sont actuellement marqués comme tels dans l'écran Consécration.

## Sécurité

Le site n'a ni serveur, ni base de données, ni formulaire, ni compte. La surface
d'attaque est donc très réduite, mais quelques points ont été traités.

**Aucune requête ne part vers un tiers.** Les polices étaient chargées depuis Google,
ce qui transmettait l'adresse IP de chaque visiteur. Elles sont désormais servies
depuis le site. Il n'y a ni mesure d'audience, ni traceur, ni cookie, ni stockage
navigateur. Rien à déclarer côté RGPD, et rien à demander au visiteur.

**Le script n'écrit jamais de balisage.** Tous les textes sont posés avec
`textContent`. Il n'y a aucun `innerHTML`, aucun gestionnaire d'événement en ligne,
aucun `eval`.

**Les deux entrées du visiteur sont contrôlées.** Le paramètre `?date=` ne sert qu'à
construire une date, rejetée si elle est invalide. L'ancre `#jour-N` est filtrée par
une expression régulière. Ni l'une ni l'autre ne touche au document.

**La politique de sécurité du contenu interdit tout par défaut**, puis autorise le
strict nécessaire, et uniquement depuis ce site. Elle est posée deux fois, dans une
balise de `index.html` et dans les en-têtes du serveur, parce qu'une balise ne peut
pas porter `frame-ancestors`.

## Mise en ligne

N'importe quel hébergement de fichiers statiques convient. Rien à compiler.

Deux fichiers de configuration sont fournis, choisissez celui qui correspond :

| Hébergeur | Fichier |
| --- | --- |
| Netlify, Cloudflare Pages | `_headers` |
| Apache mutualisé, OVH, Ionos, Infomaniak | `.htaccess` |

**Ne publiez que ces éléments :**

```
index.html
assets/
_headers   ou   .htaccess
```

Le reste est du matériel de travail et doit rester sur votre machine. Le dossier
`sources/` contient des transcriptions d'homélies qui ne nous appartiennent pas, et
`.agents/`, `.claude/` et `skills-lock.json` sont de l'outillage. Le `.gitignore` les
écarte déjà, et le `.htaccess` refuse de les servir si l'envoi se fait par FTP.

**À vérifier après la première mise en ligne :**

- Les polices s'affichent bien. Si elles ne se chargent pas, l'hébergeur sert
  probablement les `.woff2` avec le mauvais type et l'en-tête `nosniff` les rejette.
- `https://votre-site/sources/` renvoie bien une erreur et non le contenu.
- `Strict-Transport-Security` n'est à laisser actif qu'une fois le certificat en
  place. Il force HTTPS pour un an sur les visites suivantes.
