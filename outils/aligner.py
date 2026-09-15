# -*- coding: utf-8 -*-
"""Aligne la transcription horodatée d'un jour sur le texte affiché par le site.

    python outils/aligner.py 1
    python outils/aligner.py tout

Entrée  : assets/transcriptions/jour-N.json  (sections + mots horodatés)
          assets/js/contenu.js               (le texte affiché, jamais modifié ici)
          index.html                         (les prières communes à tous les jours)

Sortie  : assets/audio/jour-N.sync.json      (une plage horaire par mot affiché)
          outils/rapport-jour-N.txt          (ce qui s'est bien ou mal apparié)
          assets/js/contenu.js               (seuls les champs audio, sync, chapitres)

Le principe : on reconstitue la suite exacte des mots que la page affiche, dans
l'ordre du DOM, puis on la confronte à la suite des mots réellement prononcés.
Les deux suites sont normalisées — minuscules, sans accents, sans ponctuation —
mais uniquement pour la comparaison : le texte affiché n'est jamais touché.

Bibliothèque standard seulement.
"""
import difflib
import io
import json
import os
import re
import sys
import unicodedata
from html.parser import HTMLParser

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENU = os.path.join(RACINE, 'assets', 'js', 'contenu.js')
INDEX = os.path.join(RACINE, 'index.html')
TRANSCRIPTIONS = os.path.join(RACINE, 'assets', 'transcriptions')
AUDIO = os.path.join(RACINE, 'assets', 'audio')
OUTILS = os.path.join(RACINE, 'outils')

# Sous ce taux, la lectrice a lu autre chose que le texte du site.
SEUIL = 0.85

# Quelle section de l'enregistrement correspond à quelles zones de la page.
# Le chant et l'envoi ne sont pas affichés : ils ne servent que de chapitres.
CORRESPONDANCE = [
    ('signe-de-croix', ['signe']),
    ('meditation',     ['verset', 'source', 'meditation']),
    ('chant',          []),
    ('prions',         ['intention', 'priere']),
    ('prieres',        ['notre-pere', 'ave', 'gloire', 'acclamation']),
    ('envoi',          ['envoi']),
]

# Zones entendues mais que l'on ne surligne pas : la référence d'un texte est
# annoncée par la lectrice, sans que la page la fasse défiler.
ZONES_MUETTES = ['source']


# ==========================================================================
# 1. Lire contenu.js — au caractère, pas à l'expression régulière
#
# Le fichier n'est pas du JSON : clés non quotées, chaînes en apostrophes
# recollées par +, commentaires, virgules finales, et des crochets « [...] »
# à l'intérieur même des textes cités. On le lit donc caractère par caractère.
# ==========================================================================
GUILLEMETS = "'\""


def lire_contenu(chemin=CONTENU):
    """Renvoie {numéro de jour: {champ: texte ou [textes]}}."""
    src = io.open(chemin, encoding='utf-8').read()
    i = src.index('window.NEUVAINE_CONTENU')
    racine, _ = _objet(src, src.index('{', i))
    return dict((int(k), v) for k, v in racine.items() if k.isdigit())


def _sauter(src, i):
    """Avance sur les blancs et les commentaires."""
    while i < len(src):
        c = src[i]
        if c in ' \t\r\n':
            i += 1
        elif src.startswith('//', i):
            j = src.find('\n', i)
            i = len(src) if j < 0 else j
        elif src.startswith('/*', i):
            j = src.find('*/', i + 2)
            i = len(src) if j < 0 else j + 2
        else:
            return i
    return i


def _chaine(src, i):
    """Lit une chaîne, puis recolle les « + 'suite' » qui la prolongent."""
    morceaux = []
    while True:
        i = _sauter(src, i)
        if i >= len(src) or src[i] not in GUILLEMETS:
            break
        fin = src[i]
        i += 1
        buf = []
        while src[i] != fin:
            if src[i] == '\\':
                buf.append({'n': '\n', 't': '\t', 'r': '\r'}.get(src[i + 1], src[i + 1]))
                i += 2
            else:
                buf.append(src[i])
                i += 1
        morceaux.append(''.join(buf))
        i += 1
        j = _sauter(src, i)
        if j < len(src) and src[j] == '+':
            i = j + 1
            continue
        break
    return ''.join(morceaux), i


def _valeur(src, i):
    i = _sauter(src, i)
    c = src[i]
    if c in GUILLEMETS:
        return _chaine(src, i)
    if c == '[':
        return _tableau(src, i)
    if c == '{':
        return _objet(src, i)
    j = i
    while src[j] not in ',}]':
        j += 1
    return src[i:j].strip(), j


def _tableau(src, i):
    items = []
    i += 1
    while True:
        i = _sauter(src, i)
        if src[i] == ']':
            return items, i + 1
        if src[i] == ',':
            i += 1
            continue
        v, i = _valeur(src, i)
        items.append(v)


def _objet(src, i):
    obj = {}
    i += 1
    while True:
        i = _sauter(src, i)
        if src[i] == '}':
            return obj, i + 1
        if src[i] == ',':
            i += 1
            continue
        if src[i] in GUILLEMETS:
            cle, i = _chaine(src, i)
        else:
            j = i
            while src[j] not in ': \t\r\n':
                j += 1
            cle, i = src[i:j], j
        i = _sauter(src, i) + 1          # le deux-points
        obj[cle], i = _valeur(src, i)


# ==========================================================================
# 2. Lire les prières communes dans index.html
#
# Le signe de croix, le Notre Père, le Je vous salue Marie, le Gloire au Père
# et l'acclamation sont les mêmes tous les jours : ils vivent dans la page,
# pas dans contenu.js. On les relit ici pour qu'une correction du texte se
# répercute sans avoir à toucher à ce script.
# ==========================================================================
class _Prieres(HTMLParser):
    """Récupère le signe de croix et les quatre prières d'ancrage."""

    def __init__(self):
        HTMLParser.__init__(self)
        self.signe = ''
        self.envoi = ''
        self.ancrage = []
        self._dans_liste = 0
        self._dans_acclamation = 0
        self._capture = None
        self._profondeur = 0

    # Une balise vide ne se referme jamais : la compter dans la profondeur
    # décalerait le compteur et ferait déborder la capture sur la suite.
    VIDES = ('br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'wbr')

    def handle_starttag(self, tag, attrs):
        classes = dict(attrs).get('class', '').split()
        if (self._dans_liste or self._dans_acclamation) and tag not in self.VIDES:
            self._profondeur += 1
        if tag == 'br' and self._capture == 'ancrage':
            self._morceaux.append(' ')
        if tag == 'p' and 'signe' in classes:
            self._capture = 'signe'
        elif tag == 'div' and 'anchors__list' in classes:
            self._dans_liste, self._profondeur = 1, 1
        elif tag == 'div' and 'anchors__acclaim' in classes:
            self._dans_acclamation, self._profondeur = 1, 1
        elif tag == 'p' and 'envoi' in classes:
            self._capture = 'envoi'
        elif tag == 'p' and (self._dans_liste or self._dans_acclamation):
            self._capture = 'ancrage'
            self._morceaux = []

    def handle_endtag(self, tag):
        if self._capture == 'ancrage' and tag == 'p':
            self.ancrage.append(' '.join(' '.join(self._morceaux).split()))
            self._capture = None
        elif self._capture in ('signe', 'envoi') and tag == 'p':
            self._capture = None
        if self._dans_liste or self._dans_acclamation:
            self._profondeur -= 1
            if self._profondeur <= 0:
                self._dans_liste = self._dans_acclamation = 0

    def handle_startendtag(self, tag, attrs):
        # Un <br> sépare deux lignes : il vaut une espace.
        if self._capture == 'ancrage':
            self._morceaux.append(' ')

    def handle_data(self, donnee):
        if self._capture == 'signe':
            self.signe += donnee
        elif self._capture == 'envoi':
            self.envoi += donnee
        elif self._capture == 'ancrage':
            self._morceaux.append(donnee)


def lire_prieres(chemin=INDEX):
    """Renvoie {signe, notre-pere, ave, gloire, acclamation}."""
    p = _Prieres()
    p.feed(io.open(chemin, encoding='utf-8').read())
    if len(p.ancrage) < 4:
        raise SystemExit("index.html : %d prière(s) d'ancrage trouvée(s) sur 4 "
                         "attendues. La structure a changé." % len(p.ancrage))
    return {
        'signe': ' '.join(p.signe.split()),
        'notre-pere': p.ancrage[0],
        'ave': p.ancrage[1],
        'gloire': p.ancrage[2],
        'acclamation': p.ancrage[3],
        'envoi': ' '.join(p.envoi.split()),
    }


# ==========================================================================
# 3. Normalisation — pour la comparaison seulement
# ==========================================================================
UNITES = ['zero', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept',
          'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze',
          'quinze', 'seize']
DIZAINES = {2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante'}

ROMAINS = {'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7,
           'viii': 8, 'ix': 9, 'x': 10, 'xi': 11, 'xii': 12, 'xiii': 13,
           'xiv': 14, 'xv': 15, 'xvi': 16, 'xvii': 17, 'xviii': 18}

# Les références bibliques sont écrites en abrégé et lues en toutes lettres.
ABREVIATIONS = {
    'jn': 'jean', 'mt': 'matthieu', 'mc': 'marc', 'lc': 'luc', 'ac': 'actes',
    'rm': 'romains', 'ps': 'psaume', 'he': 'hebreux', 'ap': 'apocalypse',
    'ga': 'galates', 'ep': 'ephesiens', 'ph': 'philippiens', 'col': 'colossiens',
    'jc': 'jacques', 'co': 'corinthiens', 'th': 'thessaloniciens',
    'tm': 'timothee', 'gn': 'genese', 'ex': 'exode', 'is': 'isaie',
    'jr': 'jeremie', 'ez': 'ezechiel', 'os': 'osee', 'pr': 'proverbes',
    'qo': 'qohelet', 'ct': 'cantique', 'sg': 'sagesse', 'si': 'siracide',
}


def en_lettres(n):
    """Un entier de 0 à 999, en mots séparés."""
    if n < 17:
        return [UNITES[n]]
    if n < 20:
        return ['dix', UNITES[n - 10]]
    if n < 70:
        d, u = divmod(n, 10)
        mots = [DIZAINES[d]]
        if u == 1:
            mots += ['et', 'un']
        elif u:
            mots += [UNITES[u]]
        return mots
    if n < 80:
        return ['soixante'] + en_lettres(n - 60)
    if n < 100:
        mots = ['quatre', 'vingt']
        return mots if n == 80 else mots + en_lettres(n - 80)
    c, r = divmod(n, 100)
    mots = ([] if c == 1 else en_lettres(c)) + ['cent']
    return mots if r == 0 else mots + en_lettres(r)


def jetons(mot):
    """Un mot affiché ou prononcé → la liste de ses jetons comparables.

    « l’homme » donne deux jetons, « XIV » donne « quatorze », « J-9 » donne
    « j moins neuf », « Jn » donne « jean ». Un mot peut donc peser plusieurs
    jetons, ou aucun (une ponctuation isolée)."""
    t = unicodedata.normalize('NFD', mot.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')

    # « J-9 » se lit « J moins 9 » : on rend le tiret audible.
    t = re.sub(r'\bj-(\d)', r'j moins \1', t)

    # L'apostrophe sépare deux mots : « l’amour » → « l », « amour ».
    t = t.replace('’', ' ').replace("'", ' ')

    sortie = []
    for brut in re.split(r'[^a-z0-9]+', t):
        if not brut:
            continue
        if brut.isdigit() and len(brut) <= 3:
            sortie.extend(en_lettres(int(brut)))
        elif brut in ROMAINS:
            sortie.extend(en_lettres(ROMAINS[brut]))
        elif brut in ABREVIATIONS:
            sortie.append(ABREVIATIONS[brut])
        else:
            sortie.append(brut)
    return sortie


# ==========================================================================
# 4. La suite exacte des mots affichés, dans l'ordre du DOM
# ==========================================================================
def sequence_affichee(jour, prieres):
    """Liste d'entrées {mot, zone, indice, passage}, dans l'ordre de la page.

    « indice » est le rang du mot à l'écran. Le Je vous salue Marie est affiché
    une fois mais dit trois fois : ses mots reviennent trois fois dans la suite,
    avec le même indice et un numéro de passage différent."""
    zones = [
        ('signe', prieres['signe'], 1),
        ('verset', _plat(jour.get('verset')), 1),
        ('source', jour.get('source', ''), 1),
        ('meditation', _plat(jour.get('meditation')), 1),
        ('intention', jour.get('intention', ''), 1),
        ('priere', _plat(jour.get('priere')), 1),
        ('notre-pere', prieres['notre-pere'], 1),
        ('ave', prieres['ave'], 3),
        ('gloire', prieres['gloire'], 1),
        ('acclamation', prieres['acclamation'], 1),
        ('envoi', prieres['envoi'], 1),
    ]

    suite = []
    indice = 0
    for nom, texte, passages in zones:
        mots = (texte or '').split()
        if not mots:
            continue
        premier = indice
        for passage in range(passages):
            for k, mot in enumerate(mots):
                suite.append({'mot': mot, 'zone': nom,
                              'indice': premier + k, 'passage': passage})
        indice = premier + len(mots)
    return suite, indice


def _plat(valeur):
    """Un champ est soit une chaîne, soit une liste de paragraphes."""
    if isinstance(valeur, list):
        return ' '.join(valeur)
    return valeur or ''


# ==========================================================================
# 5. L'alignement proprement dit
# ==========================================================================
def aligner_section(entrees, mots_lus):
    """Apparie les mots affichés d'une section aux mots prononcés.

    Renvoie (plages, apparies, total) où plages[i] vaut (debut, fin) ou None
    pour l'entrée i de la section."""
    # Chaque mot pèse un ou plusieurs jetons : on garde le lien vers son rang.
    jetons_affiches, origine_affichee = [], []
    for rang, e in enumerate(entrees):
        for j in jetons(e['mot']):
            jetons_affiches.append(j)
            origine_affichee.append(rang)

    jetons_lus, horaires = [], []
    for m in mots_lus:
        for j in jetons(m['mot']):
            jetons_lus.append(j)
            horaires.append((m['debut'], m['fin']))

    plages = [None] * len(entrees)
    if not jetons_affiches or not jetons_lus:
        return plages, 0, len(entrees)

    sm = difflib.SequenceMatcher(None, jetons_affiches, jetons_lus, autojunk=False)
    for a, b, taille in sm.get_matching_blocks():
        for k in range(taille):
            rang = origine_affichee[a + k]
            debut, fin = horaires[b + k]
            if plages[rang] is None:
                plages[rang] = [debut, fin]
            else:
                plages[rang][0] = min(plages[rang][0], debut)
                plages[rang][1] = max(plages[rang][1], fin)

    apparies = sum(1 for p in plages if p is not None)
    return plages, apparies, len(entrees)


def interpoler(plages, entrees):
    """Donne un horaire aux mots restés sans appui.

    Un mot affiché mais non reconnu reçoit un horaire réparti entre ses deux
    voisins appariés. Un mot d'une zone jamais lue — une référence annoncée
    autrement — reçoit l'horaire du mot précédent et une durée nulle : il ne
    sera donc jamais surligné."""
    connus = [i for i, p in enumerate(plages) if p is not None]
    if not connus:
        return [0, 0]

    interpoles = []
    for i, p in enumerate(plages):
        if p is not None:
            continue
        avant = [k for k in connus if k < i]
        apres = [k for k in connus if k > i]

        if avant and apres:
            g, d = avant[-1], apres[0]
            t0, t1 = plages[g][1], plages[d][0]
            part = (i - g) / float(d - g)
            pas = (t1 - t0) / float(d - g)
            plages[i] = [t0 + part * (t1 - t0), t0 + part * (t1 - t0) + pas]
        elif avant:
            t = plages[avant[-1]][1]
            plages[i] = [t, t]
        else:
            t = plages[apres[0]][0]
            plages[i] = [t, t]

        if entrees[i]['zone'] in ZONES_MUETTES:
            plages[i][1] = plages[i][0]
        interpoles.append(i)
    return interpoles


# ==========================================================================
# 6. Un jour, de bout en bout
# ==========================================================================
def traiter(n, contenu, prieres, bavard=True):
    source = os.path.join(TRANSCRIPTIONS, 'jour-%d.json' % n)
    if not os.path.exists(source):
        if bavard:
            print("jour %d : pas de transcription, rien à faire." % n)
        return None
    if n not in contenu:
        raise SystemExit("jour %d : absent de contenu.js." % n)

    transcription = json.load(io.open(source, encoding='utf-8'))
    sections = dict((s['id'], s) for s in transcription['sections'])
    suite, nb_affiches = sequence_affichee(contenu[n], prieres)

    plages = [None] * len(suite)
    detail = []

    for id_section, noms_zones in CORRESPONDANCE:
        if id_section not in sections:
            continue
        rangs = [i for i, e in enumerate(suite) if e['zone'] in noms_zones]
        if not rangs:
            detail.append((id_section, 0, 0, sections[id_section]['debut']))
            continue
        entrees = [suite[i] for i in rangs]
        p, apparies, total = aligner_section(entrees, sections[id_section]['mots'])
        for rang, valeur in zip(rangs, p):
            plages[rang] = valeur
        detail.append((id_section, apparies, total, sections[id_section]['debut']))

    interpoles = interpoler(plages, suite)

    # Un mot affiché porte autant de plages qu'il a été prononcé de fois.
    par_indice = {}
    for entree, plage in zip(suite, plages):
        par_indice.setdefault(entree['indice'], []).append(plage)

    # Une durée nulle signale au site un mot qu'il ne faut jamais surligner :
    # la référence d'un texte, que la lectrice annonce autrement. Un mot bel
    # et bien apparié ne doit pas se confondre avec eux — or la transcription
    # mesure parfois une durée nulle, sur un « Je » lancé et terminé dans le
    # même centième. On lui rend de la place, après lui si le mot suivant
    # laisse un intervalle, avant lui sinon, et jamais sur le mot précédent.
    muets = set(e['indice'] for e in suite if e['zone'] in ZONES_MUETTES)

    plat = []
    for indice in sorted(par_indice):
        for rang, p in enumerate(par_indice[indice]):
            plat.append([indice, rang, round(p[0], 2), round(p[1], 2)])
    plat.sort(key=lambda x: (x[2], x[0]))

    for k, entree in enumerate(plat):
        indice, _, debut, fin = entree
        if indice in muets or fin > debut:
            continue
        suivant = plat[k + 1][2] if k + 1 < len(plat) else debut + 0.05
        if suivant > debut:
            entree[3] = round(min(suivant, debut + 0.05), 2)
        else:
            precedent = plat[k - 1][3] if k > 0 else 0.0
            entree[2] = round(max(precedent, debut - 0.05), 2)
            entree[3] = debut

    refaits = {}
    for indice, rang, debut, fin in plat:
        refaits.setdefault(indice, {})[rang] = [debut, fin]

    mots = []
    for i in range(nb_affiches):
        d = refaits.get(i)
        p = [d[r] for r in sorted(d)] if d else [[0, 0]]
        mots.append(p[0] if len(p) == 1 else p)

    chapitres = dict((s['id'], round(s['debut'], 2))
                     for s in transcription['sections'] if s['id'] != 'signe-de-croix')

    sortie = {'version': 1, 'jour': n, 'decalage': 0,
              'mots': mots, 'sections': chapitres}

    cible = os.path.join(AUDIO, 'jour-%d.sync.json' % n)
    io.open(cible, 'w', encoding='utf-8').write(
        json.dumps(sortie, ensure_ascii=False, separators=(',', ':')))

    rapport = ecrire_rapport(n, suite, plages, interpoles, detail, nb_affiches)
    if bavard:
        print(rapport)
    return {'jour': n, 'mots': nb_affiches, 'detail': detail,
            'interpoles': len(interpoles), 'chapitres': chapitres,
            'taux': 1.0 - len(interpoles) / float(max(1, len(suite)))}


def ecrire_rapport(n, suite, plages, interpoles, detail, nb_affiches):
    lignes = []
    ajoute = lignes.append

    total = len(suite)
    taux = 1.0 - len(interpoles) / float(max(1, total))
    ajoute("Jour %d — alignement de la transcription sur le texte affiché" % n)
    ajoute("=" * 74)
    ajoute("")
    ajoute("  mots affichés      : %d (%d passages, le Je vous salue Marie "
           "étant dit trois fois)" % (nb_affiches, total))
    ajoute("  appariés           : %d" % (total - len(interpoles)))
    ajoute("  interpolés         : %d" % len(interpoles))
    ajoute("  taux d'appariement : %.1f %%%s"
           % (100 * taux, "" if taux >= SEUIL else "   ATTENTION : sous le seuil de 85 %"))
    ajoute("")
    ajoute("  Section          appariés / affichés        début")
    for id_section, apparies, tot, debut in detail:
        part = ('%5.1f %%' % (100.0 * apparies / tot)) if tot else '     —'
        ajoute("    %-14s %4d / %4d   %s        %6.2f s"
               % (id_section, apparies, tot, part, debut))
    ajoute("")

    # Les plus longues suites de mots sans appui : c'est là qu'un décalage
    # s'entend, et c'est donc là qu'il faut écouter.
    suites = []
    for i in interpoles:
        if suites and suites[-1][1] == i - 1:
            suites[-1][1] = i
        else:
            suites.append([i, i])
    suites.sort(key=lambda s: s[0] - s[1])

    ajoute("  Les %d plus longues suites de mots interpolés" % min(20, len(suites)))
    if not suites:
        ajoute("    aucune : tous les mots ont été reconnus.")
    for debut, fin in suites[:20]:
        texte = ' '.join(e['mot'] for e in suite[debut:fin + 1])
        ajoute("    %3d mot(s)  [%-11s %6.2f s]  %s"
               % (fin - debut + 1, suite[debut]['zone'], plages[debut][0],
                  texte[:96] + ('…' if len(texte) > 96 else '')))
    ajoute("")

    # Un saut long entre deux mots affichés successifs veut dire que la page
    # va rester immobile un moment : c'est normal pendant un chant, suspect
    # au milieu d'un paragraphe.
    ajoute("  Sauts de plus de 8 s entre deux mots affichés consécutifs")
    sauts = 0
    for i in range(len(plages) - 1):
        ecart = plages[i + 1][0] - plages[i][1]
        if ecart > 8:
            sauts += 1
            ajoute("    %6.2f s  après « %s » (%s) → « %s » (%s)"
                   % (ecart, suite[i]['mot'], suite[i]['zone'],
                      suite[i + 1]['mot'], suite[i + 1]['zone']))
    if not sauts:
        ajoute("    aucun.")

    texte = '\n'.join(lignes) + '\n'
    io.open(os.path.join(OUTILS, 'rapport-jour-%d.txt' % n), 'w',
            encoding='utf-8').write(texte)
    return texte


# ==========================================================================
# 7. Mise à jour de contenu.js — seulement audio, sync et chapitres
# ==========================================================================
def majuscule_contenu(resultats):
    """Récrit les trois champs techniques de chaque jour traité.

    Les textes ne sont jamais touchés : on repère le bloc du jour, on enlève
    les anciennes lignes audio / sync / chapitres, et on écrit les nouvelles
    juste avant l'accolade fermante."""
    src = io.open(CONTENU, encoding='utf-8').read()

    for r in sorted(resultats, key=lambda x: -x['jour']):
        n = r['jour']
        debut = src.index('\n  %d: {' % n) + 1

        # Position de l'accolade qui ferme le jour : on écrit juste avant elle.
        fin = _fin_objet(src, src.index('{', debut)) - 1

        lignes = src[debut:fin].split('\n')

        # La dernière ligne ne porte que l'indentation du « } » : on la met
        # de côté pour la remettre telle quelle à la fin.
        fermeture = lignes.pop() if not lignes[-1].strip() else ''

        lignes = [l for l in lignes
                  if not re.match(r"\s*(audio|sync|chapitres)\s*:", l)]

        # La dernière ligne utile ne doit plus porter de virgule finale :
        # on la remet nous-mêmes avant d'ajouter nos champs.
        while lignes and not lignes[-1].strip():
            lignes.pop()
        if lignes:
            lignes[-1] = lignes[-1].rstrip()
            if not lignes[-1].endswith((',', '{', '[')):
                lignes[-1] += ','

        chapitres = ', '.join("%s: %s" % (_cle_js(k), v)
                              for k, v in sorted(r['chapitres'].items(),
                                                 key=lambda kv: kv[1]))
        lignes.append("    audio: 'assets/audio/jour-%d.mp3?v=2'," % n)
        lignes.append("    sync: 'assets/audio/jour-%d.sync.json'," % n)
        lignes.append("    chapitres: { %s }" % chapitres)
        lignes.append(fermeture)

        src = src[:debut] + '\n'.join(lignes) + src[fin:]

    io.open(CONTENU, 'w', encoding='utf-8').write(src)


def _cle_js(nom):
    """Une clé qui n'est pas un identifiant simple doit être quotée."""
    return nom if re.match(r'^[A-Za-z_$][A-Za-z0-9_$]*$', nom) else "'%s'" % nom


def _fin_objet(src, i):
    """Position juste après l'accolade qui ferme l'objet ouvert en i.

    On compte les accolades en ignorant celles qui se trouvent dans une
    chaîne ou dans un commentaire."""
    profondeur = 0
    while i < len(src):
        c = src[i]
        if c in GUILLEMETS:
            _, i = _chaine(src, i)
            continue
        if src.startswith('//', i) or src.startswith('/*', i):
            i = _sauter(src, i)
            continue
        if c == '{':
            profondeur += 1
        elif c == '}':
            profondeur -= 1
            if profondeur == 0:
                return i + 1
        i += 1
    raise SystemExit('contenu.js : accolade non refermée.')


# ==========================================================================
def main(argv):
    # La console Windows est en cp1252 : sans cela, une flèche suffit à tout
    # faire échouer alors que les fichiers écrits, eux, sont corrects.
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')

    if len(argv) != 2:
        raise SystemExit("usage : python outils/aligner.py <numéro de jour | tout>")

    contenu = lire_contenu()
    prieres = lire_prieres()

    if argv[1] == 'tout':
        jours = sorted(contenu)
    else:
        jours = [int(argv[1])]

    resultats = []
    for n in jours:
        r = traiter(n, contenu, prieres, bavard=(argv[1] != 'tout'))
        if r:
            resultats.append(r)

    if not resultats:
        print("Aucune transcription à traiter.")
        return 0

    majuscule_contenu(resultats)

    if argv[1] == 'tout':
        print("Jour   mots   appariés   sections trouvées")
        for r in resultats:
            trouvees = [s for s, a, t, d in r['detail'] if t and a]
            print("  %d   %5d    %5.1f %%   %s"
                  % (r['jour'], r['mots'], 100 * r['taux'], ', '.join(trouvees)))

    faibles = [r['jour'] for r in resultats if r['taux'] < SEUIL]
    if faibles:
        print("")
        print("ATTENTION — jour(s) %s sous %.0f %% d'appariement."
              % (', '.join(map(str, faibles)), 100 * SEUIL))
        print("La lectrice a probablement lu un autre texte que celui du site.")
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
