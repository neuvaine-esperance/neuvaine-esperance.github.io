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

  /** « J-9 » pour le premier jour, « J-1 » pour le neuvième.
   *  C'est une abréviation graphique : elle est masquée aux lecteurs d'écran,
   *  qui reçoivent la version en toutes lettres produite ci-dessous. */
  function countdownLabel(n) { return 'J-' + (TOTAL_DAYS + 1 - n); }

  /** « Jour 1 sur 9, dans 9 jours » : la même information, énoncée. */
  function countdownSpoken(n) {
    var reste = TOTAL_DAYS + 1 - n;
    var suite = reste > 1 ? 'dans ' + reste + ' jours' : 'demain';
    return 'Jour ' + n + ' sur ' + TOTAL_DAYS + ', ' + suite;
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
    playReveal(VIEWS[state.view], state.view);
    if (moveFocus) { focusTitle(state.view); }
  }

  /* ------------------------------------------------------------------
     Accueil : bouton du jour et grille des neuf jours
     ------------------------------------------------------------------ */
  function renderHome() {
    var t = today();
    var badge = $('#cta-badge');
    var cta = $('#cta-today');

    var label;
    if (isBeforeStart()) {
      // Avant le 16 septembre : on compte les jours qui restent jusqu'au 25.
      label = 'J-' + (Math.round((START - t) / DAY_MS) + TOTAL_DAYS);
      cta.setAttribute('aria-label', 'Prier aujourd’hui, ouvrir le premier jour');
    } else {
      label = countdownLabel(currentDay());
      cta.setAttribute('aria-label',
        'Prier aujourd’hui, ouvrir le ' + countdownSpoken(currentDay()).toLowerCase());
    }
    badge.textContent = label;

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

    if (!c) {
      $('#day-pending-date').textContent = fmtLong(d);
      setupAudio(null);
    } else {
      fillVerse($('#day-verse'), c.verset);
      $('#day-ref').textContent = c.source || '';
      fillParagraphs($('#day-meditation'), c.meditation);
      fillMusic(c.musique);
      fillIntention(c.intention);
      fillParagraphs($('#day-prayer'), c.priere);
      setupAudio(c.audio, n);
    }

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

  /** Le chant proposé pour accompagner la méditation, quand il y en a un. */
  function fillMusic(titre) {
    var p = $('#day-music');
    p.hidden = !titre;
    $('#day-music-title').textContent = titre || '';
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

    audio.addEventListener('seeked', syncSeek);
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

    window.addEventListener('popstate', function () { applyHash(true); });

    applyHash(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
