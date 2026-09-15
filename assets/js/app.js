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

  /* Chaque jour paraît le matin même : la veille, il reste en attente.
     Mettre true ici ouvre les neuf jours d'un seul coup. */
  var OUVRIR_TOUT = false;

  /* Adresse du canal WhatsApp. Tant qu'elle est vide, les deux invitations
     à rejoindre le canal restent absentes de la page : mieux vaut ne rien
     proposer qu'un bouton qui ne mène nulle part. */
  var LIEN_WHATSAPP = '';
  var COMPTE_INSTAGRAM = '';

  /* La même voix reprend la prière tous les jours : elle est ici plutôt que
     répétée neuf fois dans contenu.js. Laisser vide pour n'annoncer que le
     lecteur du jour. */
  var LECTEUR_PRIERES = 'Eugène';

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

  function fmtShort(d) { return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()]; }

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
     Navigation entre les écrans
     ------------------------------------------------------------------ */
  var VIEWS = {
    accueil: $('#view-accueil'),
    jour: $('#view-jour'),
    consecration: $('#view-consecration')
  };

  // Titre de chaque écran, sur lequel le focus est posé après un changement.
  var TITLES = {
    accueil: '#accueil-titre',
    jour: '#day-title',
    consecration: '#consec-titre'
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

    var hash = view === 'jour' ? '#jour-' + state.day : '#' + view;
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
  }

  function readHash() {
    var h = (window.location.hash || '').replace('#', '');
    var m = h.match(/^jour-(\d)$/);
    if (m) { return { view: 'jour', day: Number(m[1]) }; }
    if (h === 'consecration') { return { view: 'consecration', day: state.day }; }
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

    // Ce retour en haut est le nôtre, comme dans show() : sans la marque, le
    // suivi du texte le prendrait pour un geste du visiteur.
    notreDefilement = Date.now();
    window.scrollTo(0, 0);

    playReveal(VIEWS[state.view], state.view);
    if (moveFocus) { focusTitle(state.view); }
  }

  /* ------------------------------------------------------------------
     Accueil : bouton du jour et grille des neuf jours
     ------------------------------------------------------------------ */
  function renderHome() {
    var t = today();
    var cta = $('#cta-today');
    var sous = $('#cta-sub');

    // Le sous-titre dit en toutes lettres où mène le bouton : quel jour,
    // et de quoi il parle.
    if (isBeforeStart()) {
      var c1 = isPublished(1) ? CONTENT[1] : null;
      sous.textContent = c1
        ? 'Jour 1 sur ' + TOTAL_DAYS + ' — ' + c1.titre
        : 'La neuvaine s’ouvre le ' + fmtLong(START) + '.';
      cta.setAttribute('aria-label', 'Prier aujourd’hui, ouvrir le premier jour');
    } else {
      var n = currentDay();
      var c = CONTENT[n];
      sous.textContent = 'Jour ' + n + ' sur ' + TOTAL_DAYS +
        (c ? ' — ' + c.titre : '');
      cta.setAttribute('aria-label',
        'Prier aujourd’hui, ouvrir le ' + countdownSpoken(n).toLowerCase());
    }

    var grid = $('#day-grid');
    grid.textContent = '';

    for (var n = 1; n <= TOTAL_DAYS; n++) {
      grid.appendChild(buildDayCard(n, t));
    }
  }

  function buildDayCard(n, t) {
    var d = dayDate(n);
    var published = isPublished(n);
    var isToday = d.getTime() === t.getTime();
    var isPast = d < t;

    var status;
    if (!published) { status = 'En attente'; }
    else if (isToday) { status = 'Aujourd’hui'; }
    else if (isPast) { status = 'Prié'; }
    else { status = 'Disponible'; }

    var li = document.createElement('li');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-card anim anim--scale' +
      (isToday ? ' is-today' : (published ? ' is-ready' : ''));

    // Les neuf cartes arrivent en cascade plutôt que d'un bloc.
    // Passer par une propriété personnalisée évite d'écrire un style en
    // ligne dans le document, ce que la politique de sécurité interdit.
    btn.style.setProperty('--d', (n * 45) + 'ms');

    // Le libellé énoncé reprend tout ce que la carte montre, y compris
    // l'état, qui n'est donc jamais porté par la seule couleur.
    btn.setAttribute('aria-label',
      countdownSpoken(n) + ', ' + fmtLong(d) + '. ' + status + '.');

    var num = document.createElement('span');
    num.className = 'day-card__n';
    num.setAttribute('aria-hidden', 'true');
    num.textContent = countdownLabel(n);
    btn.appendChild(num);

    var foot = document.createElement('span');
    foot.setAttribute('aria-hidden', 'true');

    var date = document.createElement('span');
    date.className = 'day-card__date';
    date.textContent = fmtShort(d);
    foot.appendChild(date);

    var st = document.createElement('span');
    st.className = 'day-card__status';
    st.textContent = status;
    foot.appendChild(st);

    btn.appendChild(foot);

    if (isToday) {
      var dot = document.createElement('span');
      dot.className = 'day-card__dot';
      dot.setAttribute('aria-hidden', 'true');
      btn.appendChild(dot);
    }

    btn.addEventListener('click', function () { show('jour', n); });
    li.appendChild(btn);
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

    // Le titre ne s'affiche dans la barre que lorsqu'elle est resserrée,
    // mais il y est posé dès maintenant.
    $('#audio-compact-titre').textContent = c ? c.titre : '';
    fillReader(c && c.lecteur);

    if (!c) {
      $('#day-pending-date').textContent = fmtLong(d);
      setupAudio(null);
    } else {
      fillVerse($('#day-verse'), c.verset);
      $('#day-ref').textContent = c.source || '';
      fillParagraphs($('#day-meditation'), c.meditation);
      fillMusic(c.musique, c.paroles);
      fillIntention(c.intention);
      fillParagraphs($('#day-prayer'), c.priere);
      setupAudio(c.audio, n);
    }

    chargerSuivi(c);

    renderDayNav(n);
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
  function fillMusic(titre, paroles) {
    $('#day-music').hidden = !titre && !paroles;
    $('#day-music-title').textContent = titre || '';
    $('#day-music-title').hidden = !titre;

    var hote = $('#day-music-paroles');
    hote.textContent = '';
    hote.hidden = !paroles;
    if (!paroles) { return; }

    // Chaque vers garde sa ligne.
    var lignes = Array.isArray(paroles) ? paroles : [paroles];
    lignes.forEach(function (ligne, i) {
      if (i) { hote.appendChild(document.createElement('br')); }
      hote.appendChild(document.createTextNode(ligne));
    });
  }

  /** Qui lit ce jour. Deux voix se relaient : celle du jour porte la
   *  méditation, et la même personne reprend chaque jour à la prière.
   *  Le nom paraît sous le titre, et en plus court dans la barre. */
  function fillReader(nom) {
    var sous = $('#day-reader');
    var court = nom || '';
    var long = nom ? 'Lu par ' + nom : '';

    if (nom && LECTEUR_PRIERES) {
      long += ', puis ' + LECTEUR_PRIERES + ' à partir de la prière';
      court += ' et ' + LECTEUR_PRIERES;
    } else if (!nom && LECTEUR_PRIERES) {
      long = 'Prière lue par ' + LECTEUR_PRIERES;
      court = LECTEUR_PRIERES;
    }

    sous.hidden = !long;
    sous.textContent = long;
    $('#audio-reader').textContent = court;
  }

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
  function renderDayNav(n) {
    setNavButton($('#day-prev'), '‹', 'Jour ' + Math.max(1, n - 1),
                 'Jour précédent, jour ' + Math.max(1, n - 1), n <= 1);
    setNavButton($('#day-next'), null, 'Jour ' + Math.min(TOTAL_DAYS, n + 1),
                 'Jour suivant, jour ' + Math.min(TOTAL_DAYS, n + 1), n >= TOTAL_DAYS,
                 '›');
  }

  function setNavButton(btn, before, text, label, disabled, after) {
    btn.textContent = '';
    if (before) { btn.appendChild(decor(before)); }
    btn.appendChild(document.createTextNode(' ' + text + ' '));
    if (after) { btn.appendChild(decor(after)); }
    btn.setAttribute('aria-label', label);
    btn.disabled = disabled;
  }

  function decor(ch) {
    var s = document.createElement('span');
    s.setAttribute('aria-hidden', 'true');
    s.textContent = ch;
    return s;
  }

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
    var rate = el('audio-rate');

    setBtnState(false);
    seek.value = 0;
    seek.max = 100;
    el('audio-elapsed').textContent = '0:00';
    el('audio-total').textContent = '0:00';
    seek.setAttribute('aria-valuetext', 'position 0 seconde sur 0 seconde');

    var absent = !audioSrc;
    btn.disabled = absent;
    seek.disabled = absent;
    rate.disabled = absent;
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
    wanted = null;
    nettoyerSurlignage();
    if (el('revenir')) { el('revenir').hidden = true; }
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
    audio.playbackRate = parseFloat(el('audio-rate').value) || 1;

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

  function toggleAudio() {
    if (!audioSrc) { return; }
    if (!audio) { makeAudio(); }

    if (audio.paused) {
      audio.play();
      setBtnState(true);
      lancerBoucle();
      el('audio-status').textContent = 'Lecture en cours';
    } else {
      audio.pause();
      setBtnState(false);
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

    el('audio-rate').addEventListener('change', function () {
      var r = parseFloat(this.value) || 1;
      if (audio) { audio.playbackRate = r; }
      el('audio-status').textContent = 'Vitesse réglée sur ' +
        String(r).replace('.', ',') + ' fois';
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
  var SUIVI_CLE = 'neuvaine.suivre';

  // Au-delà de ce silence, plus aucun mot n'est allumé. Sans cette borne, le
  // dernier mot de la méditation resterait surligné pendant les deux minutes
  // de chant, comme si la lecture était bloquée.
  var SILENCE_MAX = 1.5;

  // Le suivi automatique se tait un instant dès que le visiteur fait défiler
  // la page lui-même : reprendre la main sous son doigt serait pénible.
  var PAUSE_SUIVI = 5000;

  var sync = null;          // contenu du fichier .sync.json du jour affiché
  var motsDom = [];         // un span par mot affiché, dans l'ordre
  var reperes = [];         // toutes les plages, triées, pour la dichotomie
  var motActif = -1;
  var motMax = -1;          // le plus loin où la lecture soit allée
  var suivre = true;
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
    var liste = [$('#day-content .signe'), $('#day-verse'), $('#day-ref'),
                 $('#day-meditation'), $('#day-music-paroles'),
                 $('#day-intention'), $('#day-prayer')];
    // Ce sélecteur ramène les quatre prières dans l'ordre de la page :
    // Notre Père, Je vous salue Marie, Gloire au Père, puis l'acclamation,
    // dont le bloc est lui aussi un div de cette liste.
    Array.prototype.push.apply(liste,
      document.querySelectorAll('.anchors__list > div > p'));
    liste.push($('#view-jour .envoi'));
    return liste;
  }

  /** Le signe de croix et les prières d'ancrage ne changent jamais : on en
   *  garde une copie intacte, pour pouvoir les réenvelopper à chaque jour
   *  sans accumuler les spans les uns dans les autres. */
  function fixes() {
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
    motsDom.forEach(function (span) {
      if (span) { span.classList.remove('mot-actif', 'mot-lu'); }
    });
    motActif = -1;
    motMax = -1;
  }

  function majSurlignage() {
    if (!sync || !suivre || !audio) { return; }

    var t = (wanted !== null ? wanted : audio.currentTime) + (sync.decalage || 0);
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

  /** Allume la pilule de la partie en cours d'écoute. */
  var chapitreActif = -1;

  function majChapitre(t) {
    if (!sync || !sync.sections) { return; }
    var boutons = el('chapitres').children;
    var trouve = -1;
    for (var k = 0; k < boutons.length; k++) {
      if (Number(boutons[k].getAttribute('data-debut')) <= t) { trouve = k; }
    }
    if (trouve === chapitreActif) { return; }
    for (var j = 0; j < boutons.length; j++) {
      boutons[j].classList.toggle('is-actif', j === trouve);
    }
    chapitreActif = trouve;
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
    if (!el('revenir').hidden) { el('revenir').hidden = true; }

    var r = span.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    if (r.top >= h * 0.35 && r.bottom <= h * 0.60) { return; }

    notreDefilement = maintenant;
    window.scrollTo({
      top: Math.max(0, window.pageYOffset + r.top - h * 0.45),
      behavior: reduced.matches ? 'auto' : 'smooth'
    });
  }

  function mainMise() {
    repriseAuto = Date.now() + PAUSE_SUIVI;
    suspendu = true;
    if (sync && audio && !audio.paused) { el('revenir').hidden = false; }
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
      // Le resserrement a pu être différé pendant un glissement : c'est ici
      // qu'il est repris, une fois la page retombée.
      majCompact();
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

  /* ---- Chapitres ---- */
  var NOMS_CHAPITRES = {
    'signe-de-croix': 'Signe de croix', meditation: 'Méditation',
    chant: 'Chant', prions: 'Prions', prieres: 'Prières', envoi: 'Envoi'
  };

  function remplirChapitres(chapitres) {
    var hote = el('chapitres');
    hote.textContent = '';
    chapitreActif = -1;

    var cles = chapitres ? Object.keys(chapitres) : [];
    if (!cles.length) { hote.hidden = true; return; }

    cles.sort(function (a, b) { return chapitres[a] - chapitres[b]; });
    cles.forEach(function (cle) {
      var nom = NOMS_CHAPITRES[cle] || cle;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chapitre';
      b.setAttribute('data-debut', chapitres[cle]);
      b.textContent = nom;
      b.setAttribute('aria-label',
        nom + ', écouter à partir de ' + fmtSpoken(chapitres[cle]));
      b.addEventListener('click', function () { allerA(chapitres[cle]); });
      hote.appendChild(b);
    });
    hote.hidden = false;
  }

  /** Va à un instant et démarre la lecture si elle était à l'arrêt. */
  function allerA(t) {
    if (!audioSrc) { return; }
    if (!audio) { makeAudio(); }
    applySeek(t);
    repriseAuto = 0;
    suspendu = false;
    el('revenir').hidden = true;
    majSurlignage();
    if (audio.paused) { toggleAudio(); }
  }

  /* ---- Interrupteur ---- */
  function appliquerSuivi(actif) {
    suivre = actif;
    document.body.classList.toggle('sans-suivi', !actif);
    if (!actif) {
      nettoyerSurlignage();
      el('revenir').hidden = true;
    }
    try { window.localStorage.setItem(SUIVI_CLE, actif ? '1' : '0'); }
    catch (e) { /* navigation privée : on garde le réglage pour la session */ }
  }

  function suiviMemorise() {
    try {
      var v = window.localStorage.getItem(SUIVI_CLE);
      return v === null ? true : v === '1';
    } catch (e) { return true; }
  }

  /* ---- Chargement pour un jour ---- */
  function chargerSuivi(contenu) {
    sync = null;
    reperes = [];
    motsDom = [];
    motActif = motMax = -1;
    repriseAuto = 0;
    el('revenir').hidden = true;
    remplirChapitres(contenu && contenu.chapitres);
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

  /* ---- Le lecteur se resserre au défilement ----

     Il est dans le flux : en rétrécissant, il raccourcit la page de près de
     trois cents pixels d'un coup, et tout ce qui le suit remonte d'autant.
     La page paraît alors sauter sous les yeux. On rattrape donc la
     différence de hauteur par un déplacement égal et opposé.

     Deux précautions en plus : un seuil de retour plus bas que le seuil
     d'aller, pour qu'il ne clignote pas à la frontière ; et aucun
     changement tant qu'un de nos glissements est en vol, sinon il viserait
     une position que l'on est en train de déplacer. */
  var hauteurDepliee = 0;

  function majCompact() {
    var bloc = $('#view-jour .audio');
    if (!bloc || VIEWS.jour.hidden) { return; }

    var maintenant = Date.now();
    if (maintenant - notreDefilement < 600) { return; }

    var compact = bloc.classList.contains('compact');
    if (!compact) { hauteurDepliee = bloc.offsetHeight; }
    if (!hauteurDepliee) { return; }

    /* On ne resserre qu'une fois la barre dépliée entièrement dépassée.
       Plus haut, la page n'a pas la course nécessaire pour rendre les
       pixels qu'elle perdrait : le rattrapage buterait sur le sommet et le
       texte sauterait quand même. L'écart entre les deux seuils évite le
       clignotement à la frontière. */
    var y = window.pageYOffset;
    var veut = compact ? y > hauteurDepliee - 60 : y > hauteurDepliee + 20;
    if (veut === compact) { return; }

    var hauteurAvant = bloc.offsetHeight;
    bloc.classList.toggle('compact', veut);
    var delta = bloc.offsetHeight - hauteurAvant;

    if (delta) {
      notreDefilement = maintenant;
      // Sans « auto », le défilement doux de la feuille de style
      // transformerait ce rattrapage en glissement, donc en sursaut.
      window.scrollBy({ top: delta, behavior: 'auto' });
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
    var interrupteur = el('suivre');
    interrupteur.checked = suiviMemorise();
    appliquerSuivi(interrupteur.checked);
    interrupteur.addEventListener('change', function () {
      appliquerSuivi(this.checked);
      if (this.checked && audio && !audio.paused) { lancerBoucle(); }
    });

    el('revenir').addEventListener('click', function () {
      repriseAuto = 0;
      this.hidden = true;
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
      majCompact();
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

  /** Les deux invitations à rejoindre le canal n'apparaissent que si son
   *  adresse est renseignée en tête de ce fichier. */
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
    $('#participer').hidden = !LIEN_WHATSAPP;

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

    $('#cta-today').addEventListener('click', function () {
      show('jour', isBeforeStart() ? 1 : currentDay());
    });

    $('#day-prev').addEventListener('click', function () {
      if (state.day > 1) { show('jour', state.day - 1); }
    });

    $('#day-next').addEventListener('click', function () {
      if (state.day < TOTAL_DAYS) { show('jour', state.day + 1); }
    });

    bindAudio();
    initDebug();
    bindSuivi();
    initLiens();
    initPartage();
    majCompact();

    window.addEventListener('popstate', function () { applyHash(true); });

    applyHash(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
