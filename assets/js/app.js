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

  /* ------------------------------------------------------------------
     Contenu des neuf jours

     Chaque jour publié suit cette forme :

       {
         title:      "Titre du jour",
         verse:      "« Citation de l'Évangile »",
         ref:        "Luc 6, 6-11",
         meditation: ["premier paragraphe", "deuxième paragraphe"],
         intention:  "Intention du jour.",
         prayer:     ["premier paragraphe", "deuxième paragraphe"],
         audio:      "assets/audio/jour-1.mp3"   // facultatif
       }

     Un jour laissé à null affiche « Ce jour sera disponible le … ».
     Il suffit de remplacer le null par un objet le matin même.
     ------------------------------------------------------------------ */
  var CONTENT = {
    1: {
      title: 'Lève-toi, tiens-toi là, au milieu',
      verse: '« Jésus dit à l’homme qui avait la main desséchée : Lève-toi, et ' +
             'tiens-toi debout, là, au milieu. L’homme se dressa et se tint debout. »',
      ref: 'Luc 6, 6-11',
      meditation: [
        'Un geste de rien. Jésus demande au paralysé de se lever et de se placer au ' +
        'milieu. Et celui-ci n’ose même pas : Luc note qu’il se leva et se tint ' +
        'debout, sans dire qu’il alla au milieu. Pourtant, dans ce geste presque ' +
        'anodin, une question nous est posée : que plaçons-nous au centre de notre vie ?',

        'Notre vie ressemble à une danse. Un pas en avant, deux pas en arrière, mais ' +
        'nous tournons presque toujours autour d’un point fixe qui oriente tout le ' +
        'reste. Et le plus souvent, au centre, nous mettons la force : celui qui ' +
        'réussit, celui qui s’impose, celui qui gagne.',

        'La logique du Cœur de Jésus ne prolonge pas notre pente naturelle, elle la ' +
        'renverse. Là où nous plaçons la force, il place la faiblesse. Le centre ' +
        'n’est pas réservé au fort ou au capable ; il est donné à celui qui ne peut ' +
        'rien revendiquer. Ce Cœur ouvert « pour que le monde ait la vie » nous ' +
        'déplace, et c’est peut-être là notre prière de ce jour : rester devant ce ' +
        'déplacement et le laisser avoir raison de nous.'
      ],
      intention: 'Pour ceux que tout le monde regarde de côté, et pour que nos ' +
                 'communautés apprennent à les placer au milieu.',
      prayer: [
        'Seigneur, voici nos centres de gravité : nos réussites, nos peurs, nos héros, ' +
        'notre importance, tout ce autour de quoi nous tournons sans même nous en ' +
        'apercevoir.',

        'Et voici ton Évangile, avec cet homme que tout le monde regardait de côté et ' +
        'que tu mets au milieu. Nous voilà embêtés, comme les pharisiens. Nous ne ' +
        'savons pas très bien quoi en faire.',

        'Ouvre nos cœurs à ton Cœur, pour que le monde ait la vie. Amen.'
      ],
      audio: 'assets/audio/jour-1.mp3'
    },
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null
  };

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

  /** Étiquette du compte à rebours : J-9 pour le premier jour, J-1 pour le neuvième. */
  function countdownLabel(n) { return 'J-' + (TOTAL_DAYS + 1 - n); }

  /** Numéro du jour en cours, borné entre 1 et 9. */
  function currentDay() {
    var diff = Math.round((today() - START) / DAY_MS);
    return Math.min(TOTAL_DAYS, Math.max(1, diff + 1));
  }

  function isBeforeStart() { return today() < START; }

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

  /** Lance les apparitions d'un écran qui vient de s'afficher.
   *
   *  Un élément masqué n'est jamais vu par l'observateur, il faut donc
   *  relancer au moment où l'écran devient visible.
   *
   *  Seul l'écran d'un jour se rejoue à chaque ouverture, parce que son
   *  contenu change. Rejouer l'accueil à chaque retour serait lassant :
   *  on s'y contente de tout montrer. */
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

    // Force la prise en compte du retrait avant de réobserver, sinon le
    // navigateur regroupe les deux changements et aucune transition ne joue.
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

  var state = { view: 'accueil', day: 1 };

  function show(view, day) {
    state.view = view;
    if (day) { state.day = Math.min(TOTAL_DAYS, Math.max(1, day)); }

    Object.keys(VIEWS).forEach(function (key) {
      VIEWS[key].hidden = (key !== view);
    });

    stopAudio();
    if (view === 'jour') { renderDay(state.day); }

    var hash = view === 'jour' ? '#jour-' + state.day : '#' + view;
    if (window.location.hash !== hash) {
      history.pushState({ view: view, day: state.day }, '', hash);
    }
    window.scrollTo(0, 0);
    playReveal(VIEWS[view], view);
  }

  function readHash() {
    var h = (window.location.hash || '').replace('#', '');
    var m = h.match(/^jour-(\d)$/);
    if (m) { return { view: 'jour', day: Number(m[1]) }; }
    if (h === 'consecration') { return { view: 'consecration', day: state.day }; }
    return { view: 'accueil', day: state.day };
  }

  function applyHash() {
    var target = readHash();
    state.day = Math.min(TOTAL_DAYS, Math.max(1, target.day));
    state.view = target.view;

    Object.keys(VIEWS).forEach(function (key) {
      VIEWS[key].hidden = (key !== state.view);
    });

    stopAudio();
    if (state.view === 'jour') { renderDay(state.day); }
    playReveal(VIEWS[state.view], state.view);
  }

  /* ------------------------------------------------------------------
     Accueil : bouton du jour et grille des neuf jours
     ------------------------------------------------------------------ */
  function renderHome() {
    var t = today();
    var badge = $('#cta-badge');

    if (isBeforeStart()) {
      // Avant le 16 septembre : on compte les jours qui restent jusqu'au 25.
      badge.textContent = 'J-' + (Math.round((START - t) / DAY_MS) + TOTAL_DAYS);
    } else {
      badge.textContent = countdownLabel(currentDay());
    }

    var grid = $('#day-grid');
    grid.textContent = '';

    for (var n = 1; n <= TOTAL_DAYS; n++) {
      grid.appendChild(buildDayCard(n, t));
    }
  }

  function buildDayCard(n, t) {
    var d = dayDate(n);
    var published = !!CONTENT[n];
    var isToday = d.getTime() === t.getTime();
    var isPast = d < t;

    var status;
    if (!published) { status = 'En attente'; }
    else if (isToday) { status = 'Aujourd’hui'; }
    else if (isPast) { status = 'Prié'; }
    else { status = 'Disponible'; }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-card anim anim--scale' +
      (isToday ? ' is-today' : (published ? ' is-ready' : ''));

    // Les neuf cartes arrivent en cascade plutôt que d'un bloc.
    // Passer par une propriété personnalisée évite d'écrire un style en
    // ligne dans le document, ce que la politique de sécurité interdit.
    btn.style.setProperty('--d', (n * 45) + 'ms');
    btn.setAttribute('aria-label',
      'Jour ' + n + ', ' + countdownLabel(n) + ', ' + fmtLong(d) + ' — ' + status);

    var num = document.createElement('span');
    num.className = 'day-card__n';
    num.textContent = countdownLabel(n);
    btn.appendChild(num);

    var foot = document.createElement('span');

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
      btn.appendChild(dot);
    }

    btn.addEventListener('click', function () { show('jour', n); });
    return btn;
  }

  /* ------------------------------------------------------------------
     Page d'un jour
     ------------------------------------------------------------------ */
  function renderDay(n) {
    var d = dayDate(n);
    var c = CONTENT[n];

    $('#day-date').textContent = fmtLong(d);
    $('#day-countdown').textContent = countdownLabel(n);
    $('#day-count').textContent = 'Jour ' + n + ' / ' + TOTAL_DAYS;
    $('#day-title').textContent = c ? c.title : 'En attente';

    $('#day-pending').hidden = !!c;
    $('#day-content').hidden = !c;

    if (!c) {
      $('#day-pending-date').textContent = fmtLong(d);
    } else {
      $('#day-verse').textContent = c.verse;
      $('#day-ref').textContent = c.ref;
      fillParagraphs($('#day-meditation'), c.meditation);
      $('#day-intention').textContent = c.intention;
      fillParagraphs($('#day-prayer'), c.prayer);
      setupAudio(c.audio);
    }

    renderDayNav(n);
  }

  function fillParagraphs(host, list) {
    host.textContent = '';
    (list || []).forEach(function (text) {
      var p = document.createElement('p');
      p.textContent = text;
      host.appendChild(p);
    });
  }

  function renderDayNav(n) {
    var prev = $('#day-prev');
    var next = $('#day-next');

    prev.textContent = '‹ Jour ' + Math.max(1, n - 1);
    next.textContent = 'Jour ' + Math.min(TOTAL_DAYS, n + 1) + ' ›';

    prev.disabled = (n <= 1);
    next.disabled = (n >= TOTAL_DAYS);
  }

  /* ------------------------------------------------------------------
     Lecteur audio de la méditation
     ------------------------------------------------------------------ */
  var audio = null;
  var audioSrc = null;

  // Caractères posés en texte, jamais en HTML : le script n'écrit aucun balisage.
  var ICON_PLAY = '▶';        // ▶
  var ICON_PAUSE = '❚❚'; // ❚❚

  function setupAudio(src) {
    stopAudio();
    audioSrc = src || null;

    var btn = $('#audio-btn');
    var status = $('#audio-status');

    resetAudioBar();
    btn.textContent = ICON_PLAY;

    if (!audioSrc) {
      btn.disabled = true;
      status.textContent = 'Enregistrement audio à venir';
      return;
    }

    btn.disabled = false;
    status.textContent = 'Appuyer pour écouter';
  }

  function resetAudioBar() {
    var bar = $('#audio-bar');
    bar.style.width = '0%';
    bar.setAttribute('aria-valuenow', '0');
  }

  function stopAudio() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio = null;
    }
    var btn = $('#audio-btn');
    if (btn) { btn.textContent = ICON_PLAY; }
    resetAudioBar();
  }

  function toggleAudio() {
    if (!audioSrc) { return; }

    var btn = $('#audio-btn');
    var status = $('#audio-status');
    var bar = $('#audio-bar');

    if (!audio) {
      audio = new Audio(audioSrc);

      audio.addEventListener('timeupdate', function () {
        if (!audio.duration) { return; }
        var pct = Math.round((audio.currentTime / audio.duration) * 100);
        bar.style.width = pct + '%';
        bar.setAttribute('aria-valuenow', String(pct));
      });

      audio.addEventListener('ended', function () {
        stopAudio();
        status.textContent = 'Appuyer pour écouter';
      });

      audio.addEventListener('error', function () {
        stopAudio();
        status.textContent = 'Lecture impossible pour le moment';
      });
    }

    if (audio.paused) {
      audio.play();
      btn.textContent = ICON_PAUSE;
      status.textContent = 'Lecture en cours';
    } else {
      audio.pause();
      btn.textContent = ICON_PLAY;
      status.textContent = 'Lecture en pause';
    }
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
      function (el) {
        el.addEventListener('click', function () {
          show(el.getAttribute('data-goto'));
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

    $('#audio-btn').addEventListener('click', toggleAudio);

    window.addEventListener('popstate', applyHash);

    applyHash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
