/* ==========================================================================
   Neuvaine au Sacré-Cœur — logique de l'application
   Trois écrans : accueil, jour, consécration. Aucune dépendance.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Repères de la neuvaine
     Le premier jour est le 16 septembre 2026 (J-9 avant la veillée du 25).
     Les mois sont indexés à partir de zéro : 8 = septembre.
     ------------------------------------------------------------------ */
  var START = new Date(2026, 8, 16);
  var TOTAL_DAYS = 9;
  var DAY_MS = 86400000;

  /* Le code d'adresse de chaque jour. Le lien porte ce code et non le
     numéro du jour : on ne passe donc pas au suivant en modifiant
     l'adresse, et l'on n'ouvre que le jour qu'on a reçu.

     C'est une barrière de courtoisie, pas une serrure — cette table est
     dans ce fichier, et le texte des neuf jours dans contenu.js, tous deux
     publics. Elle empêche de passer devant, elle ne cache rien.

     À NE PLUS TOUCHER : ces codes sont tirés une fois pour toutes. En
     changer un casse le lien déjà envoyé pour ce jour-là. L'alphabet
     n'a ni i, ni l, ni o, ni 0, ni 1 : un lien se relit sans ambiguïté.
     L'entrée 0 est vide, pour que l'index soit le numéro du jour. */
  var CODES = ['',
    'sc5gtesv',   // jour 1
    'gc2uzt4n',   // jour 2
    'rbw4ehjj',   // jour 3
    'ytsfurbj',   // jour 4
    '3b3v7qrp',   // jour 5
    '4c6g2srf',   // jour 6
    'vg48ywwk',   // jour 7
    'sfknuj6u',   // jour 8
    'y8txwn87'    // jour 9
  ];

  function codeDuJour(n) { return CODES[n] || ''; }

  /** Le numéro du jour derrière un code, ou 0 si le code est inconnu.
   *  La comparaison se fait sur une liste figée : rien de ce que le
   *  visiteur écrit dans l'adresse n'atteint le document. */
  function jourDuCode(code) {
    var i = CODES.indexOf(code);
    return i > 0 ? i : 0;
  }

  /* Les neuf jours sont ouverts, sans attendre leur date. Repasser à false
     rend la parution au matin même, jour après jour. */
  var OUVRIR_TOUT = true;

  /* Adresse du canal WhatsApp. C'est la seule chose à écrire ici pour que
     les deux boutons « Rejoindre le canal WhatsApp » apparaissent — sur
     l'accueil et au pied de chaque jour. Tant qu'elle est vide, le
     cartouche « Comment participer » explique le fonctionnement mais ne
     montre aucun bouton : mieux vaut ne rien proposer qu'un lien qui ne
     mène nulle part.

     L'adresse d'un canal ressemble à https://whatsapp.com/channel/XXXX ;
     celle d'un groupe à https://chat.whatsapp.com/XXXX. */
  var LIEN_WHATSAPP = 'https://whatsapp.com/channel/0029Vaac5Na4inoznqOnWa3A';

  /* Le compte Instagram, tel que la maquette l'annonce. La phrase de repli
     « Vous n'êtes pas sur WhatsApp ? » ne s'affiche que s'il est rempli. */
  var COMPTE_INSTAGRAM = '@groupesperance';

  /* Mesure de fréquentation, par GoatCounter. Ce code est celui du compte :
     « neuvaine » si le tableau de bord est à neuvaine.goatcounter.com.

     Tant qu'il est vide, **rien n'est chargé et aucune requête ne part** :
     le site reste exactement ce qu'il était, sans mesure d'aucune sorte.
     C'est l'état par défaut, et il est volontaire.

     GoatCounter ne pose pas de cookie et ne conserve ni adresse IP ni
     User-Agent : il n'en tire que des agrégats. Le tableau de bord est
     derrière le mot de passe du compte — c'est la seule confidentialité
     réelle possible ici, un site statique ne pouvant rien garder secret. */
  var MESURE_GOATCOUNTER = '';

  /* Adresse publique du site. Elle ne sert que lorsque la page est ouverte
     depuis le disque, où l'adresse du fichier ne vaudrait rien pour
     personne : servie par un hébergeur, c'est sa propre adresse qui est
     reprise, et la page des organisateurs marche donc aussi bien sur un
     essai local que sur le site en ligne. */
  var ADRESSE_PUBLIQUE = 'https://neuvaine-esperance.github.io/';

  /* Jours ouverts avant leur date, par exception. Le 16 septembre est
     accessible dès la mise en ligne, pour que la neuvaine se lise le soir
     où on la partage. Ajouter un numéro ici ouvre le jour correspondant. */
  var OUVERTS_DAVANCE = [1];

  /* ------------------------------------------------------------------
     Contenu des neuf jours

     Le texte vit dans assets/js/contenu.js, chargé juste avant ce fichier.
     On peut le corriger sans jamais ouvrir celui-ci.

     Un jour absent de ce fichier affiche « Ce jour sera disponible le … ».
     ------------------------------------------------------------------ */
  var CONTENT = window.NEUVAINE_CONTENU || {};

  /* ------------------------------------------------------------------
     Outils
     ------------------------------------------------------------------ */
  var MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
                      'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi',
                  'jeudi', 'vendredi', 'samedi'];
  var WEEKDAYS_SHORT = ['dim.', 'lun.', 'mar.', 'mer.',
                        'jeu.', 'ven.', 'sam.'];

  function $(sel) { return document.querySelector(sel); }

  /** Date du jour, ramenée à minuit. Le paramètre ?date=AAAA-MM-JJ
   *  permet de simuler un autre jour pour vérifier l'affichage. */
  function today() {
    var forced = new URLSearchParams(window.location.search).get('date');
    if (forced) {
      var f = new Date(forced);
      if (!isNaN(f.getTime())) {
        return new Date(f.getFullYear(), f.getMonth(), f.getDate());
      }
    }
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function dayDate(n) {
    var d = new Date(START);
    d.setDate(d.getDate() + n - 1);
    return d;
  }

  /** « Mer. 16 sept. », pour les liens de la page des organisateurs. */
  function fmtShort(d) {
    return WEEKDAYS_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' +
           MONTHS_SHORT[d.getMonth()];
  }

  function fmtLong(d) {
    return WEEKDAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  }

  /** « J1 » pour le premier jour, « J9 » pour le neuvième.
   *  C'est une abréviation graphique : elle est masquée aux lecteurs d'écran,
   *  qui reçoivent la version en toutes lettres produite ci-dessous. */
  function countdownLabel(n) { return 'J' + n; }

  /** « Jour 1 sur 9 » : ce que « J1 » dit en toutes lettres.
   *  La date, elle, est annoncée à côté par le fil d'Ariane et les cartes. */
  function countdownSpoken(n) {
    return 'Jour ' + n + ' sur ' + TOTAL_DAYS;
  }

  /** Numéro du jour en cours, borné entre 1 et 9. */
  function currentDay() {
    var diff = Math.round((today() - START) / DAY_MS);
    return Math.min(TOTAL_DAYS, Math.max(1, diff + 1));
  }

  function isBeforeStart() { return today() < START; }

  /** Un jour s'ouvre le matin même, comme la page d'attente l'annonce.
   *  Il lui faut donc deux choses : son texte, et sa date arrivée.
   *
   *  Pour ouvrir les neuf jours d'un coup, passer OUVRIR_TOUT à true. */
  function isPublished(n) {
    if (!CONTENT[n]) { return false; }
    if (OUVRIR_TOUT) { return true; }
    if (OUVERTS_DAVANCE.indexOf(n) !== -1) { return true; }
    return dayDate(n) <= today();
  }

  /* ------------------------------------------------------------------
     Apparitions au défilement

     Le CSS pose l'état masqué ; ce module ne fait qu'ajouter la classe qui
     déclenche la transition, au moment où l'élément entre dans l'écran.
     ------------------------------------------------------------------ */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var revealObserver = null;
  var played = {};

  function revealNow(root) {
    Array.prototype.forEach.call(
      (root || document).querySelectorAll('.anim'),
      function (el) { el.classList.add('is-in'); }
    );
  }

  function initReveal() {
    if (reduced.matches || !('IntersectionObserver' in window)) {
      revealNow();
      return;
    }

    revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    // Filet de sécurité. Si quoi que ce soit empêchait l'observation, la page
    // ne doit pas rester vide : au bout de quatre secondes, on montre tout.
    window.setTimeout(function () { revealNow(); }, 4000);
  }

  function playReveal(root, key) {
    if (!root) { return; }
    if (!revealObserver) { revealNow(root); return; }

    if (played[key] && key !== 'jour') {
      revealNow(root);
      return;
    }
    played[key] = true;

    var items = root.querySelectorAll('.anim');

    Array.prototype.forEach.call(items, function (el) {
      revealObserver.unobserve(el);
      el.classList.remove('is-in');
    });

    void root.offsetWidth;

    Array.prototype.forEach.call(items, function (el) {
      revealObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     Mesure de fréquentation

     Les adresses du site sont des ancres : sans rien faire, la mesure ne
     verrait qu'une seule page pour les neuf jours. Chaque changement
     d'écran est donc compté à la main, sous un nom lisible — « /jour-3 »
     plutôt que « /#rbw4ehjj », qui ne dirait rien dans un tableau.
     ------------------------------------------------------------------ */
  function initMesure() {
    if (!MESURE_GOATCOUNTER) { return; }

    // Sans cela le script compterait l'arrivée tout seul, sous l'adresse
    // à ancre : c'est nous qui comptons, après avoir nommé l'écran.
    window.goatcounter = { no_onload: true };

    var sc = document.createElement('script');
    sc.async = true;
    sc.src = 'https://gc.zgo.at/count.js';
    sc.setAttribute('data-goatcounter',
      'https://' + MESURE_GOATCOUNTER + '.goatcounter.com/count');
    document.head.appendChild(sc);
  }

  /** Le nom sous lequel un écran est compté. */
  function cheminMesure(view, day) {
    if (view === 'jour') { return '/jour-' + day; }
    if (view === 'accueil') { return '/'; }
    return '/' + view;
  }

  function compter(view, day) {
    // Le script peut ne jamais arriver — bloqueur de publicité, réseau
    // coupé. Tant que sa fonction n'est pas là, on ne compte pas, et la
    // page ne s'en aperçoit pas.
    if (!MESURE_GOATCOUNTER || !window.goatcounter ||
        typeof window.goatcounter.count !== 'function') { return; }
    var c = CONTENT[day];
    try {
      window.goatcounter.count({
        path: cheminMesure(view, day),
        title: view === 'jour' && c ? 'Jour ' + day + ' — ' + c.titre : view
      });
    } catch (e) { /* une mesure qui échoue ne doit rien empêcher */ }
  }

  /* ------------------------------------------------------------------
     Navigation entre les écrans
     ------------------------------------------------------------------ */
  var VIEWS = {
    accueil: $('#view-accueil'),
    jour: $('#view-jour'),
    consecration: $('#view-consecration'),
    envoyer: $('#view-envoyer'),
    stats: $('#view-stats')
  };

  // Titre de chaque écran, sur lequel le focus est posé après un changement.
  var TITLES = {
    accueil: '#accueil-titre',
    jour: '#day-title',
    consecration: '#consec-titre',
    envoyer: '#envoyer-titre',
    stats: '#stats-titre'
  };

  var state = { view: 'accueil', day: 1 };

  /** Le contenu change sans que la page soit rechargée. Poser le focus sur le
   *  titre du nouvel écran fait annoncer ce titre par le lecteur d'écran et
   *  ramène le clavier en haut du contenu, au lieu de le laisser sur un bouton
   *  qui vient de disparaître. */
  function focusTitle(view) {
    var h = $(TITLES[view]);
    if (!h) { return; }
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  }

  function swapView(view) {
    Object.keys(VIEWS).forEach(function (key) {
      VIEWS[key].hidden = (key !== view);
    });
  }

  function show(view, day) {
    state.view = view;
    if (day) { state.day = Math.min(TOTAL_DAYS, Math.max(1, day)); }

    swapView(view);
    stopAudio();
    if (view === 'jour') { renderDay(state.day); }
    if (view === 'envoyer') { renderEnvoyer(); }
    if (view === 'stats') { renderStats(); }

    var hash = view === 'jour' ? '#' + codeDuJour(state.day) : '#' + view;
    if (window.location.hash !== hash) {
      history.pushState({ view: view, day: state.day }, '', hash);
    }

    // Ce retour en haut est le nôtre : sans cette marque, le suivi du texte
    // le prendrait pour un geste du visiteur et se tairait cinq secondes à
    // chaque ouverture d'un jour.
    notreDefilement = Date.now();
    window.scrollTo(0, 0);
    playReveal(VIEWS[view], view);
    focusTitle(view);
    compter(view, state.day);
  }

  function readHash() {
    var h = (window.location.hash || '').replace('#', '');
    if (h === 'consecration') { return { view: 'consecration', day: state.day }; }
    if (h === 'envoyer') { return { view: 'envoyer', day: state.day }; }
    if (h === 'stats') { return { view: 'stats', day: state.day }; }

    // Un code inconnu — ou l'ancien « jour-3 » — ramène à l'accueil.
    var n = jourDuCode(h);
    if (n) { return { view: 'jour', day: n }; }
    return { view: 'accueil', day: state.day };
  }

  /** Appliquée au chargement et au retour arrière du navigateur.
   *  Au tout premier affichage le focus n'est pas déplacé : il doit rester
   *  en haut du document, sur le lien d'évitement. */
  function applyHash(moveFocus) {
    var target = readHash();
    state.day = Math.min(TOTAL_DAYS, Math.max(1, target.day));
    state.view = target.view;

    swapView(state.view);
    stopAudio();
    if (state.view === 'jour') { renderDay(state.day); }
    if (state.view === 'envoyer') { renderEnvoyer(); }
    if (state.view === 'stats') { renderStats(); }

    // Ce retour en haut est le nôtre, comme dans show() : sans la marque, le
    // suivi du texte le prendrait pour un geste du visiteur.
    notreDefilement = Date.now();
    window.scrollTo(0, 0);

    playReveal(VIEWS[state.view], state.view);
    if (moveFocus) { focusTitle(state.view); }
    compter(state.view, state.day);
  }

  /* ------------------------------------------------------------------
     Accueil : la ligne du jour en cours

     La maquette ne garde qu'une ligne pour dire où en est la neuvaine :
     « Aujourd’hui : jour 3 / 9 — La fidélité, lu par Romain ». C'est
     aussi, depuis que la grille des neuf jours a quitté l'accueil, la
     seule porte vers un jour depuis l'accueil : la ligne est donc un
     bouton, et elle ne mène qu'au jour du jour — les huit autres restent
     derrière leur lien.

     Le libellé énoncé dit où elle mène, ce que « jour 3 / 9 » ne dirait
     pas à voix haute.
     ------------------------------------------------------------------ */
  function renderHome() {
    var bouton = $('#hero-today');
    var n = isBeforeStart() ? 1 : currentDay();
    var c = isPublished(n) ? CONTENT[n] : null;
    var ligne;

    if (c) {
      ligne = (isBeforeStart() ? 'Dès maintenant' : 'Aujourd’hui') +
              ' : jour ' + n + ' / ' + TOTAL_DAYS + ' — ' + c.titre;
    } else if (isBeforeStart()) {
      ligne = 'La neuvaine s’ouvre le ' + fmtLong(START) + '.';
    } else {
      ligne = 'Aujourd’hui : jour ' + n + ' / ' + TOTAL_DAYS + '.';
    }

    bouton.textContent = ligne;
    bouton.setAttribute('aria-label',
      'Prier, ouvrir le ' + countdownSpoken(n).toLowerCase() +
      (c ? ' : ' + c.titre : ''));
  }

  /* ------------------------------------------------------------------
     Envoyer le jour — la page des organisateurs

     Elle rassemble les neuf liens, celui du jour en avant avec son message
     tout prêt. Rien n'y est secret : ce sont les mêmes adresses publiques
     que tout le monde reçoit. Elle n'est simplement listée nulle part.
     ------------------------------------------------------------------ */

  /** L'adresse à envoyer pour un jour.
   *
   *  On repart de l'adresse où la page est servie, pour que les liens
   *  copiés soient justes quel que soit l'hébergeur. « index.html » en fin
   *  d'adresse n'apporte rien et s'enlève : tous les serveurs le servent
   *  par défaut, et le lien est plus court à lire.
   *
   *  Ouverte depuis le disque, l'adresse du fichier ne servirait à
   *  personne : c'est alors l'adresse publique qui est reprise. */
  function adresseDuJour(n) {
    var base = window.location.protocol === 'file:'
      ? ADRESSE_PUBLIQUE
      : window.location.origin + window.location.pathname;
    return base.replace(/index\.html$/, '') + '#' + codeDuJour(n);
  }

  /** Le message tel qu'il part sur WhatsApp. Les astérisques et les traits
   *  de soulignement y sont la mise en gras et en italique de WhatsApp. */
  function messageDuJour(n) {
    var c = CONTENT[n];
    return '*Neuvaine au Sacré-Cœur — Jour ' + n + ' / ' + TOTAL_DAYS + '*\n' +
      (c ? '_' + c.titre + '_\n' : '') +
      'Dix minutes de prière, à écouter ou à lire.\n' +
      adresseDuJour(n);
  }

  /** Copie un texte, et le dit. Le bouton lui-même confirme pendant deux
   *  secondes et demie : c'est la réponse la plus lisible, juste sous le
   *  doigt qui vient d'appuyer.
   *
   *  Si le presse-papiers est refusé — il l'est hors connexion sécurisée —
   *  on le dit sans détour et l'on renvoie au texte, qui reste affiché en
   *  clair et sélectionnable à la main. */
  function copier(texte, bouton, quoi) {
    function confirme() {
      if (bouton) {
        var avant = bouton.getAttribute('data-libelle') || bouton.textContent;
        bouton.setAttribute('data-libelle', avant);
        bouton.textContent = 'Copié ✓';
        bouton.classList.add('a-copie');
        window.setTimeout(function () {
          bouton.textContent = avant;
          bouton.classList.remove('a-copie');
        }, 2500);
      }
      $('#envoi-etat').textContent = quoi + ' copié. Collez-le dans WhatsApp.';
    }

    function echoue() {
      $('#envoi-etat').textContent = 'La copie automatique n’a pas fonctionné. ' +
        'Le texte est écrit sur cette page : sélectionnez-le à la main.';
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(confirme, echoue);
    } else {
      echoue();
    }
  }

  function renderEnvoyer() {
    var n = isBeforeStart() ? 1 : currentDay();
    var c = CONTENT[n];

    $('#envoi-date').textContent = (isBeforeStart() ? 'Premier jour · ' : 'Aujourd’hui · ') +
      fmtLong(dayDate(n));
    $('#envoi-n').textContent = countdownLabel(n);
    $('#envoi-carte-titre').textContent = c
      ? 'Jour ' + n + ' — ' + c.titre
      : 'Jour ' + n;
    $('#envoi-message').textContent = messageDuJour(n);
    $('#envoi-whatsapp').href =
      'https://wa.me/?text=' + encodeURIComponent(messageDuJour(n));
    $('#envoi-etat').textContent = '';

    var liste = $('#envoi-liste');
    liste.textContent = '';
    for (var k = 1; k <= TOTAL_DAYS; k++) {
      liste.appendChild(ligneEnvoi(k));
    }
  }

  function ligneEnvoi(n) {
    var c = CONTENT[n];
    var li = document.createElement('li');
    li.className = 'envoi-jour';

    var tete = document.createElement('p');
    tete.className = 'envoi-jour__tete';
    tete.textContent = countdownLabel(n) + ' · ' + fmtShort(dayDate(n));
    li.appendChild(tete);

    var titre = document.createElement('p');
    titre.className = 'envoi-jour__titre';
    titre.textContent = c ? c.titre : 'Titre à venir';
    li.appendChild(titre);

    var lien = document.createElement('p');
    lien.className = 'envoi-jour__lien';
    lien.textContent = adresseDuJour(n);
    li.appendChild(lien);

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-outline btn-outline--clair';
    b.textContent = 'Copier le lien';
    b.setAttribute('aria-label', 'Copier le lien du ' + countdownSpoken(n).toLowerCase());
    b.addEventListener('click', function () {
      copier(adresseDuJour(n), b, 'Le lien du jour ' + n);
    });
    li.appendChild(b);

    return li;
  }

  /** Les neuf liens d'un coup, prêts à coller dans un message à l'équipe. */
  function tousLesLiens() {
    var lignes = ['Neuvaine au Sacré-Cœur — les neuf liens', ''];
    for (var n = 1; n <= TOTAL_DAYS; n++) {
      var c = CONTENT[n];
      lignes.push('Jour ' + n + ' · ' + fmtShort(dayDate(n)) +
                  (c ? ' — ' + c.titre : ''));
      lignes.push(adresseDuJour(n));
      lignes.push('');
    }
    return lignes.join('\n').replace(/\n+$/, '');
  }

  function bindEnvoyer() {
    $('#envoi-copier-message').addEventListener('click', function () {
      copier(messageDuJour(isBeforeStart() ? 1 : currentDay()), this, 'Le message');
    });

    $('#envoi-copier-lien').addEventListener('click', function () {
      var n = isBeforeStart() ? 1 : currentDay();
      copier(adresseDuJour(n), this, 'Le lien du jour ' + n);
    });

    $('#envoi-copier-tout').addEventListener('click', function () {
      copier(tousLesLiens(), this, 'Les neuf liens');
    });
  }

  /* ------------------------------------------------------------------
     Tableau de bord — la page des organisateurs

     Elle ne porte aucun chiffre. Les chiffres vivent chez GoatCounter,
     derrière le mot de passe du compte : c'est la seule confidentialité
     réelle possible, tout ce qu'on écrirait ici étant public. Cette page
     dit où les lire, et à quoi correspond chaque ligne du tableau.
     ------------------------------------------------------------------ */
  function renderStats() {
    var etat = $('#stats-etat');
    var lien = $('#stats-lien');

    if (MESURE_GOATCOUNTER) {
      etat.textContent = 'La mesure est en service. Les chiffres sont sur ' +
        'GoatCounter, derrière le mot de passe du compte — personne d’autre ' +
        'n’y entre.';
      lien.href = 'https://' + MESURE_GOATCOUNTER + '.goatcounter.com';
      lien.hidden = false;
    } else {
      etat.textContent = 'La mesure n’est pas branchée : le site ne compte ' +
        'rien, et aucune requête ne part. Pour l’allumer, ouvrir un compte ' +
        'sur goatcounter.com, puis écrire son code dans la constante ' +
        'MESURE_GOATCOUNTER, en tête de assets/js/app.js.';
      lien.hidden = true;
    }

    var liste = $('#stats-liste');
    liste.textContent = '';
    liste.appendChild(ligneStat('/', 'Accueil'));
    for (var n = 1; n <= TOTAL_DAYS; n++) {
      var c = CONTENT[n];
      liste.appendChild(ligneStat('/jour-' + n,
        'Jour ' + n + (c ? ' — ' + c.titre : '')));
    }
    liste.appendChild(ligneStat('/consecration', 'Consécration'));
    liste.appendChild(ligneStat('/envoyer', 'Envoyer le jour'));
    liste.appendChild(ligneStat('/stats', 'Cette page'));
  }

  function ligneStat(chemin, quoi) {
    var li = document.createElement('li');
    li.className = 'stats-ligne';

    var c = document.createElement('span');
    c.className = 'stats-ligne__chemin';
    c.textContent = chemin;
    li.appendChild(c);

    var q = document.createElement('span');
    q.className = 'stats-ligne__quoi';
    q.textContent = quoi;
    li.appendChild(q);

    return li;
  }

  /* ------------------------------------------------------------------
     Page d'un jour
     ------------------------------------------------------------------ */
  function renderDay(n) {
    var d = dayDate(n);
    var c = isPublished(n) ? CONTENT[n] : null;

    $('#day-date').textContent = fmtLong(d);
    $('#day-countdown').textContent = countdownLabel(n);
    $('#day-count').textContent = countdownSpoken(n);
    $('#day-title').textContent = c ? c.titre : 'Jour en attente';

    $('#day-pending').hidden = !!c;
    $('#day-content').hidden = !c;

    // Dire d'emblée ce que le jour propose, et où appuyer. Le bouton est
    // nommé par sa couleur et sa place : « en bas de l'écran » se trouve
    // sans savoir ce qu'est un lecteur audio.
    var intro = $('#day-intro');
    if (!c) {
      intro.textContent = '';
    } else if (c.audio) {
      intro.textContent = 'Cette prière est d’abord faite pour être écoutée. ' +
        'Appuyez sur le bouton rouge, en bas de l’écran : le texte ci-dessous ' +
        's’allume au fil de la voix.';
    } else {
      intro.textContent = 'L’enregistrement de ce jour n’est pas encore en ligne. ' +
        'Le texte ci-dessous se lit tel quel.';
    }

    placerIntention(!!(c && c.intentionAvant));

    if (!c) {
      $('#day-pending-date').textContent = fmtLong(d);
      setupAudio(null);
    } else {
      fillVerse($('#day-verse'), c.verset);
      $('#day-ref').textContent = c.source || '';

      /* L'intertitre suit ce qui est cité. « Parole de Dieu » ne se dit que
         de l'Écriture : six jours citent l'Évangile, mais le premier et le
         sixième citent le pape François, et le quatrième sainte Thérèse
         d'Avila. Chacun de ces trois-là porte un champ « origine » dans
         contenu.js ; sans lui, c'est bien l'Écriture. */
      $('#t-parole').textContent = c.origine || 'Parole de Dieu';
      fillParagraphs($('#day-meditation'), c.meditation);
      fillMusic(c.musique, c.paroles, c.chapitres);
      fillRendezVous(c.rendezvous);
      fillIntention(c.intention);
      fillParagraphs($('#day-prayer'), c.priere);
      setupAudio(c.audio, n);
    }

    chargerSuivi(c);

    // Un jour s'ouvre en haut de la page : le lecteur y redescend dans le
    // flux, déplié, quel que soit l'état où le jour précédent l'a laissé.
    reserverPlaceBarre();
  }

  /** Le verset est soit une phrase, soit un poème donné ligne par ligne.
   *  Dans le second cas chaque vers garde sa ligne propre. */
  function fillVerse(host, verset) {
    host.textContent = '';
    if (Array.isArray(verset)) {
      host.classList.add('is-poem');
      verset.forEach(function (ligne, i) {
        if (i) { host.appendChild(document.createElement('br')); }
        host.appendChild(document.createTextNode(ligne));
      });
    } else {
      host.classList.remove('is-poem');
      host.textContent = verset || '';
    }
  }

  /** Tous les jours n'ont pas d'intention distincte de la prière.
   *  Quand elle manque, la section entière disparaît plutôt que d'afficher
   *  un encadré vide. */
  function fillIntention(texte) {
    var section = $('#day-intention-section');
    var vide = !texte;
    section.hidden = vide;
    $('#day-intention').textContent = vide ? '' : texte;
  }

  /** Le chant qui accompagne la méditation, et ses paroles quand le jour
   *  en fournit. Elles sont surlignées comme le reste du texte. */
  /** La durée du passage chanté, déduite des chapitres : du début du chant
   *  à celui de la partie suivante. */
  function dureeChant(chapitres) {
    if (!chapitres || !chapitres.chant) { return 0; }
    var apres = 0;
    Object.keys(chapitres).forEach(function (cle) {
      var t = chapitres[cle];
      if (t > chapitres.chant && (!apres || t < apres)) { apres = t; }
    });
    return apres ? apres - chapitres.chant : 0;
  }

  var MINUTES = ['', 'une', 'deux', 'trois', 'quatre', 'cinq'];

  function noteChant(secondes) {
    if (!secondes) { return 'un temps de musique'; }
    /* L'écart entre deux chapitres comprend le silence qui suit le chant :
       une quinzaine de secondes. Sans cette retenue, deux minutes vingt
       s'annonçaient « environ trois minutes ». */
    var mn = Math.max(1, Math.round(secondes / 60 - 0.15));
    return 'un temps de musique d’environ ' +
      (MINUTES[mn] || mn) + (mn > 1 ? ' minutes' : ' minute');
  }

  /** Le rendez-vous qui suit la neuvaine.
   *
   *  Le neuvième jour s'achève, à la voix, sur une invitation à se retrouver
   *  après les neuf jours. Elle ne tenait qu'à l'enregistrement : qui écoute
   *  une fois n'a pas de quoi noter la date. Elle est donc écrite.
   *
   *  Le bloc ne paraît qu'aux jours qui en portent un. */
  function fillRendezVous(rdv) {
    var bloc = $('#day-rdv');
    if (!bloc) { return; }
    bloc.hidden = !rdv;
    if (!rdv) { return; }
    [['titre', rdv.titre], ['quand', rdv.quand], ['lieu', rdv.lieu],
     ['adresse', rdv.adresse], ['quoi', rdv.quoi]].forEach(function (paire) {
      var noeud = $('#day-rdv-' + paire[0]);
      if (!noeud) { return; }
      noeud.textContent = paire[1] || '';
      noeud.hidden = !paire[1];
    });
  }

  /** L'encart du chant.
   *
   *  Il paraît dès que le jour a un chapitre « chant », même sans titre ni
   *  paroles. Sans lui, la page restait figée pendant les deux minutes de
   *  musique — aucun mot allumé, et le bloc à allumer était masqué : on
   *  croyait le surlignage cassé. C'est lui qui dit où l'on en est. */
  function fillMusic(titre, paroles, chapitres) {
    var duree = dureeChant(chapitres);
    $('#day-music').hidden = !titre && !paroles && !duree;
    $('#day-music-title').textContent = titre || '';
    $('#day-music-title').hidden = !titre;
    $('#day-music-note').textContent = noteChant(duree);

    var hote = $('#day-music-paroles');
    hote.textContent = '';
    hote.hidden = !paroles;
    if (!paroles) { return; }

    /* Chaque vers garde sa ligne, et une entrée vide sépare deux strophes.
       Un texte vide ne prendrait aucune hauteur et les couplets se
       toucheraient : on y met une espace insécable, qui occupe la ligne.
       Elle ne devient pas un mot pour autant — enrober() écarte les nœuds
       dont le contenu est blanc, et l'espace insécable en est. */
    var lignes = Array.isArray(paroles) ? paroles : [paroles];
    lignes.forEach(function (ligne, i) {
      if (i) { hote.appendChild(document.createElement('br')); }
      hote.appendChild(document.createTextNode(ligne || '\u00a0'));
    });
  }

  /** Qui lit ce jour. Deux voix se relaient : celle du jour porte la
   *  méditation, et la même personne reprend chaque jour à la prière.
   *  Le nom paraît sous le titre, et en plus court dans la barre. */
  /** Une entrée commençant par un tiret cadratin est le répons d'une litanie :
   *  elle se distingue du texte que dit le lecteur. */
  function fillParagraphs(host, list) {
    host.textContent = '';
    (list || []).forEach(function (text) {
      var p = document.createElement('p');
      if (text.charAt(0) === '—') { p.className = 'response'; }
      p.textContent = text;
      host.appendChild(p);
    });
  }

  /** Les deux boutons portent un chevron décoratif et un libellé explicite
   *  hors contexte : « Jour précédent, jour 1 ». */
  /* ------------------------------------------------------------------
     Lecteur audio de la méditation

     Le bouton est un bouton natif, le curseur de position un champ de type
     range : le clavier, les flèches, Origine et Fin fonctionnent sans une
     ligne de code, et les lecteurs d'écran annoncent la position.
     Aucune lecture ne démarre toute seule.
     ------------------------------------------------------------------ */
  var audio = null;
  var audioSrc = null;
  var audioDay = 1;

  /* Position demandée par le visiteur, tant que le lecteur ne l'a pas
     atteinte. Un déplacement dans un fichier audio n'est pas instantané :
     relire la position juste après l'avoir écrite renvoie l'ancienne valeur
     et ramène le curseur en arrière. Tant que « wanted » vaut quelque chose,
     c'est lui qui est affiché, pas le lecteur. */
  var wanted = null;

  // Caractères posés en texte, jamais en HTML : le script n'écrit aucun balisage.
  var ICON_PLAY = '▶';
  var ICON_PAUSE = '❚❚';

  function el(id) { return document.getElementById(id); }

  /** « 1:05 » pour l'affichage. */
  function fmtClock(s) {
    s = Math.max(0, Math.round(s || 0));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  /** « 1 minute 5 secondes » pour la voix de synthèse. */
  function fmtSpoken(s) {
    s = Math.max(0, Math.round(s || 0));
    var m = Math.floor(s / 60);
    var r = s % 60;
    var out = [];
    if (m > 0) { out.push(m + (m > 1 ? ' minutes' : ' minute')); }
    if (r > 0 || m === 0) { out.push(r + (r > 1 ? ' secondes' : ' seconde')); }
    return out.join(' ');
  }

  function setBtnState(playing) {
    el('audio-icon').textContent = playing ? ICON_PAUSE : ICON_PLAY;
    el('audio-btn-text').textContent = playing
      ? 'Mettre la méditation en pause'
      : 'Écouter la méditation du jour ' + audioDay;
  }

  function setupAudio(src, day) {
    stopAudio();
    audioSrc = src || null;
    audioDay = day || 1;

    var btn = el('audio-btn');
    var seek = el('audio-seek');

    setBtnState(false);
    var barre = $('#view-jour .audio');
    if (barre) { barre.classList.toggle('a-touche', aTouche); }
    seek.value = 0;
    seek.max = 100;
    el('audio-elapsed').textContent = '0:00';
    el('audio-total').textContent = '0:00';
    seek.setAttribute('aria-valuetext', 'position 0 seconde sur 0 seconde');

    var absent = !audioSrc;
    btn.disabled = absent;
    seek.disabled = absent;
    el('audio-status').textContent = absent
      ? 'Enregistrement audio à venir'
      : 'Appuyer sur le bouton pour écouter';
  }

  /** Met le curseur, les deux durées et le texte annoncé en accord avec le
   *  lecteur. Si une position a été demandée et n'est pas encore atteinte,
   *  c'est elle qui s'affiche : le lecteur mettra quelques dizaines de
   *  millisecondes à la rejoindre, et afficher sa position d'avant ferait
   *  revenir le curseur en arrière sous le doigt du visiteur. */
  function syncSeek() {
    if (!audio) { return; }
    var seek = el('audio-seek');
    var dur = isFinite(audio.duration) ? audio.duration : 0;
    var cur = audio.currentTime;

    if (wanted !== null) {
      if (Math.abs(cur - wanted) < 0.6) { wanted = null; }
      else { cur = wanted; }
    }

    seek.max = Math.max(1, Math.round(dur));
    seek.value = Math.round(cur);
    el('audio-elapsed').textContent = fmtClock(cur);
    el('audio-total').textContent = fmtClock(dur);
    seek.setAttribute('aria-valuetext',
      'position ' + fmtSpoken(cur) + ' sur ' + fmtSpoken(dur));
  }

  function stopAudio() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio = null;
    }
    laisserEcranSeteindre();
    wanted = null;
    nettoyerSurlignage();
    montrerRevenir(false);
    if (el('audio-icon')) { setBtnState(false); }
    if (el('audio-seek')) { el('audio-seek').value = 0; }
    if (el('audio-elapsed')) { el('audio-elapsed').textContent = '0:00'; }
  }

  /** Demande une nouvelle position.
   *
   *  La demande est mémorisée dans tous les cas. Si la durée n'est pas encore
   *  connue, l'écriture attend l'arrivée des métadonnées.
   *
   *  On s'arrête un quart de seconde avant la fin : viser la durée exacte
   *  déclencherait la fin de lecture, et la touche Fin remettrait le curseur
   *  à zéro au lieu de l'amener au bout. */
  function applySeek(t) {
    wanted = Math.max(0, t);
    if (!audio) { return; }
    if (isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(wanted, Math.max(0, audio.duration - 0.25));
    }
  }

  function makeAudio() {
    audio = new Audio(audioSrc);
    audio.preload = 'metadata';

    // La durée arrive après coup. Si une position avait été demandée avant
    // qu'elle soit connue, c'est le moment de l'écrire.
    audio.addEventListener('loadedmetadata', function () {
      if (wanted !== null) { applySeek(wanted); }
      syncSeek();
    });

    audio.addEventListener('seeked', function () {
      syncSeek();
      majSurlignage();
    });
    audio.addEventListener('timeupdate', syncSeek);

    audio.addEventListener('ended', function () {
      stopAudio();
      el('audio-status').textContent = 'Lecture terminée';
    });

    audio.addEventListener('error', function () {
      stopAudio();
      el('audio-status').textContent = 'Lecture impossible pour le moment';
    });
  }

  /* ------------------------------------------------------------------
     L'écran reste allumé pendant l'écoute

     Une prière dure sept à neuf minutes, et l'on ne touche pas le téléphone
     pendant ce temps : l'écran s'éteindrait au bout d'une minute, le texte
     disparaîtrait au milieu de la méditation, et il faudrait déverrouiller
     pour suivre la suite. Le verrou tombe dès l'arrêt de la lecture — jamais
     l'écran ne reste allumé pour rien.

     Tout ici est facultatif. Un navigateur qui ne connaît pas ce verrou, ou
     qui le refuse, laisse la lecture se dérouler exactement comme avant.
     ------------------------------------------------------------------ */
  var veille = null;

  function garderEcranAllume() {
    if (veille || !navigator.wakeLock || !audio || audio.paused) { return; }
    navigator.wakeLock.request('screen').then(function (verrou) {
      // La demande met un instant à aboutir : l'écoute a pu s'arrêter
      // entre-temps, et il ne faut pas laisser l'écran allumé derrière soi.
      if (!audio || audio.paused) { verrou.release(); return; }
      veille = verrou;
      // Le navigateur relâche de lui-même quand l'onglet passe derrière.
      verrou.addEventListener('release', function () { veille = null; });
    }).catch(function () { /* refusé : l'écoute continue sans */ });
  }

  function laisserEcranSeteindre() {
    if (!veille) { return; }
    var verrou = veille;
    veille = null;
    verrou.release().catch(function () { /* déjà relâché */ });
  }

  /* Le halo du bouton s'arrête à la première pression, et pour toute la
     visite : une fois qu'on sait où appuyer, il n'a plus rien à dire. Il
     ne revient donc pas au changement de jour. */
  var aTouche = false;

  function toggleAudio() {
    if (!audioSrc) { return; }

    if (!aTouche) {
      aTouche = true;
      var barre = $('#view-jour .audio');
      if (barre) { barre.classList.add('a-touche'); }
    }
    if (!audio) { makeAudio(); }

    if (audio.paused) {
      audio.play();
      setBtnState(true);
      lancerBoucle();
      garderEcranAllume();
      el('audio-status').textContent = 'Lecture en cours';
    } else {
      audio.pause();
      setBtnState(false);
      laisserEcranSeteindre();
      el('audio-status').textContent = 'Lecture en pause';
    }
  }

  function bindAudio() {
    el('audio-btn').addEventListener('click', toggleAudio);

    var seek = el('audio-seek');

    // Pendant que le visiteur déplace le curseur, à la souris comme aux
    // flèches, l'affichage suit sa main et non la lecture.
    seek.addEventListener('input', function () {
      wanted = Number(seek.value);
      var dur = audio && isFinite(audio.duration) ? audio.duration : Number(seek.max);
      el('audio-elapsed').textContent = fmtClock(wanted);
      seek.setAttribute('aria-valuetext',
        'position ' + fmtSpoken(wanted) + ' sur ' + fmtSpoken(dur));

      // Le texte accompagne la main, sans attendre le relâchement.
      majSurlignage();
    });

    seek.addEventListener('change', function () {
      if (!audioSrc) { return; }
      if (!audio) { makeAudio(); }
      applySeek(Number(seek.value));
    });

  }

  /* ------------------------------------------------------------------
     Suivi mot à mot

     Quand un jour dispose d'un fichier de synchronisation, chaque mot
     affiché est enveloppé dans un span numéroté et reçoit sa plage horaire.
     Pendant la lecture, le mot prononcé est surligné et la page se déplace
     doucement pour le garder sous les yeux.

     Tout ici est facultatif. Sans fichier de synchronisation, ou si son
     chargement échoue, la page se comporte exactement comme avant : le
     texte reste lisible, le lecteur fonctionne, rien ne manque.
     ------------------------------------------------------------------ */
  // Au-delà de ce silence, plus aucun mot n'est allumé. Sans cette borne, le
  // dernier mot de la méditation resterait surligné pendant les deux minutes
  // de chant, comme si la lecture était bloquée.
  var SILENCE_MAX = 1.5;

  /* Décalage commun à tous les jours, en secondes. Les horodatages de la
     transcription tombent un rien en avance sur ce que l'oreille perçoit :
     une valeur négative retient le surlignage d'autant. Le champ
     « decalage » de chaque fichier de synchronisation s'ajoute à celui-ci,
     pour rattraper un jour en particulier. */
  var DECALAGE_GLOBAL = -0.15;

  // Le suivi automatique se tait un instant dès que le visiteur fait défiler
  // la page lui-même : reprendre la main sous son doigt serait pénible.
  var PAUSE_SUIVI = 5000;

  var sync = null;          // contenu du fichier .sync.json du jour affiché
  var motsDom = [];         // un span par mot affiché, dans l'ordre
  var reperes = [];         // toutes les plages, triées, pour la dichotomie
  var motActif = -1;
  var motMax = -1;          // le plus loin où la lecture soit allée
  var repriseAuto = 0;      // instant à partir duquel on suit de nouveau
  var suspendu = false;     // le visiteur a repris la main sur le défilement
  var dernierCadrage = 0;   // dernier contrôle de la position du mot lu

  // Les touches qui font défiler la page, et qui valent donc reprise en main.
  var TOUCHES_DEFILEMENT = [' ', 'Spacebar', 'PageDown', 'PageUp', 'Home',
                            'End', 'ArrowDown', 'ArrowUp'];
  var notreDefilement = 0;  // instant du dernier défilement que nous avons lancé
  var rafActif = false;
  var fixesOrigine = [];    // les textes communs, tels qu'ils sont dans la page
  var debugSuivi = false;

  /** Les zones surlignables, dans l'ordre exact où l'aligneur les a comptées.
   *  Toute divergence d'ordre décalerait tous les mots. */
  function zonesSuivi() {
    var liste = [$('#day-title'), $('#day-content .signe'), $('#day-verse'), $('#day-ref'),
                 $('#day-meditation'), $('#day-intention'),
                 $('#day-music-paroles'), $('#day-prayer')];
    // Ce sélecteur ramène les quatre prières dans l'ordre de la page :
    // Notre Père, Je vous salue Marie, Gloire au Père, puis l'acclamation,
    // dont le bloc est lui aussi un div de cette liste.
    Array.prototype.push.apply(liste,
      document.querySelectorAll('.anchors__list > div > p'));
    liste.push($('#view-jour .envoi'));

    /* L'ordre est celui du document, et non celui de cette liste :
       l'intention passe devant la méditation certains jours, et un écart
       d'une seule zone décalerait tous les mots qui suivent. */
    return liste.filter(Boolean).sort(function (a, b) {
      var pos = a.compareDocumentPosition(b);
      return (pos & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
    });
  }

  /** Place la section Intention avant ou après la méditation, selon ce que
   *  l'aligneur a constaté dans l'enregistrement de ce jour. */
  function placerIntention(avant) {
    var section = $('#day-intention-section');
    var meditation = $('#view-jour .meditation');
    if (!section || !meditation || !meditation.parentNode) { return; }

    var voulu = avant ? meditation : meditation.nextSibling;
    if (section.nextSibling === voulu || section === voulu) { return; }
    meditation.parentNode.insertBefore(section, voulu);
  }

  /** Le signe de croix et les prières d'ancrage ne changent jamais : on en
   *  garde une copie intacte, pour pouvoir les réenvelopper à chaque jour
   *  sans accumuler les spans les uns dans les autres. */
  function fixes() {
    // Le titre n'est pas un texte fixe : il est réécrit à chaque jour.
    var liste = [$('#day-content .signe')];
    Array.prototype.push.apply(liste,
      document.querySelectorAll('.anchors__list > div > p'));
    liste.push($('#view-jour .envoi'));
    return liste;
  }

  function restaurerFixes() {
    fixes().forEach(function (node, i) {
      if (!node || !node.parentNode) { return; }
      if (!fixesOrigine[i]) {
        fixesOrigine[i] = node.cloneNode(true);
      } else {
        node.parentNode.replaceChild(fixesOrigine[i].cloneNode(true), node);
      }
    });
  }

  /** Enveloppe chaque mot d'un élément dans un span numéroté, en ne touchant
   *  qu'aux nœuds de texte : les paragraphes et les retours à la ligne des
   *  poèmes restent en place, et le rendu ne bouge pas d'un pixel. */
  function enrober(host, depart) {
    var n = depart;
    if (!host || !host.textContent.trim()) { return n; }

    var noeuds = [];
    var marcheur = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null, false);
    while (marcheur.nextNode()) { noeuds.push(marcheur.currentNode); }

    noeuds.forEach(function (noeud) {
      if (!noeud.nodeValue.trim()) { return; }
      var frag = document.createDocumentFragment();
      noeud.nodeValue.split(/(\s+)/).forEach(function (morceau) {
        if (!morceau) { return; }
        if (!morceau.trim()) {
          frag.appendChild(document.createTextNode(morceau));
          return;
        }
        var span = document.createElement('span');
        span.className = 'mot';
        span.setAttribute('data-i', n);
        span.textContent = morceau;
        frag.appendChild(span);
        n += 1;
      });
      noeud.parentNode.replaceChild(frag, noeud);
    });
    return n;
  }

  function enroberTout() {
    restaurerFixes();
    var n = 0;
    zonesSuivi().forEach(function (zone) { n = enrober(zone, n); });

    motsDom = [];
    Array.prototype.forEach.call(
      document.querySelectorAll('#view-jour .mot'),
      function (span) { motsDom[Number(span.getAttribute('data-i'))] = span; }
    );
    return n;
  }

  /** Aplatit les plages en une liste triée. Un mot prononcé plusieurs fois —
   *  le Je vous salue Marie est dit trois fois pour un seul affichage — pose
   *  autant de repères qu'il a été dit de fois. Un mot de durée nulle est une
   *  zone annoncée mais pas lue : il n'entre pas dans la liste, et ne sera
   *  donc jamais surligné. */
  function poserSync(data) {
    sync = data;
    reperes = [];
    (data.mots || []).forEach(function (plage, i) {
      if (!plage || !plage.length) { return; }
      var liste = Array.isArray(plage[0]) ? plage : [plage];
      liste.forEach(function (p) {
        if (!p || p[1] <= p[0]) { return; }
        reperes.push({ d: p[0], f: p[1], i: i });
      });
    });
    reperes.sort(function (a, b) { return a.d - b.d; });
  }

  /** Le mot prononcé à cet instant, par recherche dichotomique.
   *  Renvoie -1 pendant les silences et les passages non affichés. */
  function motA(t) {
    var bas = 0, haut = reperes.length - 1, trouve = -1;
    while (bas <= haut) {
      var milieu = (bas + haut) >> 1;
      if (reperes[milieu].d <= t) { trouve = milieu; bas = milieu + 1; }
      else { haut = milieu - 1; }
    }
    if (trouve < 0) { return -1; }

    var r = reperes[trouve];
    var borne = r.f + SILENCE_MAX;
    if (trouve + 1 < reperes.length) {
      borne = Math.min(reperes[trouve + 1].d, borne);
    }
    return t < borne ? r.i : -1;
  }

  function nettoyerSurlignage() {
    eteindreSections();
    motsDom.forEach(function (span) {
      if (span) { span.classList.remove('mot-actif', 'mot-lu'); }
    });
    motActif = -1;
    motMax = -1;
  }

  function majSurlignage() {
    if (!sync || !audio) { return; }

    var t = (wanted !== null ? wanted : audio.currentTime)
            + (sync.decalage || 0) + DECALAGE_GLOBAL;
    var i = motA(t);
    if (debugSuivi) { majDebug(t, i); }
    if (i === motActif) { return; }

    if (motActif >= 0 && motsDom[motActif]) {
      motsDom[motActif].classList.remove('mot-actif');
      motsDom[motActif].classList.add('mot-lu');
    }

    // Un retour en arrière efface les marques laissées plus loin : sinon la
    // page garderait l'air d'avoir déjà tout lu.
    if (i >= 0 && i < motMax) {
      for (var k = i; k <= motMax; k++) {
        if (motsDom[k]) { motsDom[k].classList.remove('mot-lu'); }
      }
    }

    majChapitre(t);

    motActif = i;
    if (i >= 0) {
      motMax = Math.max(motMax, i);
      if (motsDom[i]) {
        motsDom[i].classList.add('mot-actif');
        suivreDuRegard(motsDom[i]);
      }
    }
  }

  /** Le bloc de la partie en cours s'allume d'un filet doré. Les pilules
   *  de navigation ont disparu du lecteur : la partie se lit maintenant
   *  directement dans les horaires du jour. */
  var chapitreActif = -1;
  var chapitres = [];   // [{ cle, debut }], du plus tôt au plus tard

  /* À quel bloc de la page correspond chaque partie de l'enregistrement.
     Le chant n'a pas de texte, mais il a son encart : c'est lui qui doit
     dire que la musique est en train de passer. */
  var BLOCS_SECTION = {
    meditation: '#view-jour .meditation',
    chant: '#day-music',
    prions: '#view-jour .prayer',
    prieres: '#view-jour .anchors',
    envoi: '#view-jour .envoi'
  };

  function majChapitre(t) {
    if (!sync || !sync.sections) { return; }
    var trouve = -1;
    for (var k = 0; k < chapitres.length; k++) {
      if (chapitres[k].debut <= t) { trouve = k; }
    }
    if (trouve === chapitreActif) { return; }

    var cle = trouve >= 0 ? chapitres[trouve].cle : null;
    Object.keys(BLOCS_SECTION).forEach(function (nom) {
      var bloc = $(BLOCS_SECTION[nom]);
      if (bloc) { bloc.classList.toggle('is-en-cours', nom === cle); }
    });

    chapitreActif = trouve;
  }

  function eteindreSections() {
    Object.keys(BLOCS_SECTION).forEach(function (nom) {
      var bloc = $(BLOCS_SECTION[nom]);
      if (bloc) { bloc.classList.remove('is-en-cours'); }
    });
    chapitreActif = -1;
  }

  /** Garde le mot lu entre 35 % et 60 % de la hauteur visible.
   *
   *  Un défilement doux met quelques centaines de millisecondes à aboutir,
   *  et le texte peut bouger entre-temps — les apparitions au défilement se
   *  déclenchent au passage. On laisse donc chaque glissement finir avant
   *  d'en demander un autre, et c'est le contrôle périodique de la boucle
   *  qui rattrape l'écart restant. */
  function suivreDuRegard(span) {
    var maintenant = Date.now();
    if (maintenant < repriseAuto) { return; }
    if (maintenant - notreDefilement < (reduced.matches ? 80 : 600)) { return; }
    if (!el('revenir').hidden) { montrerRevenir(false); }

    var r = span.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    if (r.top >= h * 0.35 && r.bottom <= h * 0.60) { return; }

    notreDefilement = maintenant;
    window.scrollTo({
      top: Math.max(0, window.pageYOffset + r.top - h * 0.45),
      behavior: reduced.matches ? 'auto' : 'smooth'
    });
  }

  /** Montre ou cache la pastille de rappel.
   *
   *  Resserrée, la barre n'a pas la largeur de porter à la fois le titre du
   *  jour et la pastille. La classe prévient la feuille de style : tant que
   *  la pastille est là, c'est elle qui compte. */
  function montrerRevenir(oui) {
    var bouton = el('revenir');
    if (!bouton || bouton.hidden === !oui) { return; }
    bouton.hidden = !oui;
    reserverPlaceBarre();
  }

  function mainMise() {
    repriseAuto = Date.now() + PAUSE_SUIVI;
    suspendu = true;
    if (sync && audio && !audio.paused) { montrerRevenir(true); }
  }

  function boucleSuivi() {
    if (!audio || audio.paused) { rafActif = false; return; }
    majSurlignage();

    // Le mot lu peut sortir du cadre sans que le mot change : le texte se
    // décale quand une apparition se déclenche, et un silence peut durer.
    // On revérifie quatre fois par seconde, plutôt qu'à chaque image, ce qui
    // rattrape aussi le texte à la fin d'une reprise en main du visiteur.
    var maintenant = Date.now();
    if (maintenant - dernierCadrage > 250) {
      dernierCadrage = maintenant;
      if (suspendu && maintenant >= repriseAuto) { suspendu = false; }
      if (motActif >= 0 && motsDom[motActif]) { suivreDuRegard(motsDom[motActif]); }
    }
    window.requestAnimationFrame(boucleSuivi);
  }

  function lancerBoucle() {
    if (rafActif || !sync) { return; }
    rafActif = true;
    window.requestAnimationFrame(boucleSuivi);
  }

  /* ---- Parties de l'enregistrement ---- */

  /** Range les horaires du jour du plus tôt au plus tard. Ils ne servent
   *  plus à dessiner des pilules, seulement à savoir quel bloc allumer. */
  function poserChapitres(horaires) {
    chapitres = [];
    chapitreActif = -1;
    if (!horaires) { return; }
    Object.keys(horaires).forEach(function (cle) {
      chapitres.push({ cle: cle, debut: horaires[cle] });
    });
    chapitres.sort(function (a, b) { return a.debut - b.debut; });
  }

  /** Va à un instant et démarre la lecture si elle était à l'arrêt. */
  function allerA(t) {
    if (!audioSrc) { return; }
    if (!audio) { makeAudio(); }
    applySeek(t);
    repriseAuto = 0;
    suspendu = false;
    montrerRevenir(false);
    majSurlignage();
    if (audio.paused) { toggleAudio(); }
  }

  /* ---- Chargement pour un jour ---- */
  function chargerSuivi(contenu) {
    sync = null;
    reperes = [];
    motsDom = [];
    motActif = motMax = -1;
    repriseAuto = 0;
    montrerRevenir(false);
    poserChapitres(contenu && contenu.chapitres);
    restaurerFixes();

    if (!contenu || !contenu.sync) { return; }

    var attendu = enroberTout();
    var demande = contenu.sync;

    /* Le fichier des horaires est chargé comme un script, et non par une
       requête. C'est le seul moyen qu'il arrive aussi quand la page est
       ouverte depuis le disque : là, le navigateur refuse toute requête,
       l'origine étant « null ». Cela permet en prime de laisser
       connect-src fermé. */
    function poser() {
      // Le visiteur a pu changer de jour pendant le chargement.
      if (!CONTENT[state.day] || CONTENT[state.day].sync !== demande) { return; }

      var data = (window.NEUVAINE_SYNC || {})[state.day];
      if (!data) { return; }

      if (!data.mots || data.mots.length !== attendu) {
        // Un décalage d'un seul mot fausserait tout le reste : mieux vaut
        // ne rien surligner que surligner de travers.
        if (window.console) {
          window.console.warn('Suivi ignoré : ' + (data.mots || []).length +
            ' plages pour ' + attendu + ' mots affichés.');
        }
        return;
      }
      poserSync(data);
      if (audio && !audio.paused) { lancerBoucle(); }
    }

    if ((window.NEUVAINE_SYNC || {})[state.day]) { poser(); return; }

    var script = document.createElement('script');
    script.src = demande;
    script.async = true;
    script.onload = poser;
    script.onerror = function () { /* la page reste parfaitement utilisable */ };
    document.head.appendChild(script);
  }

  /* ---- Le lecteur, en bas de l'écran ----

     Il y est posé dès l'arrivée et n'en bouge plus : le pouce l'atteint
     sans changer de prise, et une commande qui ne se déplace jamais est
     une commande de moins à comprendre. Toute la mécanique de décollage
     — la zone qui retenait la place, les mesures, le rattrapage à la
     rotation — est partie avec.

     Reste une seule chose à tenir : la barre flotte au-dessus du texte,
     la page doit donc réserver sa hauteur en bas pour que rien ne finisse
     dessous. La hauteur varie — la pastille « Revenir au texte lu »
     ajoute une ligne quand elle paraît — elle est donc mesurée plutôt
     que devinée. */
  function reserverPlaceBarre() {
    var bloc = $('#view-jour .audio');
    if (!bloc) { return; }
    var h = bloc.offsetHeight;
    if (h) {
      document.documentElement.style.setProperty('--barre', h + 'px');
    }
  }

  /* ---- Affichage de contrôle : ?sync=debug ---- */
  function majDebug(t, i) {
    var boite = el('sync-debug');
    if (!boite) { return; }
    var r = i >= 0 && sync.mots[i] ? JSON.stringify(sync.mots[i]) : '—';
    boite.textContent = t.toFixed(2) + ' s · mot ' + i + ' · ' + r;
  }

  function initDebug() {
    if (new URLSearchParams(window.location.search).get('sync') !== 'debug') {
      return;
    }
    debugSuivi = true;
    var boite = document.createElement('p');
    boite.id = 'sync-debug';
    boite.className = 'sync-debug';
    boite.setAttribute('aria-hidden', 'true');
    document.body.appendChild(boite);
  }

  function bindSuivi() {
    el('revenir').addEventListener('click', function () {
      repriseAuto = 0;
      montrerRevenir(false);
      if (motActif >= 0 && motsDom[motActif]) { suivreDuRegard(motsDom[motActif]); }
    });

    // Un seul écouteur pour les cinq cents mots.
    $('#view-jour').addEventListener('click', function (ev) {
      if (!sync || !ev.target.closest) { return; }
      var span = ev.target.closest('.mot');
      if (!span) { return; }
      var plage = sync.mots[Number(span.getAttribute('data-i'))];
      if (!plage || !plage.length) { return; }

      // Un mot dit plusieurs fois mène au passage suivant, pas au premier.
      var liste = Array.isArray(plage[0]) ? plage : [plage];
      var t = audio ? audio.currentTime : 0;
      var choisi = liste[0];
      for (var k = 0; k < liste.length; k++) {
        if (liste[k][0] > t) { choisi = liste[k]; break; }
      }
      allerA(choisi[0]);
    });

    // Un défilement à la molette ou au doigt est toujours celui du visiteur.
    window.addEventListener('wheel', mainMise, { passive: true });
    window.addEventListener('touchmove', mainMise, { passive: true });

    // Au clavier non plus il n'y a ni molette ni doigt : sans cela, une
    // barre d'espace passerait pour un défilement de notre fait. Les touches
    // reçues par une commande — le curseur de position, la vitesse — ne
    // regardent pas la page et ne comptent pas.
    window.addEventListener('keydown', function (ev) {
      if (TOUCHES_DEFILEMENT.indexOf(ev.key) === -1) { return; }
      if (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(ev.target.tagName)) { return; }
      mainMise();
    });

    // Un défilement tout court ne vient du visiteur que s'il ne vient pas de
    // nous. Un glissement doux sur une longue distance dure plus d'une
    // seconde : tant qu'il se poursuit, chaque secousse repousse l'échéance,
    // et il reste reconnu comme le nôtre jusqu'à ce qu'il s'arrête.
    window.addEventListener('scroll', function () {
      var maintenant = Date.now();
      if (maintenant - notreDefilement <= 1200) {
        notreDefilement = maintenant;
        return;
      }
      mainMise();
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Canal WhatsApp et partage
     ------------------------------------------------------------------ */

  /** Le cartouche « Comment participer » est toujours là : il dit comment
   *  la neuvaine se reçoit, ce qui vaut d'être lu même sans bouton. Seules
   *  les deux invitations à rejoindre le canal attendent son adresse. */
  function initLiens() {
    var liens = [$('#lien-whatsapp'), $('#lien-whatsapp-accueil')];
    liens.forEach(function (a) {
      if (!a) { return; }
      a.href = LIEN_WHATSAPP || '#';
      a.hidden = !LIEN_WHATSAPP;
      if (LIEN_WHATSAPP) {
        a.rel = 'noopener';
        a.target = '_blank';
      }
    });

    var note = $('#participer-note');
    note.textContent = COMPTE_INSTAGRAM
      ? 'Vous n’êtes pas sur WhatsApp ? Suivez ' + COMPTE_INSTAGRAM + ' sur Instagram.'
      : '';
  }

  /** Partager le jour affiché. Le partage natif du téléphone quand il
   *  existe, sinon le presse-papiers, sinon on montre l'adresse. */
  function initPartage() {
    var bouton = $('#partager');
    var etat = $('#partage-etat');

    bouton.addEventListener('click', function () {
      var c = CONTENT[state.day];
      var adresse = window.location.href;
      var texte = 'Neuvaine au Sacré-Cœur — jour ' + state.day + ' sur ' + TOTAL_DAYS +
                  (c ? ' : ' + c.titre : '');

      if (navigator.share) {
        navigator.share({ title: 'Neuvaine au Sacré-Cœur',
                          text: texte, url: adresse })
          .catch(function () { /* partage refusé : rien à signaler */ });
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texte + ' ' + adresse).then(function () {
          etat.textContent = 'Lien copié.';
          window.setTimeout(function () { etat.textContent = ''; }, 4000);
        }, function () { etat.textContent = adresse; });
        return;
      }
      etat.textContent = adresse;
    });
  }

  /* ------------------------------------------------------------------
     Branchements
     ------------------------------------------------------------------ */
  function start() {
    initReveal();
    renderHome();

    // Boutons de navigation déclarés dans le balisage
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-goto]'),
      function (node) {
        node.addEventListener('click', function () {
          show(node.getAttribute('data-goto'));
        });
      }
    );

    // Qui tombe sur l'accueil entre dans le jour du jour par cette ligne.
    // Elle ne mène qu'à celui-là : les huit autres gardent leur lien.
    $('#hero-today').addEventListener('click', function () {
      show('jour', isBeforeStart() ? 1 : currentDay());
    });

    bindAudio();
    bindEnvoyer();
    initDebug();
    bindSuivi();
    initLiens();
    initPartage();
    initMesure();
    reserverPlaceBarre();

    // Une rotation d'écran change la largeur de la barre, donc sa hauteur :
    // la place réservée sous le texte est reprise.
    window.addEventListener('resize', reserverPlaceBarre);

    // Revenir sur l'onglet après l'avoir quitté : le verrou d'écran a été
    // relâché entre-temps, on le redemande si la lecture court toujours.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { garderEcranAllume(); }
    });

    window.addEventListener('popstate', function () { applyHash(true); });

    applyHash(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
