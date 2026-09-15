# Neuvaine au Sacré-Cœur

Site mobile-first pour la neuvaine du 16 au 24 septembre 2026, en préparation de la
veillée avec le pape Léon XIV au Stade de France le 25 septembre.

Construit d'après la maquette Claude Design « Neuvaine Sacré-Cœur ». Site statique,
aucune dépendance, aucun outil de construction : on ouvre `index.html` et ça fonctionne.

## Contenu

```
index.html              les trois écrans : accueil, jour, consécration
assets/css/styles.css   palette, typographie, mise en page
assets/css/fonts.css    déclaration des polices auto-hébergées
assets/fonts/           les trois familles en woff2, 191 Ko
assets/js/app.js        dates, compte à rebours, contenu des jours, navigation
assets/audio/jour-1.mp3 méditation du premier jour
_headers                en-têtes de sécurité, Netlify et Cloudflare Pages
.htaccess               en-têtes de sécurité, hébergement Apache
sources/                transcriptions de référence, à ne pas publier
```

## Identité visuelle

| Rôle | Valeur |
| --- | --- |
| Fond de l'application | `#14452E` |
| Panneaux sombres | `#0F3A26` |
| Menthe | `#A8E6C3` |
| Crème | `#F4EFE4` |
| Cramoisi | `#8B1A2B` |
| Or | `#C9A24A` |

Titres en Anton, prières et versets en Cormorant Garamond, texte courant en Figtree.
La largeur est limitée à 480 px et centrée, comme dans la maquette.

## Comment fonctionne le compte à rebours

Le repère est la veillée du 25 septembre. `J-9` est donc le premier jour, le
16 septembre, et `J-1` le neuvième, le 24 septembre. Tout se déduit d'une seule
constante dans `assets/js/app.js` :

```js
var START = new Date(2026, 8, 16);   // les mois sont indexés à partir de zéro
```

Chaque case de la grille prend l'un de ces états :

- **cramoisi** avec une pastille, quand la date tombe aujourd'hui ;
- **menthe**, quand le jour est publié ;
- **sombre**, quand le contenu n'est pas encore écrit.

Le bouton « Prier aujourd'hui » ouvre le jour en cours. Avant le 16 septembre il ouvre
le premier jour et affiche le nombre de jours restant jusqu'à la veillée.

## Ajouter le contenu d'un jour

Les neuf jours vivent dans l'objet `CONTENT` de `assets/js/app.js`. Le premier jour est
rédigé, les huit autres valent `null` et affichent « Ce jour sera disponible le … ».
Pour publier un jour, remplacez le `null` par un objet de cette forme :

```js
2: {
  title:      "Titre du jour",
  verse:      "« Citation de l'Évangile »",
  ref:        "Luc 6, 6-11",
  meditation: ["premier paragraphe", "deuxième paragraphe"],
  intention:  "Intention du jour.",
  prayer:     ["premier paragraphe", "deuxième paragraphe"],
  audio:      "assets/audio/jour-2.mp3"   // facultatif
}
```

Sans champ `audio`, le lecteur reste désactivé et affiche « Enregistrement audio à
venir ». Avec un fichier, le bouton devient actif et la barre dorée suit la lecture.

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

L'outil écrit `assets/audio/jour-N.sync.json`, remplit les champs `audio`, `sync` et
`chapitres` du jour dans `contenu.js`, et laisse un compte rendu dans
`outils/rapport-jour-N.txt`. **Il ne touche jamais aux textes.**

Lisez le compte rendu. Sous 85 % d'appariement, l'outil le dit et refuse de conclure :
cela signifie que la lectrice a lu autre chose que le texte affiché. Le jour 1 est à
95,8 %.

### Corriger un décalage

Si le surlignage est systématiquement en avance ou en retard, il n'y a rien à
réaligner : ouvrez `assets/audio/jour-N.sync.json` et modifiez le seul champ
`decalage`, exprimé en secondes et signé.

```json
{ "version": 1, "jour": 1, "decalage": -0.4, "mots": [ … ] }
```

Une valeur négative avance le surlignage, une valeur positive le retarde. Le fichier
étant regénéré à chaque alignement, reportez la valeur trouvée si vous relancez
l'outil.

### Ce que le suivi ne fait pas

Le chant et l'envoi ne sont pas affichés sur le site : pendant ces passages aucun mot
n'est allumé, et seul le chapitre l'indique. Treize mots du jour 1, presque tous de la
ponctuation isolée, n'ont pas d'équivalent sonore : le surlignage passe simplement
par-dessus.

## Vérifier l'affichage à une autre date

Ajoutez un paramètre à l'adresse pour simuler un jour donné, sans toucher au code :

```
index.html?date=2026-09-20
```

## Ce qui reste à compléter

- Les méditations des jours 2 à 9.
- Les enregistrements des jours 2 à 9. Le jour 1 est en place.
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
