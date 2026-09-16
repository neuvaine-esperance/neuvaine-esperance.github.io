# Neuvaine au Sacré-Cœur

Site mobile-first pour la neuvaine du 16 au 24 septembre 2026, en préparation de la
veillée avec le pape Léon XIV au Stade de France le 25 septembre.

Construit d'après la maquette Claude Design « Maquettes v2 WhatsApp ». Site statique,
aucune dépendance, aucun outil de construction : on ouvre `index.html` et ça fonctionne.

## Contenu

```
index.html                    les cinq écrans : accueil, jour, consécration, envoi, stats
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

Le premier jour est le 16 septembre, le neuvième le 24. La page d'un jour porte
`J1` à `J9`. Tout se déduit d'une seule constante dans `assets/js/app.js` :

```js
var START = new Date(2026, 8, 16);   // les mois sont indexés à partir de zéro
```

Un jour s'ouvre le matin même, comme la page d'attente l'annonce : il lui faut son
texte **et** sa date arrivée. Deux réglages, en tête du même fichier :

```js
var OUVRIR_TOUT = false;      // true ouvre les neuf jours d'un coup
var OUVERTS_DAVANCE = [1];    // ces jours-là s'ouvrent sans attendre leur date
```

## L'accueil

C'est une page d'atterrissage, et rien d'autre. **On n'entre pas dans un jour depuis
l'accueil** : chaque jour part le matin sur le canal WhatsApp, avec son lien. Le site
ne sert qu'à le recevoir et à rejoindre le canal.

Il n'y a donc **qu'une seule commande sur toute la page** : le bouton « Rejoindre le
canal WhatsApp », dans le cartouche vert « Comment participer », à la place que lui
donne la maquette — juste sous l'en-tête. Tout le reste est du texte.

Ni bouton « Prier aujourd'hui », ni grille des neuf jours, ni sommaire des thèmes. La
seule trace du jour en cours est une ligne écrite par `renderHome()` dans `app.js` :

> Aujourd'hui : jour 3 / 9 — La fidélité

Du texte, pas un bouton : pas de chevron, pas de survol, rien qui donne envie
d'appuyer. Elle garde en revanche la taille du texte courant plutôt que les petites
capitales espacées de la maquette — elle se lit, elle ne décore pas. Avant le
16 septembre elle annonce « Dès maintenant » si le jour 1 est déjà ouvert, sinon la
date d'ouverture.

Même raison pour le bandeau des dates : plein cramoisi dans la maquette, il avait
l'air d'un bouton à appuyer. Il est devenu du texte sur le même panneau de crème que
les autres lignes.

Le cartouche « Comment participer », lui, est toujours affiché, même si l'adresse du
canal venait à manquer : il dit comment la neuvaine se reçoit, ce qui vaut d'être lu
sans bouton. Seul le bouton dépend de `LIEN_WHATSAPP`. Son texte est dicté mot pour
mot — deux phrases, deux paragraphes — et vit dans `index.html`, pas dans le script.

## La page des organisateurs

`index.html#envoyer` rassemble les liens à envoyer. Elle n'est listée nulle part :
aucun bouton du site n'y mène, on y arrive en tapant son adresse. Rien n'y est secret
pour autant — ce sont les mêmes adresses publiques que tout le monde reçoit.

Elle porte le jour du matin en avant, avec son message tout prêt :

```
*Neuvaine au Sacré-Cœur — Jour 3 / 9*
_La fidélité_
Dix minutes de prière, à écouter ou à lire.
https://neuvaine-esperance.github.io/#rbw4ehjj
```

Trois boutons : « Ouvrir dans WhatsApp », qui passe par `wa.me` et laisse choisir le
destinataire ; « Copier le message » ; « Copier le lien ». Puis les neuf liens, un par
carte, chacun avec son bouton — et « Tout copier », qui met les neuf dans le
presse-papiers d'un coup, prêts à coller dans un message à l'équipe.

Les adresses sont construites à partir de celle où la page est servie : elles sont
donc justes quel que soit l'hébergeur, et un essai en local donne des liens en local.
Ouverte depuis le disque, où l'adresse du fichier ne servirait à personne, la page
reprend la constante `ADRESSE_PUBLIQUE` d'`app.js`.

Chaque bouton confirme lui-même : son libellé devient « Copié ✓ » sur fond doré
pendant deux secondes et demie. Si le presse-papiers est refusé — il l'est hors
connexion sécurisée — la page le dit et renvoie au texte, qui est écrit en clair et
se sélectionne à la main. Les liens sont affichés en entier pour cette raison.

## Un jour ne s'ouvre que par son lien

Chaque jour porte un code d'adresse plutôt que son numéro : `#rbw4ehjj` et non
`#jour-3`. On ne passe donc pas au jour suivant en modifiant l'adresse, et l'on
n'ouvre que le jour qu'on a reçu le matin. La table est en tête d'`app.js` :

```js
var CODES = ['', 'sc5gtesv', 'gc2uzt4n', 'rbw4ehjj', …];   // index = numéro du jour
```

**Ces codes ne doivent plus changer.** En modifier un casse le lien déjà envoyé pour
ce jour-là. L'alphabet n'a ni `i`, ni `l`, ni `o`, ni `0`, ni `1` : un lien se relit
sans ambiguïté.

On ne passe plus non plus d'un jour à l'autre : les flèches « Jour précédent / Jour
suivant » ont quitté le bas de chaque jour. Un lien ouvre son jour, et rien d'autre.
`#jour-3`, l'ancienne forme, ramène à l'accueil, comme n'importe quel code inconnu.

**La consécration fait exception, et c'est voulu.** Elle n'est pas un dixième jour
mais une prière permanente, à dire chaque jour par qui le souhaite. Son lien est donc
au pied de chaque jour : on ouvre le lien du matin, on prie, et l'on peut enchaîner
sans repasser par l'accueil — où l'on n'arrive jamais quand on vient du canal. La
barrière tient malgré tout : de la consécration on ne va pas à un autre jour.

**Ce que cela ne fait pas.** C'est une barrière de courtoisie, pas une serrure. La
table des codes est dans `app.js` et le texte des neuf jours dans `contenu.js`, tous
deux publics et servis avec le site : qui ouvre la source a les neuf jours. Le
procédé empêche de passer devant, il ne cache rien. Un site statique ne peut pas
faire mieux — il faudrait un serveur, donc une autre architecture.

## Ajouter ou corriger le contenu d'un jour

Tout le texte vit dans `assets/js/contenu.js`, et rien d'autre n'y est. On peut le
corriger sans jamais ouvrir `app.js`.

```js
2: {
  titre:      'Titre du jour',
  verset:     '« Citation »',              // ou un tableau de lignes, pour un poème
  source:     'Luc 6, 6-11',
  origine:    'Parole du pape François',    // facultatif, voir ci-dessous
  meditation: ['premier paragraphe', 'deuxième paragraphe'],
  musique:    'Titre — interprète',        // facultatif
  paroles:    ['premier vers', 'deuxième'], // facultatif, une entrée par vers
  intention:  'Intention du jour.',        // facultatif
  priere:     ['paragraphe', '— Répons de litanie'],
  audio:      'assets/audio/jour-2.mp3?v=2',
  sync:       'assets/audio/jour-2.sync.js',
  chapitres:  { meditation: 9.98, chant: 126.6 }
}
```

`origine` nomme l'intertitre du bloc cité. **« Parole de Dieu » ne se dit que de
l'Écriture** : le champ existe pour les jours qui citent quelqu'un d'autre. Sans lui,
l'intertitre vaut « Parole de Dieu », ce qui convient aux six jours qui citent
l'Évangile. Les trois autres le portent :

| Jour | Ce qui est cité | `origine` |
| --- | --- | --- |
| 1 | Lettre encyclique *Dilexit nos* | `Parole du pape François` |
| 4 | Sainte Thérèse d'Avila | `Parole de sainte Thérèse d'Avila` |
| 6 | Message pour la Journée du migrant | `Parole du pape François` |

La remarque vient d'un religieux, et elle vaut pour la suite : **vérifier ce champ à
chaque jour ajouté.** Un texte de saint ou de pape annoncé comme Parole de Dieu est
une faute, pas une approximation.

L'intertitre n'est pas compté par le surlignage : le changer ne touche à rien.

Une entrée de `priere` commençant par un tiret cadratin est le répons d'une litanie :
elle s'affiche en cramoisi, détachée du reste.

`paroles` affiche le texte du chant sous son titre, un vers par ligne. Il est surligné
comme le reste pendant que le chant passe — à condition que les paroles données soient
les bonnes : ne les recopiez pas depuis la transcription, qui les entend mal.

Les trois derniers champs — `audio`, `sync`, `chapitres` — sont écrits par
`outils/aligner.py` : inutile de les saisir à la main. Sans `audio`, le lecteur reste
désactivé et affiche « Enregistrement audio à venir ». Sans `sync`, le lecteur
fonctionne mais le texte n'est pas surligné.

Le signe de croix, les prières d'ancrage, l'acclamation et l'envoi sont les mêmes tous
les jours : ils sont dans `index.html`, pas ici.

Le champ `lecteur` existe encore dans `contenu.js` — les neuf jours le portent — mais
il n'est plus affiché nulle part : ni sous le titre du jour, ni dans le lecteur, ni sur
l'accueil. Les noms ont été retirés de l'affichage à la demande. Le champ reste à
disposition si l'on veut qu'ils reviennent.

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

Les sections attendues sont `signe-de-croix`, `meditation`, `chant`, `prions`,
`prieres` et `envoi`. Les horaires sont en secondes. Le `chant` est facultatif :
quand la musique est comprise dans la méditation, l'outil s'en accommode.

L'intention se lit tantôt avant la méditation, tantôt après — le jour 3 après, le
jour 8 avant. L'outil le constate dans l'enregistrement et écrit `intentionAvant`
dans `contenu.js` ; la page place alors la section au bon endroit.

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

Une valeur négative retient le surlignage, une valeur positive le fait prendre de
l'avance. Le fichier étant regénéré à chaque alignement, reportez la valeur trouvée si
vous relancez l'outil.

Pour corriger les neuf jours d'un coup, c'est la constante `DECALAGE_GLOBAL` en tête
d'`app.js` : elle s'ajoute au `decalage` de chaque fichier. Elle vaut -0,15 s, les
horodatages de la transcription tombant un rien en avance sur ce que l'oreille
perçoit.

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

Une réserve : ce serveur ne répond pas aux requêtes par plage. Se déplacer loin dans un
enregistrement échoue donc, et l'on croit à un défaut du site. Les hébergeurs, eux, les
gèrent. Pour tester les déplacements, utilisez un serveur qui les accepte.

### La partie en cours

Le bloc correspondant à la partie écoutée s'allume d'un filet doré, et l'encart du
chant passe du pointillé sable à l'or plein : pendant les deux minutes de musique,
aucun mot n'est surligné, c'est l'encart qui dit où l'on en est.

Les pilules « Méditation · Chant · Prions… » ont quitté le lecteur lors de sa
simplification. Les horaires du champ `chapitres` servent toujours — ce sont eux qui
disent quel bloc allumer — mais on ne saute plus d'une partie à l'autre d'un bouton.
Pour se déplacer, il reste le curseur de position, et le fait de toucher un mot.

Trois jours — les 3, 6 et 9 — s'ouvrent sur une annonce parlée, « Jour 3. La
fidélité. », avant le signe de croix. Le titre affiché lui sert d'appui et s'allume
pendant ces quelques secondes. Sur les six autres jours il n'a pas d'équivalent sonore
et ne s'allume jamais.

### Ce que le suivi ne fait pas

**Un mot que la transcription n'a pas entendu ne s'allume pas.** Il reçoit un horaire
réparti entre ses deux voisins reconnus, ce qui est juste à un souffle près quand ces
voisins sont proches. Quand ils sont loin — un refrain chanté que la machine a
manqué, un passage instrumental — la répartition deviendrait une invention : le jour 2
donnait douze secondes à chaque mot de son refrain final, et le jour 6 jusqu'à trente.
Ils se seraient allumés l'un après l'autre sur la musique, au hasard.

Au-delà de `PAS_MAX`, deux secondes, le mot reçoit donc une durée nulle : il reste
affiché, il n'est simplement jamais suivi. Mieux vaut un texte que l'on lit qu'un
surlignage qui ment.

Le surlignage n'a plus d'interrupteur : il est toujours allumé. C'est lui qui fait
tenir la voix et le texte ensemble, et un réglage de plus à comprendre n'aidait
personne.

Le chant n'est pas affiché sur le site : pendant ces deux minutes aucun mot n'est
allumé, seul l'encart l'indique. Treize mots du jour 1, presque tous de la
ponctuation isolée, n'ont pas d'équivalent sonore : le surlignage passe simplement
par-dessus.

Le texte affiché doit dire ce que la voix dit. Quand les deux s'écartent, c'est
l'enregistrement qui fait foi — à une réserve près : la transcription contient des
fautes, et il ne faut pas les recopier. Elle a écrit « de commencement » pour « au
commencement », et « aimons-nous les âmes et les autres » dans le chant.

## Le lecteur

Un bouton, une barre de position, le temps écoulé et la durée. Rien d'autre.

Il portait aussi les pilules des parties, un réglage de vitesse, un interrupteur
« Suivre le texte » et un chevron pour le replier : huit commandes sur un téléphone,
là où la plupart des gens cherchaient seulement où appuyer pour écouter. Tout cela
est parti, et le surlignage — qui était le seul de ces réglages à servir à quelque
chose — est simplement toujours allumé.

L'invitation à écouter est écrite comme une phrase, pas en petites capitales
espacées : c'est une instruction, et elle doit se lire.

### En bas de l'écran, et il n'en bouge pas

La barre est posée en bas, dès l'arrivée sur un jour, et elle y reste. Deux raisons.

Le bas de l'écran est la zone que le pouce atteint sans changer de prise. Le bouton
« Écouter » était en haut — l'endroit le plus difficile à toucher d'une main sur un
téléphone d'aujourd'hui, et c'est la commande dont tout dépend.

Surtout, elle ne se déplace plus. Elle partait du flux, au-dessus du numéro du jour,
puis décollait au premier pixel de défilement pour aller se coller en haut : elle
changeait de place une fois, toute seule. C'est exactement ce qui déconcerte quelqu'un
qui hésite déjà. Une commande qui ne bouge jamais est une commande de moins à
comprendre.

Toute la mécanique du décollage est partie avec : la zone qui retenait la place,
`majFixe`, `hautZone`, `reposerLecteur`, le rattrapage à la rotation d'écran. Il ne
reste qu'un `position: fixed; bottom: 0`, calé sur la colonne de l'application plutôt
que sur la largeur de la fenêtre.

Une seule chose à tenir : la barre flotte au-dessus du texte, la page doit donc
réserver sa hauteur en bas, sans quoi le dernier bouton du jour finirait dessous. Cette
hauteur varie — la pastille de rappel ajoute une ligne quand elle paraît — elle est
donc mesurée et non devinée : `reserverPlaceBarre()` la pose dans la propriété
`--barre`, que `#view-jour` ajoute à son retrait du bas. Mesuré à 390 px de large :
144 px de barre seule, 202 px avec la pastille.

Le suivi mot à mot garde le mot lu entre 35 % et 60 % de la hauteur visible : il ne
passe donc jamais sous la barre.

La pastille « Revenir au texte lu » prend sa propre ligne **au-dessus** des commandes :
elle renvoie vers le haut, et la barre est en bas. Elle paraît quand le visiteur a fait
défiler lui-même, et reste là tant qu'il a la main.

La phrase « Le texte de la page est la transcription complète de l'enregistrement »
n'est plus affichée. Elle décrit toujours le bouton pour les lecteurs d'écran, par
`aria-describedby` : sur une barre posée en bas, chaque ligne se paie en hauteur, et
celle-ci n'apprenait rien à qui voit la page. La barre est passée de 199 à 144 px.

### À vérifier sur un iPhone

Sur Safari iOS, la barre d'adresse est en bas et apparaît ou disparaît au défilement.
Le retrait du bas de la barre suit `env(safe-area-inset-bottom)`, ce qui est le bon
réflexe, mais **cela n'a pas pu être vérifié sur un vrai appareil** — seulement dans
un Chrome sans fenêtre. À regarder de près à la première occasion : la barre ne doit
ni être recouverte par celle de Safari, ni sautiller quand elle s'escamote.

## L'écran pendant l'écoute

Une prière dure sept à neuf minutes sans qu'on touche l'appareil : l'écran s'éteindrait
au milieu de la méditation. Le site demande donc un verrou d'écran au départ de la
lecture (Screen Wake Lock) et le rend dès l'arrêt. Le navigateur le retire de lui-même
quand l'onglet passe derrière ; il est redemandé au retour si la lecture court toujours.

Ce verrou passe par l'en-tête `Permissions-Policy`, où `screen-wake-lock` est ouvert au
site lui-même — dans `_headers` comme dans `.htaccess`. Un navigateur qui ne le connaît
pas, ou qui le refuse, laisse la lecture se dérouler exactement comme avant.

## Vérifier l'affichage à une autre date

Ajoutez un paramètre à l'adresse pour simuler un jour donné, sans toucher au code :

```
index.html?date=2026-09-20
```

## Ce qui reste à compléter

- Les paroles des chants, si l'on veut qu'elles s'affichent et se surlignent. Ne pas
  les prendre dans la transcription, qui les entend mal.
- Rien du côté des liens : le canal WhatsApp et le compte Instagram sont renseignés en
  tête d'`app.js`, et les deux boutons « Rejoindre le canal WhatsApp » sont en place,
  sur l'accueil et au pied de chaque jour.
- **Le code GoatCounter**, constante `MESURE_GOATCOUNTER` en tête d'`app.js`. Tant
  qu'elle est vide, le site ne compte rien. Voir « Compter les visites » plus bas, et
  trancher la question du consentement avant d'allumer.
- Les horaires et les modalités d'accès de la veillée, à confirmer par le diocèse.
  Ils sont actuellement marqués comme tels dans l'écran Consécration.

## Compter les visites

Le site peut compter ses visiteurs, et il ne le fait pas par défaut.

Tout tient à une constante en tête d'`app.js` :

```js
var MESURE_GOATCOUNTER = '';   // vide : rien n'est chargé, rien ne part
```

Y écrire le code du compte — `neuvaine` si le tableau de bord est à
`neuvaine.goatcounter.com` — allume la mesure. La laisser vide l'éteint complètement :
pas de script, pas de requête, rien.

### Pourquoi GoatCounter

Gratuit pour un site de cette taille, trois kilo-octets de script, pas de cookie.
Sa documentation indique qu'il ne conserve ni adresse IP ni User-Agent et n'en tire
que des agrégats — « quarante personnes ont utilisé Firefox aujourd'hui », jamais le
parcours d'une personne. Elle estime qu'une bannière de consentement n'est
probablement pas nécessaire, tout en précisant que ses auteurs ne sont pas juristes.
**À vérifier avant d'allumer**, la question n'étant pas tranchée ici.

### Ce qu'il a fallu ouvrir

La politique de sécurité interdisait tout. Trois directives s'élargissent, au strict
nécessaire :

| Directive | Ce qui s'ouvre | Pourquoi |
| --- | --- | --- |
| `script-src` | `https://gc.zgo.at` | le script de comptage |
| `connect-src` | `https://*.goatcounter.com` | l'envoi des vues |
| `img-src` | `https://*.goatcounter.com` | le repli en pixel, quand la balise échoue |

Ces ouvertures existent même quand la constante est vide : la politique *autorise*,
elle n'appelle rien. Aucune requête ne part tant que le code n'est pas renseigné.

### Les ancres, et pourquoi il faut compter à la main

Les neuf jours partagent une seule adresse et ne se distinguent que par leur ancre.
Une mesure ordinaire n'y verrait qu'une page, visitée beaucoup. Le comptage
automatique est donc coupé — `no_onload` — et chaque changement d'écran est compté
par `compter()`, sous un nom lisible : `/jour-3` plutôt que `/#rbw4ehjj`, qui ne
dirait rien dans un tableau. Le titre du jour accompagne la ligne.

Si le script n'arrive jamais — bloqueur de publicité, réseau coupé — rien n'est
compté et la page ne s'en aperçoit pas.

### Où lire les chiffres

À `MONCODE.goatcounter.com`, derrière le mot de passe du compte. Pas sur ce site :
**un site statique ne peut rien garder secret.** Toute clé posée dans ses pages
serait lisible par n'importe qui, et une page à adresse discrète n'est qu'une
courtoisie — la même que celle des codes des jours. Le compte du service est la
seule serrure réelle.

`index.html#stats` est la page des organisateurs : elle ne porte aucun chiffre, elle
dit où les lire et à quoi correspond chaque ligne du tableau. Comme `#envoyer`, elle
n'est listée nulle part.

Les chiffres commencent le jour où la mesure est allumée. Il n'y a rien pour le
passé, et GitHub Pages ne donne pas de journaux serveur.

## Une note sur la feuille de style

`.btn-outline` y est défini deux fois, à deux endroits éloignés. La seconde
définition l'emporte et réécrit la bordure, la couleur, les marges et le corps. Ce
n'est pas voulu, mais le corriger changerait l'aspect des boutons déjà en place : en
attendant, toute variante de `.btn-outline` doit être posée **après** la seconde, sans
quoi elle est silencieusement annulée. C'est le cas de `.btn-outline--clair`.

## Sécurité

Le site n'a ni serveur, ni base de données, ni formulaire, ni compte. La surface
d'attaque est donc très réduite, mais quelques points ont été traités.

**Par défaut, aucune requête ne part vers un tiers.** Les polices étaient chargées
depuis Google, ce qui transmettait l'adresse IP de chaque visiteur. Elles sont
désormais servies depuis le site. Il n'y a ni traceur, ni cookie, ni stockage
navigateur.

**Une seule exception, et elle est éteinte tant qu'on ne l'allume pas :** la mesure
de fréquentation, décrite plus bas. Tant que `MESURE_GOATCOUNTER` est vide, aucun
script tiers n'est chargé et rien ne sort du site — l'état ci-dessus tient mot pour
mot. Dès qu'elle est renseignée, deux domaines sont contactés et la phrase n'est plus
vraie : il faut alors relire ce paragraphe avant de le citer.

**Le script n'écrit jamais de balisage.** Tous les textes sont posés avec
`textContent`. Il n'y a aucun `innerHTML`, aucun gestionnaire d'événement en ligne,
aucun `eval`.

**Les deux entrées du visiteur sont contrôlées.** Le paramètre `?date=` ne sert qu'à
construire une date, rejetée si elle est invalide. L'ancre est comparée à une liste
figée de codes : tout ce qui n'y figure pas ramène à l'accueil. Ni l'une ni l'autre ne
touche au document.

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
