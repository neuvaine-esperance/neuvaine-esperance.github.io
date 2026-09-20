/* ==========================================================================
   Neuvaine au Sacré-Cœur — contenu des neuf jours

   Ce fichier ne contient que du texte. On peut le modifier sans rien
   connaître au reste du site, et sans jamais toucher à app.js.

   Forme d'un jour :

     {
       titre:      "Titre du jour",
       verset:     "« Citation »",          // ou un tableau de lignes,
                                            // pour un poème
       source:     "Jean 15, 12",           // d'où vient la citation
       meditation: ["paragraphe", "..."],
       musique:    "Titre — interprète",    // facultatif
       intention:  "Intention du jour.",    // facultatif
       priere:     ["paragraphe", "..."],   // une entrée commençant par
                                            // « — » est un répons de litanie
       audio:      "assets/audio/jour-1.mp3" // facultatif
     }

   Chaque jour s'ouvre par le signe de croix et se termine par le Notre Père,
   trois Je vous salue Marie, un Gloire au Père et l'acclamation au
   Sacré-Cœur. Ces prières sont communes à tous les jours : elles sont dans
   index.html, pas ici.
   ========================================================================== */
window.NEUVAINE_CONTENU = {

  /* ---------------------------------------------------------------- 1 --- */
  1: {
    titre: 'L’amour lui-même vous désire',
    verset: '« Allons vers le Cœur du Christ, le centre de son être qui est une ' +
            'fournaise ardente d’amour divin et humain et qui est la plus grande ' +
            'plénitude que l’homme puisse atteindre. C’est là, dans ce Cœur, que nous ' +
            'nous reconnaissons finalement nous-mêmes et que nous apprenons à aimer. »',
    source: 'Lettre encyclique du pape François sur l’amour humain et divin du Cœur de Jésus-Christ',
    origine:    'Parole du pape François',
    meditation: [
      'Le pape vient nous visiter et porter la Parole de Dieu dans notre diocèse. ' +
      'Pourtant, notre vie quotidienne, bien souvent agitée et dispersée, peine à être ' +
      'disponible pour cette Parole – qui nous aide à construire nos vies sur du ' +
      'solide. Cette dispersion nous éloigne du centre de nous-mêmes, de notre cœur, ' +
      'de cet espace intime où, devant le Seigneur, nous sommes nous-mêmes, tels ' +
      'qu’il nous appelle à être.',

      '« Tout s’unifie dans le cœur qui peut être le siège de l’amour […] En ' +
      'définitive, si l’amour y règne [dans le cœur], la personne réalise son identité ' +
      'de manière pleine et lumineuse, car tout être humain a été créé avant tout pour ' +
      'l’amour, il est fait dans ses fibres les plus profondes pour aimer et être aimé. »',

      'Que le Seigneur donne à chacun de découvrir en lui cette source de l’amour. ' +
      'C’est sur cette base sûre qu’un avenir peut se construire pour chacun et pour ' +
      'nous tous ensemble.'
    ],
    musique: 'L’Amour lui-même vous désire — Emmanuel Music',
    // Les paroles suivent l’enregistrement, où le refrain revient trois
    // fois. Trois fautes de transcription ne sont pas recopiées : la voix
    // dit bien 1 Jean 4, 7-8 — « aimons-nous les uns les autres », « celui
    // qui aime est né de Dieu », « car Dieu est amour ».
    paroles: [
      'Voici le corps et le sang de Jésus,',
      'adorez-le, bénissez-le,',
      'car en lui c’est Dieu qui se donne à vous.',
      '',
      'L’Amour lui-même vous désire.',
      '',
      'Bien-aimés, aimons-nous les uns les autres,',
      'puisque l’amour vient de Dieu.',
      'Celui qui aime est né de Dieu et connaît Dieu.',
      'Celui qui n’aime pas n’a pas connu Dieu,',
      'car Dieu est amour.',
      '',
      'Voici le corps et le sang de Jésus,',
      'adorez-le, bénissez-le,',
      'car en lui c’est Dieu qui se donne à vous.',
      '',
      'Bénissez-le, bénissez-le,',
      'car en lui c’est Dieu qui se donne à vous.',
      '',
      'L’Amour lui-même vous désire.'
    ],
    priere: [
      'Pour tous ceux qui cherchent comment construire leur vie.',
      '— Cœur de Jésus, ouvre-leur un avenir.',

      'Pour les jeunes qui cherchent quoi faire de leur vie, qu’ils découvrent ce qui ' +
      'donne sens à leur vie, qu’ils découvrent qu’ils sont aimés par le Seigneur d’un ' +
      'amour qui laisse et rend libre. Qu’ils puissent découvrir qu’ils sont appelés ' +
      'par le Seigneur et que cet appel les fait devenir davantage eux-mêmes.',
      '— Cœur de Jésus, ouvre-leur un avenir.',

      'Pour ceux qui n’ont pas de papiers et qui cherchent une solidité sur laquelle ' +
      'construire leur avenir. Pour ceux qui sont en grande précarité. Qu’ils puissent ' +
      'découvrir que le Seigneur habite leur cœur. Qu’ils puissent rencontrer des ' +
      'personnes qui ont du cœur et fassent un bout du chemin avec eux.',
      '— Cœur de Jésus, ouvre-leur un avenir.',

      'Pour ceux qui sont désespérés.',
      '— Cœur de Jésus, ouvre-leur un avenir.',

      'Pour ceux qui cherchent à aimer.',
      '— Cœur de Jésus, ouvre-leur un avenir.'
    ],
    lecteur: 'Anna',
    audio: 'assets/audio/jour-1.mp3?v=5',
    sync: 'assets/audio/jour-1.sync.js?v=4',
    chapitres: { meditation: 10, chant: 126.56, prions: 274.83, prieres: 352.55, envoi: 483.11 }
  },

  /* ---------------------------------------------------------------- 2 --- */
  2: {
    titre: 'Cœur miséricordieux',
    verset: '« Saisi de compassion, le maître de ce serviteur le laissa partir et lui ' +
            'remit sa dette. »',
    source: 'Matthieu 18, 27',
    meditation: [
      'Pourquoi ne grandissons-nous pas en compassion ? Telle est la question que nous ' +
      'pose la célèbre parabole dite du « débiteur insolvable ». L’attitude du ' +
      'serviteur vis-à-vis de son compagnon est à la fois bouleversante et attristante. ' +
      'Le serviteur se montre impitoyable envers son compagnon qui ne lui doit que cent ' +
      'pièces d’argent. Pourtant le maître vient lui remettre une dette de soixante ' +
      'millions de pièces d’argent.',

      'Le serviteur ne grandit pas en compassion. Il se focalise sur lui-même : ses ' +
      'difficultés, ses soucis, ses peurs et ses projets. Pour atteindre les objectifs ' +
      'qu’il s’est fixés, il lui faut absolument l’argent que lui doit son compagnon. ' +
      'De ce fait, le cœur du serviteur est imperméable à la souffrance du prochain, à ' +
      'ses supplications et à ses cris de détresse.',

      'Pour grandir en compassion, nous devons sortir de l’enfermement causé par nos ' +
      'problèmes et nos appréhensions afin de nous laisser atteindre et ébranler par la ' +
      'souffrance des autres. Pour grandir en compassion, il nous faut apprendre à nous ' +
      'mettre à la place des autres et à réfléchir à partir de leur point de vue. Pour ' +
      'grandir en compassion, il faut voir tout homme comme un frère et toute femme ' +
      'comme une sœur. Seigneur, aide-nous à grandir en compassion.'
    ],
    priere: [
      'Dieu notre Père, ouvre nos yeux pour qu’ils voient la pauvreté autour de nous. ' +
      'Donne-nous un cœur de chair pour que nous ne soyons pas indifférents aux ' +
      'malheurs qui frappent le prochain.',

      'Remplis-nous du courage de salir nos mains pour l’aider. Fais-nous don d’une ' +
      'charité si forte que nous osions risquer notre vie pour secourir et aider ceux ' +
      'que la misère humilie et que la précarité déshumanise.'
    ],
    musique:    'Psaume 77 — « N’oubliez pas les exploits du Seigneur »',
    paroles: [
      'N’oubliez pas les exploits du Seigneur !',
      '',
      'Nous avons entendu et nous savons',
      'ce que nos pères nous ont raconté ;',
      'nous redirons à l’âge qui vient',
      'les titres de gloire du Seigneur.',
      '',
      'Quand Dieu les frappait, ils le cherchaient,',
      'ils revenaient et se tournaient vers lui :',
      'ils se souvenaient que Dieu est leur rocher,',
      'et le Dieu Très-Haut, leur rédempteur.',
      '',
      'N’oubliez pas les exploits du Seigneur !',
      '',
      'Mais de leur bouche ils le trompaient,',
      'de leur langue ils lui mentaient.',
      'Leur cœur n’était pas constant envers lui ;',
      'ils n’étaient pas fidèles à son alliance.',
      '',
      'Et lui, miséricordieux,',
      'au lieu de détruire, il pardonnait.',
      'Il se rappelait : ils ne sont que chair,',
      'un souffle qui s’en va sans retour',
      '',
      'N’oubliez pas les exploits du Seigneur !'
    ],
    lecteur: 'Ludivine',
    audio: 'assets/audio/jour-2.mp3?v=3',
    sync: 'assets/audio/jour-2.sync.js?v=9',
    chapitres: { meditation: 6.82, chant: 132.42, prions: 245.57, prieres: 279.8, envoi: 410.36 }
  },

  /* ---------------------------------------------------------------- 3 --- */
  3: {
    titre: 'La fidélité',
    verset: '« Demeurez en moi, comme moi en vous. De même que le sarment ne peut pas ' +
            'porter de fruit par lui-même s’il ne demeure pas sur la vigne, de même ' +
            'vous non plus, si vous ne demeurez pas en moi. Moi, je suis la vigne, et ' +
            'vous, les sarments. Celui qui demeure en moi et en qui je demeure, ' +
            'celui-là porte beaucoup de fruit, car, en dehors de moi, vous ne pouvez ' +
            'rien faire. »',
    source: 'Jean 15, 4-5',
    meditation: [
      'La Vie passe de la vigne aux sarments. Séparé de la vigne, le sarment ne peut ' +
      'porter de fruit. C’est en demeurant unis au Christ que nous recevons de lui la ' +
      'force d’aimer et de porter du fruit.',

      'Le Seigneur nous invite à nous laisser transformer par Son Amour. Mais comment ' +
      'demeurer dans Son Amour ?',

      'Jésus nous a montré le chemin tout au long de sa vie terrestre : une vie remplie ' +
      'd’Amour, pour Son Père et pour chacun de nous.',

      'Fortifiés par cet Amour, nous pouvons à notre tour en témoigner auprès de nos ' +
      'frères. « Mon commandement, le voici : Aimez-vous les uns les autres comme je ' +
      'vous ai aimés. » Jean 15, 12'
    ],
    intention: 'À l’orée de la venue du Saint-Père parmi nous, tournons-nous vers le ' +
               'Sacré-Cœur de Jésus afin que, imprégnés de son Amour, nous puissions, ' +
               'où que nous soyons, manifester les fruits de cet Amour dans l’Église ' +
               'et dans le monde qui en a tant besoin.',
    priere: [
      'Seigneur, fais de moi un instrument de Paix.',

      'Là où est la haine, que je mette l’amour. Là où est l’offense, que je mette le ' +
      'pardon. Là où est la discorde, que je mette l’union. Là où est l’erreur, que je ' +
      'mette la vérité. Là où est le doute, que je mette la foi. Là où est le ' +
      'désespoir, que je mette l’espérance. Là où sont les ténèbres, que je mette la ' +
      'lumière. Là où est la tristesse, que je mette la joie.',

      'Ô Seigneur, que je ne cherche pas tant à être consolé qu’à consoler, à être ' +
      'compris qu’à comprendre, à être aimé qu’à aimer. Car c’est en se donnant qu’on ' +
      'reçoit, c’est en s’oubliant qu’on se retrouve, c’est en pardonnant qu’on est ' +
      'pardonné, c’est en mourant qu’on ressuscite à l’éternelle vie.'
    ],
    lecteur: 'Romain',
    musique:    'Rappelle-toi ! Tu es sauvé — Fraternité de Tibériade',
    paroles: [
      'Je connais ta constance et tes labeurs,',
      'Tu as beaucoup souffert en mon nom.',
      'Pourquoi as-tu perdu ton amour des premiers temps ?',
      'Rappelle-toi ! Tu es sauvé, reviens à moi.',
      'Je te ferai goûter à l’arbre de vie.',
      '',
      'Je connais ta détresse et ta pauvreté,',
      'Sois sans peur si tu vis la souffrance.',
      'Pourquoi t’éloignes-tu quand vient le temps de l’épreuve ?',
      'Rappelle-toi ! Tu es sauvé, reviens à moi.',
      'Je t’offrirai la couronne de la vie.',
      '',
      'Je connais ta foi en moi et mon amour,',
      'Sois fort, je viens à toi sans tarder.',
      'Pourquoi tourner ton regard et ta vie vers d’autres dieux ?',
      'Rappelle-toi ! Tu es sauvé, reviens à moi.',
      'Je t’offrirai un nom connu de toi seul.'
    ],
    audio: 'assets/audio/jour-3.mp3?v=5',
    sync: 'assets/audio/jour-3.sync.js?v=6',
    chapitres: { meditation: 5.02, chant: 109.24, prions: 240.94, prieres: 313.29, envoi: 443.85 }
  },

  /* ---------------------------------------------------------------- 4 --- */
  4: {
    titre: 'La charité',
    verset: [
      '« Que rien ne te trouble,',
      'que rien ne t’épouvante.',
      'Tout passe,',
      'Dieu ne change pas.',
      'La patience triomphe de tout.',
      'Celui qui possède Dieu',
      'ne manque de rien.',
      'Dieu seul suffit ! »'
    ],
    source: 'Sainte Thérèse d’Avila',
    origine:    'Parole de sainte Thérèse d’Avila',
    meditation: [
      'Nous allons au Sacré-Cœur de Jésus avec sainte Thérèse d’Avila, véritable ' +
      'maîtresse de vie chrétienne pour les fidèles de chaque temps, disait Benoît XVI.',

      'Dans les moments d’agitations extérieures et intérieures, sainte Thérèse ' +
      'd’Avila nous invite à un recueillement intérieur qui ne consiste pas à être ' +
      'spectateur de la situation mais à prendre appui sur Dieu pour avancer.',

      'Prier, dit-elle, « signifie fréquenter avec amitié, car nous fréquentons en tête ' +
      'à tête Celui qui, nous le savons, nous aime ». Jésus, par son Cœur sacré brûlant ' +
      'd’amour, nous attend aujourd’hui encore pour répandre, avec nous, ce qu’il veut ' +
      'pour l’humanité entière : la vie.'
    ],
    priere: [
      'À l’ère des réseaux sociaux, du nombre de likes et du nombre de vues, nous ' +
      'oublions parfois que seul ton regard suffit.',

      'Lorsque nous nous mettons au service de nos frères, de nos paroisses, de nos ' +
      'quartiers, de notre Église :',

      'Apprends-nous, Seigneur, à grandir dans cette charité totalement désintéressée. ' +
      'Apprends-nous, Seigneur, à nous tourner vers celui que personne ne regarde. ' +
      'Apprends-nous, Seigneur, à aimer sans chercher à être vus, reconnus ou applaudis.',

      'Apprends-nous à regarder comme tu regardes, à aimer comme tu as aimé, à servir ' +
      'non pas en nous laissant guider par la chair mais par l’Esprit, et à donner sans ' +
      'attendre en retour.',

      'Car ton regard, Seigneur, nous suffit.'
    ],
    musique:    'Solo Dios basta ! — Fr. Jean-Baptiste du Jonchay',
    paroles: [
      'Que rien ne te trouble, ô mon âme,',
      'que rien ne t’épouvante, ô mon âme.',
      '',
      'Dieu seul suffit.',
      '',
      'Dieu ne change pas, ô mon âme,',
      'la patience obtient tout, ô mon âme.',
      '',
      'Dieu seul suffit.',
      '',
      'Qui possède Dieu, ô mon âme,',
      'ne manque de rien, ô mon âme.',
      '',
      'Dieu seul suffit.'
    ],
    lecteur: 'Anna',
    audio: 'assets/audio/jour-4.mp3?v=3',
    sync: 'assets/audio/jour-4.sync.js?v=3',
    chapitres: { meditation: 7.93, chant: 93.73, prions: 236.75, prieres: 303.49, envoi: 434.05 }
  },

  /* ---------------------------------------------------------------- 5 --- */
  5: {
    titre: 'L’unité',
    verset: '« Que tous soient un, comme toi, Père, tu es en moi, et moi en toi. Qu’ils ' +
            'soient un en nous, eux aussi, pour que le monde croie que tu m’as envoyé. »',
    source: 'Jean 17, 21',
    meditation: [
      'Dieu nous a donné un cœur fait pour aimer, s’émouvoir, se réjouir, capable de ' +
      'compatir envers celui ou celle qui est éprouvé. Notre cœur est fait pour désirer ' +
      'la vie. Et voici donc, aujourd’hui, la vie elle-même, le Christ, qui veut s’unir ' +
      'à nous pour que notre cœur ne soit pas seulement un réceptacle de la vie mais ' +
      'l’instrument qui la propage.',

      'Jésus partageait ses repas avec les personnes marginalisées, affirmant qu’il est ' +
      'venu appeler les malades et non les bien-portants. Il manifestait une compassion ' +
      'envers ceux considérés comme des parias de la société, en leur redonnant de la ' +
      'dignité. Il a résumé la déontologie relationnelle dans son commandement de ' +
      'l’amour, invitant à traiter autrui comme on voudrait être traité soi-même.',

      'Il se montrait sévère face à l’hypocrisie, au durcissement de cœur de ceux qui ' +
      'sommaient les autres de porter des fardeaux écrasants. Il offrait toujours une ' +
      'possibilité de relèvement et de rédemption, à l’image du pardon offert à la ' +
      'femme adultère plutôt que de la condamnation. Voici les attitudes que nous ' +
      'montre Jésus et auxquelles il nous invite, nous qui recherchons l’unité, pour ' +
      'que nous soyons véritablement un en lui.'
    ],
    priere: [
      'Seigneur, en ce jour de la neuvaine à ton Cœur sacré, donne-nous de voir en ' +
      'l’autre un frère, une sœur, à aimer. Apprends-nous à le faire humblement, ' +
      'simplement et véritablement.',

      'À l’occasion de la visite de ton serviteur, le pape Léon XIV, en France et ' +
      'particulièrement en Seine-Saint-Denis, nous te confions les chrétiens et tous ' +
      'les habitants de ce pays. Fais grandir en nous le désir de la vie et de l’unité ' +
      'pour que nous la répandions au monde entier. Amen.'
    ],
    lecteur: 'Ludivine',
    musique:    'Père, qu’ils soient un',
    paroles: [
      'Père, qu’ils soient un,',
      'pour que le monde croie que Tu m’as envoyé !',
      '',
      'Père, qu’ils soient un,',
      'pour que le monde croie que Tu m’as envoyé !'
    ],
    audio: 'assets/audio/jour-5.mp3?v=3',
    sync: 'assets/audio/jour-5.sync.js?v=3',
    chapitres: { meditation: 6.62, chant: 122.53, prions: 179.03, prieres: 226.35, envoi: 356.92 }
  },

  /* ---------------------------------------------------------------- 6 --- */
  6: {
    titre: 'Accueil de l’étranger',
    verset: '« Tout immigré qui frappe à notre porte est une occasion de rencontre avec ' +
            'Jésus Christ, qui s’identifie à l’étranger de toute époque, accueilli ou ' +
            'rejeté. »',
    source: 'Message du pape François pour la Journée mondiale du migrant et du réfugié',
    origine:    'Parole du pape François',
    meditation: [
      'En ces périodes plus que troublantes pour l’Humanité, le Christ nous appelle ' +
      'inlassablement à revenir à l’essentiel : l’accueillir, Lui. Le recevoir, c’est ' +
      'embrasser l’Amour miséricordieux qui rayonne de son Sacré-Cœur, qui dépasse ' +
      'l’entendement humain et qui n’a pas de frontière à part celle que l’homme ne ' +
      'cesse d’ériger dans son propre cœur.',

      'Notre rédempteur nous rappelle que, d’une manière ou d’une autre, chacun de nous ' +
      'est un étranger dans ce monde. Et si nous respections et accueillions l’autre ' +
      'comme nous-mêmes voudrions l’être, alors nous ferions tomber les velléités et ' +
      'les formes d’égoïsme qui s’enracinent ici et là dans ce monde. Essayons de nous ' +
      'laisser guider par l’idée d’une manière saine, équilibrée et plurielle de vivre ' +
      'ensemble sur une terre qui nous a été si gracieusement offerte par notre créateur.',

      'Rappelons-nous que le Christ a vaincu par amour pour nous toutes les formes du ' +
      'mal sur le bois, au calvaire. Aimer est le seul maître de tous les maux. ' +
      'Faut-il déjà désirer le conjuguer avec une confiance totale non pas en soi mais ' +
      'en lui, Jésus notre maître.'
    ],
    priere: [
      'Seigneur, en ce jour de la neuvaine à ton Cœur sacré, aide-nous à maintenir ' +
      'notre regard fixé sur ta croix glorieuse, qui s’élèvera toujours plus haut pour ' +
      'montrer à quel point aimer est le chemin qui mène à la vraie liberté.',

      'Accompagnés par Maman Marie, laissons-nous entraîner chaque jour à marcher à sa ' +
      'suite pour que nous puissions être un instrument dont les seules notes sont ' +
      'jouées par toi. Ainsi, nous serons assurés de cette belle mélodie qui n’est pas ' +
      'une utopie mais bien une promesse du bonheur à vivre ensemble par sa grâce ' +
      'éternelle.',

      'Que la venue du pape Léon XIV permette de fortifier la foi des catholiques, en ' +
      'continuant à révéler le message d’Amour sans conditions du Christ à notre égard, ' +
      'dans son identité propre qui ne se trouve qu’en Dieu. Amen.'
    ],
    lecteur: 'Romain',
    musique:    'Si le bon Dieu — John Littleton',
    paroles: [
      'Si le bon Dieu venait revivre sa peine,',
      'Il aurait les yeux d’un enfant noir de Harlem.',
      'Des églises « Blanches » se fermeraient devant lui,',
      'Des écoles « Blanches » on le chasserait aussi.',
      '',
      'Si le bon Dieu revenait vivre chez nous,',
      'Il aurait les yeux brûlants de fièvre d’un Hindou.',
      'Sur sa terre ingrate,',
      'Il travaillerait sans gémir,',
      'Et puis sur sa natte se coucherait pour mourir…',
      '',
      'Si le bon Dieu revenait sauver nos âmes,',
      'Il aurait les yeux d’un orphelin du Viet-Nam.',
      'Des milliers de bombes écraseraient son pays,',
      'Seul, au cœur du monde, Il lutterait sans merci.'
    ],
    audio: 'assets/audio/jour-6.mp3?v=4',
    sync: 'assets/audio/jour-6.sync.js?v=9',
    chapitres: { meditation: 5.08, chant: 105.74, prions: 256.24, prieres: 322.87, envoi: 453.43 }
  },

  /* ---------------------------------------------------------------- 7 --- */
  7: {
    titre: 'La bonté de Dieu',
    verset: '« Moi, je suis le pain vivant, qui est descendu du ciel. Si quelqu’un ' +
            'mange de ce pain, il vivra éternellement. »',
    source: 'Jean 6, 51',
    meditation: [
      'Jésus nous révèle un Dieu qui ne se résigne jamais à la mort, au découragement ' +
      'ou au désespoir. Son Cœur est un Cœur vivant, brûlant d’amour pour chacun de ses ' +
      'enfants. En lui, même lorsque tout semble fragile, une vie nouvelle peut ' +
      'toujours commencer.',

      'L’espérance chrétienne n’est pas l’attente passive d’un avenir meilleur. Elle ' +
      'est la confiance en Celui qui marche avec nous et qui demeure présent au cœur de ' +
      'nos vies. Elle nous permet de regarder autrement notre monde, nos quartiers, nos ' +
      'familles et notre Église.',

      'Dans notre diocèse de Seine-Saint-Denis, tant de situations peuvent parfois ' +
      'donner le sentiment que l’avenir est incertain : difficultés sociales, ' +
      'précarité, solitude, violence, inquiétude face à l’avenir, mais aussi tant de ' +
      'jeunes qui cherchent leur chemin et tant de familles qui espèrent une vie ' +
      'meilleure. Pourtant, au milieu de ces réalités, Dieu fait déjà germer des signes ' +
      'd’espérance.',

      'Il y a des femmes et des hommes qui donnent de leur temps dans le domaine ' +
      'associatif ou en Église. Il y a des jeunes qui s’engagent. Il y a des ' +
      'communautés qui accueillent, des familles qui transmettent la foi, des chrétiens ' +
      'qui prient et servent leurs frères. Il y a aussi tous ceux qui, parfois sans ' +
      'grands moyens, choisissent simplement de ne pas renoncer à l’autre.',

      'Le Sacré-Cœur nous invite aujourd’hui à regarder ces signes et à devenir ' +
      'nous-mêmes des artisans d’espérance. La venue du pape Léon XIV dans notre ' +
      'diocèse peut être accueillie comme un encouragement à avancer ensemble. Sa ' +
      'présence parmi nous nous rappelle que l’Église est appelée à être, au cœur du ' +
      'monde, un peuple qui espère et qui témoigne de la vie reçue du Christ.',

      'Demandons au Seigneur de renouveler notre regard. Là où nous voyons un obstacle, ' +
      'apprends-nous à discerner un chemin. Là où nous voyons la fragilité, ' +
      'apprends-nous à reconnaître une présence. Là où nous rencontrons le ' +
      'découragement, fais de nous des témoins de ton espérance.',

      'Car le Cœur du Christ ne cesse de nous redire que la vie est plus forte que la ' +
      'mort, que l’amour est plus fort que la haine et que la lumière peut toujours ' +
      'resurgir dans les ténèbres.'
    ],
    priere: [
      'En ce jour, nous prions pour tous les habitants de la Seine-Saint-Denis, ' +
      'particulièrement ceux qui connaissent la précarité, la solitude, les épreuves ou ' +
      'l’inquiétude face à l’avenir.',

      'Nous confions au Sacré-Cœur les jeunes de notre diocèse, leurs rêves, leurs ' +
      'projets et leurs questions. Que personne ne se sente oublié ou condamné à un ' +
      'avenir qu’il n’a pas choisi.',

      'Nous prions également pour la venue du pape Léon XIV parmi nous. Que cette ' +
      'rencontre soit pour notre diocèse un temps de grâce, d’unité, d’amour et de ' +
      'renouvellement, et qu’elle ravive en chacun la joie d’être disciple du Christ. ' +
      'Amen.'
    ],
    lecteur: 'Anna',
    paroles: [
      'Seigneur je t’aime',
      'Ta bonté ne faillit jamais',
      'Chaque jour',
      'Tu me tiens dans tes mains',
      'Dès le moment où je m’éveille',
      'Et jusqu’à mon coucher',
      'Je chanterai',
      'Combien mon Dieu est bon',
      '',
      'Tu as toujours été fidèle',
      'Tu as toujours été là pour moi',
      'Avec le souffle qui m’est donné',
      'Je chanterai combien mon Dieu est bon',
      '',
      'J’aime Ta voix',
      'Et quand je traverse le feu',
      'Tu es mon guide',
      'Tu restes au plus près de moi',
      'J’ai compris qui tu étais',
      'Mon Père et mon ami',
      'J’ai découvert',
      'Combien mon Dieu est bon',
      '',
      'Tu as toujours été fidèle',
      'Tu as toujours été là pour moi',
      'Avec le souffle qui m’est donné',
      'Je chanterai combien mon Dieu est bon'
    ],
    audio: 'assets/audio/jour-7.mp3?v=3',
    sync: 'assets/audio/jour-7.sync.js?v=3',
    chapitres: { meditation: 7.77, chant: 216.32, prions: 366.82, prieres: 420.44, envoi: 551.0 }
  },

  /* ---------------------------------------------------------------- 8 --- */
  8: {
    titre: 'Le commandement nouveau',
    verset: '« Aimez-vous les uns les autres comme je vous ai aimés. »',
    source: 'Jean 15, 12',
    intention: 'Seigneur Jésus, nous nous tournons vers toi. Apprends-nous à regarder ' +
               'chaque personne comme un frère ou une sœur, à accueillir les ' +
               'différences et à construire avec tous une Église vivante et fraternelle.',
    meditation: [
      'Saint-Denis est une terre de rencontres. Dans notre diocèse, des personnes ' +
      'd’origines, de cultures, d’âges et de parcours différents se côtoient chaque ' +
      'jour. Cette diversité peut parfois sembler être une difficulté. Mais à la ' +
      'lumière de l’Évangile, elle peut devenir une richesse.',

      'Jésus ne nous demande pas de nous ressembler pour nous aimer. Il nous demande de ' +
      'nous accueillir.',

      'La fraternité chrétienne commence lorsque nous acceptons de faire le premier ' +
      'pas : un sourire, une parole, une écoute, une main tendue.',

      'En France, particulièrement en Seine-Saint-Denis, nous sommes appelés à être une ' +
      'Église qui ne ferme pas ses portes, mais qui accueille, rassemble et fait ' +
      'grandir l’espérance.',

      'À l’image de saint Denis, témoin de la foi jusqu’au don de sa vie, demandons au ' +
      'Seigneur de faire de notre diocèse une communauté profondément fraternelle, où ' +
      'chacun puisse trouver sa place.',

      'Prenons quelques instants de silence et confions au Seigneur une personne avec ' +
      'laquelle nous sommes appelés à vivre davantage la fraternité.'
    ],
    priere: [
      'Seigneur Jésus, aujourd’hui, nous te confions particulièrement la venue du pape ' +
      'dans notre diocèse. Prépare les cœurs à cette rencontre. Que sa venue soit un ' +
      'temps de joie, d’unité et de communion pour notre Église. Que cette visite ' +
      'permette à chacun de se sentir davantage membre de la grande famille de Dieu.',

      'Nous te confions notre diocèse de Saint-Denis, ses paroisses, ses prêtres, ses ' +
      'consacrés, ses familles, ses jeunes et toutes les personnes qui y vivent. ' +
      'Seigneur, fais de nous des bâtisseurs de fraternité.',

      'Seigneur Jésus, toi qui nous appelles à vivre comme des frères et des sœurs, ' +
      'viens transformer nos cœurs. Apprends-nous à dépasser nos différences, à ' +
      'pardonner, à écouter avant de juger, à accueillir celui qui est différent et à ' +
      'reconnaître ta présence dans chaque personne.',

      'Que notre diocèse soit une maison ouverte, une communauté où personne ne se ' +
      'sente oublié ou rejeté. Que la venue du pape soit pour nous une occasion de ' +
      'renouveler notre foi, notre espérance et notre amour de l’Église. Amen.'
    ],
    lecteur: 'Ludivine',
    musique:    'L’Amour jamais ne passera — Communauté de l’Emmanuel',
    paroles: [
      'L’Amour jamais ne passera,',
      'L’Amour demeurera,',
      'L’Amour, l’amour seul,',
      'La charité jamais ne passera,',
      'Car Dieu est Amour.',
      '',
      'Quand j’aurais le don de la science,',
      'Et connaîtrais tous les mystères,',
      'Parlerais-je les langues des anges,',
      'Sans amour, je ne suis rien.',
      '',
      'L’Amour jamais ne passera,',
      'L’Amour demeurera,',
      'L’Amour, l’amour seul,',
      'La charité jamais ne passera,',
      'Car Dieu est Amour.'
    ],
    audio: 'assets/audio/jour-8.mp3?v=5',
    sync: 'assets/audio/jour-8.sync.js?v=6',
    chapitres: { meditation: 8.11, chant: 137.81, prions: 220.25, prieres: 311.76, envoi: 442.32 },
    intentionAvant: true
  },

  /* ---------------------------------------------------------------- 9 --- */
  9: {
    titre: 'Le bon berger',
    verset: '« Seigneur, toi, tu sais tout : tu sais bien que je t’aime. » Jésus lui ' +
            'dit : « Sois le berger de mes brebis. »',
    source: 'Jean 21, 17',
    meditation: [
      'En parcourant des ressources pour préparer cette méditation, le mouvement ' +
      'apostolique Regnum Christi nous éclaire sur ce passage en précisant que la ' +
      'troisième demande de Jésus à Simon correspond à un amour dit « philia » en grec, ' +
      'et là c’est un amour qui vient du cœur, qui jaillit du plus profond de notre ' +
      'être, un amour affectif prêt à tout donner pour la personne que l’on aime.',

      'Après chaque « déclaration d’amour » de Pierre, Jésus va lui dévoiler sa double ' +
      'mission : celle de conduire et de veiller sur le troupeau, et celle de lui ' +
      'enseigner la Parole de Dieu. Jésus veut montrer à Pierre que, malgré son péché ' +
      'et sa fragilité, il lui confie une très grande mission. Jésus va lui promettre ' +
      'de toujours être à ses côtés par le don du Saint-Esprit et de le guider dans ' +
      'chacun de ses pas. Il montre à Pierre ce qu’est le véritable amour : se laisser ' +
      'faire et entrer dans cette docilité des enfants de Dieu.',

      'Chaque jour que le Seigneur nous accorde est une grâce. Si de tout cœur et avec ' +
      'foi nous lui confions chacun de nos jours, alors il nous donne sa vie, son ' +
      'énergie et sa force. Ainsi, nous pouvons vivre chaque instant à son image, image ' +
      'qui reflète l’amour et la fraternité dont nos territoires ont tant besoin. Son ' +
      'Sacré-Cœur demeure la source de tout.'
    ],
    priere: [
      'Seigneur, nous te confions ton Église en France, particulièrement en ' +
      'Seine-Saint-Denis, qui accueille ton serviteur, le pape Léon XIV, successeur de ' +
      'Pierre, pour son voyage apostolique dans notre pays à partir de demain.',

      'Que son message trouve en nous un terrain fertile, propice à l’accueil, et ' +
      'qu’il porte de beaux fruits au-delà de nos frontières.',

      'Que nos cœurs, unis au tien, exultent en voyant ton œuvre à travers notre ' +
      'prochain. Apprends-nous à compatir envers les autres, à pardonner et à aimer.',

      'Fais grandir en nous la confiance en l’amour, toi qui veilles sur ceux qui ' +
      'espèrent en Toi, et à qui rien ne peut manquer quand on attend de Toi toute ' +
      'chose. Aujourd’hui, nous avons résolu de vivre désormais sans aucun souci et de ' +
      'nous décharger sur Toi de toutes nos inquiétudes.',

      'Conduis-nous à toi, Seigneur, et si nous venons à tomber sur le chemin, ' +
      'prends-nous par la main afin que nous puissions continuer à avancer, le regard ' +
      'fixé sur toi. Amen.'
    ],
    lecteur: 'Romain',
    musique:    'Rends-nous la joie d’être sauvés — Marc Dannaud, Emmanuel Music',
    paroles: [
      'Voici le temps de Dieu,',
      'Ce moment consacré,',
      'Allons à sa rencontre,',
      'Entrons en sa présence.',
      'Quarante jours durant,',
      'D’un pas vif et joyeux,',
      'Marchons sur ses chemins,',
      'Dans l’unité.',
      '',
      'Rends-nous la joie',
      'D’être sauvés',
      'Et nos lèvres publieront',
      'Ta louange.',
      'Raffermis nos pas,',
      'Viens nous recréer,',
      'Mets en nous, Seigneur,',
      'Un cœur nouveau !',
      '',
      'Guidés par son Esprit,',
      'Nous irons au désert,',
      'Pour écouter sa voix',
      'Au creux de nos silences.',
      'Nous laisserons les biens',
      'Qui captivent nos cœurs',
      'Pour vivre l’essentiel :',
      'Dieu seul suffit.',
      '',
      'Rends-nous la joie',
      'D’être sauvés',
      'Et nos lèvres publieront',
      'Ta louange.',
      'Raffermis nos pas,',
      'Viens nous recréer,',
      'Mets en nous, Seigneur,',
      'Un cœur nouveau !',
      '',
      'Rends-nous la joie',
      'D’être sauvés',
      'Et nos lèvres publieront',
      'Ta louange.',
      'Raffermis nos pas,',
      'Viens nous recréer,',
      'Mets en nous, Seigneur,',
      'Un cœur nouveau !'
    ],
    // Le neuvième jour se termine sur une invitation dite à la voix mais
    // absente de la page : sans elle, la date se perd avec l'enregistrement.
    rendezvous: {
      titre:   'Après la neuvaine',
      quand:   'Dimanche 11 octobre 2026, à 15h30',
      lieu:    'Église Saint-Denis de l’Estrée',
      adresse: '53 bis boulevard Jules Guesde, 93200 Saint-Denis',
      quoi:    'Louange, adoration eucharistique, prière des frères et enseignement.'
    },
    audio: 'assets/audio/jour-9.mp3?v=3',
    sync: 'assets/audio/jour-9.sync.js?v=2',
    chapitres: { meditation: 5.76, chant: 122.72, prions: 273.22, prieres: 360.98, envoi: 491.54 }
  }
};
