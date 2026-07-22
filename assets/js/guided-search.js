/**
 * Recherche guidée — « Trouvez ce qu'il vous faut en quelques clics ».
 * Assistant en une question par écran : le scénario vit dans
 * data/guided-search.json, les recommandations sont calculées localement
 * par simple correspondance avec les fichiers JSON du site.
 *
 * Architecture prête pour la suite : remplacer computeResults() par un
 * appel à une API de recherche / recommandation / IA (APP_CONFIG.api)
 * sans toucher au déroulé des questions ni à l'affichage.
 *
 * Les réponses ne contiennent aucune donnée personnelle et ne sont
 * conservées que le temps de la navigation (sessionStorage).
 */
(function () {
  "use strict";

  var STATE_KEY = "ss_gs_reponses";
  var state = { stepId: null, answers: {}, labels: {}, history: [] };
  var quiz = null;
  var root = null;      /* conteneur de rendu (modale ou pleine page) */
  var dialog = null;    /* la modale, si le quiz est ouvert en panneau */

  /* Correspondances ville → mots-clés dans les données. */
  var CITY_KEYWORDS = {
    "paris": ["paris"],
    "lyon": ["lyon"],
    "marseille": ["marseille"],
    "nantes": ["nantes", "sainte-aveline", "rennes"],
    "bordeaux": ["bordeaux"],
    "toulouse": ["toulouse"],
    "ouest": ["nantes", "rennes", "sainte-aveline"],
    "strasbourg": ["strasbourg"],
    "tours": ["tours"]
  };

  var CATEGORY_LABELS = {
    "secretaire-administrative": "Secrétariat administratif",
    "secretaire-medicale": "Secrétariat médical",
    "secretaire-juridique": "Secrétariat juridique",
    "assistant-direction": "Assistanat de direction",
    "assistant-commercial": "Assistanat commercial",
    "assistant-comptable": "Assistanat comptable",
    "assistant-rh": "Assistanat RH",
    "assistant-administratif": "Assistanat de gestion",
    "office-manager": "Office management",
    "telesecretaire": "Télésecrétariat"
  };

  document.addEventListener("DOMContentLoaded", function () {
    var inline = document.getElementById("guided-search-inline");
    var openers = document.querySelectorAll("[data-guided-search-open]");
    if (!inline && !openers.length) { return; }

    restoreState();

    if (inline) {
      root = inline;
      start();
    }

    if (openers.length) {
      if (!inline) { injectModal(); }
      openers.forEach(function (btn) {
        btn.addEventListener("click", function (event) {
          /* Sans JavaScript, le lien mène à recherche-guidee.html. */
          if (dialog) {
            event.preventDefault();
            SS.openModal(dialog);
            start();
          }
        });
      });
    }
  });

  function injectModal() {
    var wrapper = document.createElement("div");
    wrapper.innerHTML =
      '<dialog class="modal gs-modal" id="gs-modal" aria-labelledby="gs-modal-title">' +
        '<div class="modal-header">' +
          '<div><h2 id="gs-modal-title">Recherche guidée</h2>' +
          '<p class="text-muted">Quelques questions, des suggestions immédiates.</p></div>' +
          '<button type="button" class="modal-close" data-close-modal aria-label="Quitter la recherche guidée">✕</button>' +
        "</div>" +
        '<div class="modal-body"><div id="gs-modal-root"></div></div>' +
      "</dialog>";
    document.body.appendChild(wrapper.firstChild);
    dialog = document.getElementById("gs-modal");
    root = document.getElementById("gs-modal-root");
  }

  /* ---- État de session (réponses conservées pendant la navigation) ---- */
  function saveState() {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) { /* session indisponible : le quiz reste utilisable */ }
  }

  function restoreState() {
    try {
      var raw = sessionStorage.getItem(STATE_KEY);
      if (raw) { state = JSON.parse(raw); }
    } catch (e) { /* on repart de zéro */ }
  }

  function resetState() {
    state = { stepId: null, answers: {}, labels: {}, history: [] };
    saveState();
  }

  /* ---- Déroulé ---- */
  function start() {
    SS.loadJSON(APP_CONFIG.data.guidedSearch).then(function (data) {
      quiz = data;
      if (!state.stepId || (!quiz.steps[state.stepId] && state.stepId !== "results")) {
        resetState();
        state.stepId = quiz.start;
      }
      if (state.stepId === "results") { showResults(); }
      else { renderStep(); }
    }).catch(function () { SS.dataError(root); });
  }

  function goTo(stepId) {
    state.history.push(state.stepId);
    state.stepId = stepId;
    saveState();
    if (stepId === "results") { showResults(); } else { renderStep(); }
  }

  function goBack() {
    if (!state.history.length) { return; }
    state.stepId = state.history.pop();
    saveState();
    if (state.stepId === "results") { showResults(); } else { renderStep(); }
  }

  function renderStep() {
    var step = quiz.steps[state.stepId];
    if (!step) { resetState(); state.stepId = quiz.start; step = quiz.steps[state.stepId]; }
    var e = SS.escapeHtml;

    var progress = "";
    if (step.flow) {
      var pct = Math.round(step.stepIndex / step.stepTotal * 100);
      progress =
        '<div class="gs-progress">' +
          '<span class="gs-progress__label">Question ' + step.stepIndex + " sur " + step.stepTotal + "</span>" +
          '<div class="gs-progress__bar" role="progressbar" aria-valuenow="' + step.stepIndex +
            '" aria-valuemin="0" aria-valuemax="' + step.stepTotal + '" aria-label="Progression">' +
            '<span style="width:' + pct + '%"></span>' +
          "</div>" +
        "</div>";
    }

    root.innerHTML =
      '<div class="gs-screen">' +
        progress +
        '<h3 class="gs-question" id="gs-question" tabindex="-1">' + e(step.question) + "</h3>" +
        (step.aide ? '<p class="gs-help">' + e(step.aide) + "</p>" : "") +
        '<div class="gs-options">' +
          step.options.map(function (option, index) {
            return '<button type="button" class="gs-option" data-index="' + index + '">' +
              e(option.label) + "</button>";
          }).join("") +
        "</div>" +
        '<div class="gs-footer">' +
          (state.history.length ? '<button type="button" class="btn btn-ghost btn-sm" data-gs-back>← Précédent</button>' : "<span></span>") +
          '<div class="gs-footer__right">' +
            (step.skippable ? '<button type="button" class="btn btn-ghost btn-sm" data-gs-skip>Passer cette question</button>' : "") +
            '<button type="button" class="btn btn-ghost btn-sm" data-gs-quit>Quitter</button>' +
          "</div>" +
        "</div>" +
      "</div>";

    bindScreen(step);
    focusQuestion();
  }

  function bindScreen(step) {
    root.querySelectorAll(".gs-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var option = step.options[Number(btn.getAttribute("data-index"))];
        if (step.key) {
          state.answers[step.key] = option.value;
          state.labels[step.key] = option.label;
        }
        goTo(option.next);
      });
    });
    var back = root.querySelector("[data-gs-back]");
    if (back) { back.addEventListener("click", goBack); }
    var skip = root.querySelector("[data-gs-skip]");
    if (skip) {
      skip.addEventListener("click", function () {
        /* Ignorer la question : aucune réponse enregistrée. */
        if (step.key) {
          delete state.answers[step.key];
          delete state.labels[step.key];
        }
        goTo(step.options[step.options.length - 1].next);
      });
    }
    var quit = root.querySelector("[data-gs-quit]");
    if (quit) { quit.addEventListener("click", quitQuiz); }
  }

  function quitQuiz() {
    if (dialog && dialog.open) { SS.closeModal(dialog); }
    else { window.location.href = "index.html"; }
  }

  function focusQuestion() {
    var q = root.querySelector("#gs-question, #gs-results-title");
    if (q) { q.focus({ preventScroll: root === document.getElementById("guided-search-inline") ? false : true }); }
  }

  /* =====================  RÉSULTATS  ===================== */

  function showResults() {
    root.innerHTML = '<div class="gs-screen"><p class="text-muted">Préparation de vos suggestions…</p></div>';
    Promise.all([
      SS.loadJSON(APP_CONFIG.data.offers),
      SS.loadJSON(APP_CONFIG.data.companies),
      SS.loadJSON(APP_CONFIG.data.savoirFaire),
      SS.loadJSON(APP_CONFIG.data.articles)
    ]).then(function (loaded) {
      var data = {
        offers: loaded[0].filter(function (o) { return o.statut === "active"; }),
        companies: loaded[1],
        knowhow: loaded[2],
        articles: loaded[3]
      };
      /* Point de branchement futur : déléguer ce calcul à une API. */
      var results = computeResults(state.answers, data);
      renderResults(results);
    }).catch(function () { SS.dataError(root); });
  }

  function cityMatch(value, text) {
    var keywords = CITY_KEYWORDS[value];
    if (!keywords) { return false; }
    var hay = (text || "").toLowerCase();
    return keywords.some(function (k) { return hay.indexOf(k) !== -1; });
  }

  function computeResults(a, data) {
    var besoin = a.besoin || "emploi";
    if (besoin === "emploi" && a.metier === "inconnu") { besoin = "decouverte"; }
    if (besoin === "inconnu") { besoin = "decouverte"; }
    switch (besoin) {
      case "entreprise": return resultsEntreprise(a, data);
      case "professionnel": return resultsProfessionnel(a, data);
      case "publier": return resultsPublier(a, data);
      case "savoirfaire": return resultsSavoirFaire(a, data);
      case "decouverte": return resultsDecouverte(a, data);
      default: return resultsEmploi(a, data, null);
    }
  }

  /* ---- Parcours emploi ---- */
  function resultsEmploi(a, data, suggestedCategories) {
    var categories = suggestedCategories ||
      (a.metier && a.metier !== "autre" && a.metier !== "inconnu" ? [a.metier] : []);

    var scored = data.offers.map(function (o) {
      var score = 1;
      if (categories.length) {
        var rank = categories.indexOf(o.categorie);
        if (rank === 0) { score += 4; }
        else if (rank > 0) { score += 3 - rank; }
        else { score -= 2; }
      }
      if (a.ville === "distance") {
        if (o.teletravail === "complet") { score += 3; }
      } else if (a.ville && a.ville !== "peu-importe") {
        if (cityMatch(a.ville, o.ville + " " + o.departement)) { score += 2; }
      }
      if (a.contrat && a.contrat !== "peu-importe" && o.contrat === a.contrat) { score += 2; }
      if (a.teletravail === "uniquement" && o.teletravail === "complet") { score += 3; }
      if (a.teletravail === "partiel" && o.teletravail !== "non") { score += 1; }
      if (a.teletravail === "uniquement" && o.teletravail !== "complet") { score -= 3; }
      return { item: o, score: score };
    }).sort(function (x, y) { return y.score - x.score; });

    var top = scored.filter(function (s) { return s.score > 1; }).map(function (s) { return s.item; });
    var relaxed = false;
    if (top.length < 3) {
      relaxed = top.length === 0;
      top = scored.map(function (s) { return s.item; });
    }
    var offers = top.slice(0, 3);

    /* Entreprises liées aux offres retenues. */
    var companyIds = [];
    top.forEach(function (o) {
      if (companyIds.indexOf(o.entrepriseId) === -1) { companyIds.push(o.entrepriseId); }
    });
    var companies = companyIds.slice(0, 2).map(function (id) {
      return data.companies.find(function (c) { return c.id === id; });
    }).filter(Boolean);

    var article = data.articles.find(function (ar) {
      return a.experience === "debutant" ? ar.id === "cv-secretaire-2026" : ar.id === "preparer-entretien-assistanat";
    }) || data.articles[0];

    /* Un métier voisin, à titre de piste supplémentaire. */
    var otherCategory = null;
    if (categories.length) {
      var counts = {};
      data.offers.forEach(function (o) {
        if (categories.indexOf(o.categorie) === -1) {
          counts[o.categorie] = (counts[o.categorie] || 0) + 1;
        }
      });
      otherCategory = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; })[0] || null;
    }

    var params = new URLSearchParams();
    if (categories[0]) { params.set("categorie", categories[0]); }
    if (a.ville && a.ville !== "peu-importe" && a.ville !== "distance" && CITY_KEYWORDS[a.ville]) {
      params.set("lieu", CITY_KEYWORDS[a.ville][0]);
    }

    return {
      titre: offers.length
        ? "Nous avons trouvé " + top.length + (top.length > 1 ? " offres qui pourraient vous correspondre" : " offre qui pourrait vous correspondre")
        : "Voici nos suggestions",
      explication: "Ces suggestions croisent simplement vos réponses (métier, lieu, contrat, télétravail) avec les offres en ligne. Ce ne sont que des pistes : la recherche complète reste à votre disposition." +
        (relaxed ? " Peu d'offres correspondaient exactement, nous avons donc élargi la sélection." : ""),
      cta: { label: "Voir toutes les offres correspondantes", href: "offres.html" + (params.toString() ? "?" + params.toString() : "") },
      sections: [
        { titre: "Vos offres prioritaires", items: offers.map(offerResult) },
        companies.length ? { titre: "Des entreprises à découvrir", items: companies.map(companyResult(data)) } : null,
        { titre: "Un article utile", items: [articleResult(article)] },
        otherCategory ? {
          titre: "Un métier voisin à explorer",
          items: [{
            titre: CATEGORY_LABELS[otherCategory] || otherCategory,
            meta: "D'autres offres sont en ligne dans cette famille de métiers.",
            href: "offres.html?categorie=" + encodeURIComponent(otherCategory),
            action: "Voir les offres"
          }]
        } : null
      ].filter(Boolean)
    };
  }

  /* ---- Parcours découverte de métier ---- */
  function resultsDecouverte(a, data) {
    var scores = {};
    var add = function (cat, n) { scores[cat] = (scores[cat] || 0) + n; };

    if (a.prefMedical === "oui") { add("secretaire-medicale", 3); }
    if (a.prefMedical === "peut-etre") { add("secretaire-medicale", 1); }
    if (a.prefDistance === "oui") { add("telesecretaire", 3); }
    if (a.prefOrganiser === "fort") { add("assistant-direction", 2); add("office-manager", 2); }
    if (a.prefOrganiser === "oui") { add("assistant-direction", 1); add("office-manager", 1); add("assistant-administratif", 1); }
    if (a.prefPublic === "oui") { add("secretaire-administrative", 2); add("secretaire-medicale", 1); }
    if (a.prefPublic === "non") { add("assistant-comptable", 2); add("telesecretaire", 1); }
    if (a.prefPolyvalent === "oui") { add("office-manager", 2); add("assistant-administratif", 2); add("secretaire-administrative", 1); }
    if (a.prefPolyvalent === "non") { add("secretaire-juridique", 1); add("assistant-comptable", 1); }
    if (!Object.keys(scores).length) { add("secretaire-administrative", 1); add("assistant-administratif", 1); }

    var suggested = Object.keys(scores).sort(function (x, y) { return scores[y] - scores[x]; }).slice(0, 3);

    var base = resultsEmploi(a, data, suggested);
    base.titre = "Voici les métiers qui pourraient vous plaire";
    base.explication = "D'après vos préférences (contact, organisation, domaine, distance), ces familles de métiers semblent proches de vous. Simple suggestion : le meilleur juge, c'est vous !";
    base.sections.unshift({
      titre: "Les métiers qui vous correspondent le mieux",
      items: suggested.map(function (cat, index) {
        var count = data.offers.filter(function (o) { return o.categorie === cat; }).length;
        return {
          titre: (index === 0 ? "★ " : "") + (CATEGORY_LABELS[cat] || cat),
          meta: count ? count + (count > 1 ? " offres en ligne actuellement" : " offre en ligne actuellement") : "Métier à explorer",
          href: "offres.html?categorie=" + encodeURIComponent(cat),
          action: "Découvrir"
        };
      })
    });
    /* Article orienté découverte plutôt que candidature. */
    var article = data.articles.find(function (ar) {
      return suggested[0] === "secretaire-medicale" ? ar.id === "metier-secretaire-medicale" : ar.id === "competences-cles-2026";
    }) || data.articles[0];
    base.sections = base.sections.map(function (s) {
      if (s.titre === "Un article utile") { return { titre: "Un article utile", items: [articleResult(article)] }; }
      return s;
    });
    return base;
  }

  /* ---- Parcours entreprise ---- */
  function resultsEntreprise(a, data) {
    var offerCounts = {};
    data.offers.forEach(function (o) {
      offerCounts[o.entrepriseId] = (offerCounts[o.entrepriseId] || 0) + 1;
    });

    var scored = data.companies.map(function (c) {
      var score = 1;
      if (a.secteur && a.secteur !== "peu-importe") {
        score += c.secteur === a.secteur ? 4 : -2;
      }
      if (a.ville && a.ville !== "peu-importe" && cityMatch(a.ville, c.ville + " " + c.departement)) { score += 2; }
      if (a.recrute === "oui") { score += offerCounts[c.id] ? 2 : -3; }
      return { item: c, score: score };
    }).sort(function (x, y) { return y.score - x.score; });

    var top = scored.filter(function (s) { return s.score > 1; }).map(function (s) { return s.item; });
    var relaxed = top.length === 0;
    if (!top.length) { top = scored.map(function (s) { return s.item; }); }
    var companies = top.slice(0, 4);

    var sections = [
      { titre: "Les entreprises correspondant à votre recherche", items: companies.map(companyResult(data)) }
    ];

    if (a.avis === "oui") {
      var pubs = data.knowhow.filter(function (p) {
        return p.auteur.entrepriseId && companies.some(function (c) { return c.id === p.auteur.entrepriseId; });
      }).slice(0, 2);
      if (pubs.length) {
        sections.push({ titre: "Leurs savoir-faire publiés", items: pubs.map(knowhowResult) });
      } else {
        sections.push({
          titre: "Savoir-faire & avis",
          items: [{
            titre: "Explorer tous les savoir-faire",
            meta: "Méthodes et conseils publiés par les professionnels, notés par les visiteurs.",
            href: "savoir-faire.html",
            action: "Parcourir"
          }]
        });
      }
    }

    return {
      titre: companies.length + (companies.length > 1 ? " entreprises correspondent à votre recherche" : " entreprise correspond à votre recherche"),
      explication: "Sélection établie à partir du secteur, de la zone géographique et des offres en ligne. L'annuaire complet vous permet d'affiner." +
        (relaxed ? " Peu d'entreprises correspondaient exactement, nous avons donc élargi la sélection." : ""),
      cta: { label: "Parcourir l'annuaire complet", href: "entreprises.html" },
      sections: sections
    };
  }

  /* ---- Parcours professionnel ---- */
  function resultsProfessionnel(a, data) {
    /* Les professionnels sont déduits des auteurs de savoir-faire. */
    var METIER_MATCH = {
      "administratif": ["secrétaire", "assistant", "ressources humaines", "rh"],
      "batiment": ["parqueteur", "peintre"],
      "bouche": ["boulanger"],
      "jardin": ["paysagiste"],
      "mecanique": ["mécanicien"]
    };

    var pros = {};
    data.knowhow.forEach(function (p) {
      var key = p.auteur.nom;
      if (!pros[key]) {
        pros[key] = {
          nom: p.auteur.nom, metier: p.auteur.metier, ville: p.auteur.ville,
          entreprise: p.auteur.entreprise, entrepriseId: p.auteur.entrepriseId,
          pubs: [], noteSum: 0, noteCount: 0
        };
      }
      pros[key].pubs.push(p);
      if (p.notes && p.notes.criteres && p.notes.criteres.generale) {
        pros[key].noteSum += p.notes.criteres.generale;
        pros[key].noteCount += 1;
      }
    });

    var list = Object.keys(pros).map(function (k) { return pros[k]; });
    var scored = list.map(function (pro) {
      var score = 1;
      if (a.metierPro && a.metierPro !== "peu-importe") {
        var words = METIER_MATCH[a.metierPro] || [];
        var hay = pro.metier.toLowerCase();
        score += words.some(function (w) { return hay.indexOf(w) !== -1; }) ? 4 : -3;
      }
      if (a.ville && a.ville !== "peu-importe" && cityMatch(a.ville, pro.ville)) { score += 2; }
      return { item: pro, score: score };
    }).sort(function (x, y) { return y.score - x.score; });

    var top = scored.filter(function (s) { return s.score > 1; }).map(function (s) { return s.item; });
    var relaxed = top.length === 0;
    if (!top.length) { top = scored.map(function (s) { return s.item; }); }
    var selection = top.slice(0, 3);

    var items = selection.map(function (pro) {
      var note = pro.noteCount ? Math.round(pro.noteSum / pro.noteCount * 10) / 10 : null;
      var fiche = pro.entrepriseId
        ? "entreprise-detail.html?id=" + encodeURIComponent(pro.entrepriseId)
        : "savoir-faire-detail.html?id=" + encodeURIComponent(pro.pubs[0].id);
      return {
        titre: pro.nom + " — " + pro.metier,
        meta: pro.ville + (pro.entreprise ? " · " + pro.entreprise : "") +
          (note ? " · ★ " + note + "/5" : "") +
          " · " + pro.pubs.length + (pro.pubs.length > 1 ? " publications" : " publication"),
        href: fiche,
        action: "Voir sa fiche"
      };
    });

    var sections = [{ titre: "Des professionnels à contacter", items: items }];
    if (a.avis === "oui" && selection.length) {
      sections.push({
        titre: "Leurs réalisations et avis",
        items: selection.slice(0, 2).map(function (pro) { return knowhowResult(pro.pubs[0]); })
      });
    }

    return {
      titre: selection.length + (selection.length > 1 ? " professionnels pourraient vous aider" : " professionnel pourrait vous aider"),
      explication: "Ces professionnels ont publié leurs méthodes dans l'espace Savoir-faire & Avis : leurs publications et les notes reçues vous aident à juger leur expertise avant de les contacter." +
        (relaxed ? " Peu de profils correspondaient exactement, nous avons donc élargi la sélection." : ""),
      cta: { label: "Explorer tous les savoir-faire", href: "savoir-faire.html" },
      sections: sections
    };
  }

  /* ---- Parcours publication d'offre ---- */
  function resultsPublier(a, data) {
    var similar = a.profil && a.profil !== "autre"
      ? data.offers.filter(function (o) { return o.categorie === a.profil; }).length
      : 0;

    var primary = { label: "Publier mon offre maintenant", href: "publier-offre.html" };
    if (a.action === "compte") { primary = { label: "Créer mon espace entreprise", href: "connexion.html" }; }
    if (a.action === "question") { primary = { label: "Poser ma question à l'équipe", href: "contact.html" }; }

    return {
      titre: "Vous êtes prêt(e) à recruter !",
      explication: "Votre annonce se publie en 6 étapes guidées, avec un aperçu avant mise en ligne. Elle reste visible 60 jours, puis se renouvelle en un clic pour 10 €." +
        (similar ? " À titre de repère, " + similar + (similar > 1 ? " offres similaires sont" : " offre similaire est") + " actuellement en ligne sur ce profil." : ""),
      cta: primary,
      sections: [{
        titre: "Les prochaines étapes possibles",
        items: [
          { titre: "Publier une offre", meta: "Formulaire guidé en 6 étapes, aperçu avant mise en ligne.", href: "publier-offre.html", action: "Commencer" },
          { titre: "Créer mon espace entreprise", meta: "Suivez vos offres et vos candidatures depuis un tableau de bord simple.", href: "connexion.html", action: "Créer" },
          { titre: "Consulter le tarif", meta: "La publication est guidée ; le renouvellement d'une offre coûte 10 € pour 60 jours.", href: "paiement.html", action: "Voir" },
          { titre: "Être aidé(e) tout de suite", meta: "Clémence, notre assistante en ligne, répond aux questions courantes — ou écrivez à l'équipe.", href: "contact.html", action: "Contacter" }
        ]
      }]
    };
  }

  /* ---- Parcours savoir-faire ---- */
  function resultsSavoirFaire(a, data) {
    function dureeBucket(duree) {
      var d = (duree || "").toLowerCase();
      if (d.indexOf("journée") !== -1 || d.indexOf("week-end") !== -1 || d.indexOf("jour") !== -1) { return "long"; }
      if (d.indexOf("min") !== -1) { return "court"; }
      return "moyen";
    }

    var scored = data.knowhow.map(function (p) {
      var score = 1;
      if (a.domaine && a.domaine !== "peu-importe") {
        score += p.categorie === a.domaine ? 4 : -2;
      }
      if (a.type === "recette" && p.categorie === "Fabrication & recettes") { score += 2; }
      if (a.type === "conseil" && p.categorie === "Conseils de métier") { score += 2; }
      if (a.type === "methode" && p.etapes && p.etapes.length >= 4) { score += 1; }
      if (a.niveau && a.niveau !== "peu-importe") {
        score += p.difficulte === a.niveau ? 2 : (a.niveau === "facile" && p.difficulte === "confirme" ? -2 : 0);
      }
      if (a.temps && a.temps !== "peu-importe" && dureeBucket(p.duree) === a.temps) { score += 2; }
      if (a.format === "rapide" && p.etapes && p.etapes.length <= 4) { score += 2; }
      if (a.format === "detaille" && p.etapes && p.etapes.length >= 5) { score += 2; }
      return { item: p, score: score };
    }).sort(function (x, y) { return y.score - x.score; });

    var top = scored.filter(function (s) { return s.score > 1; }).map(function (s) { return s.item; });
    var relaxed = top.length === 0;
    if (!top.length) { top = scored.map(function (s) { return s.item; }); }
    var pubs = top.slice(0, 3);

    return {
      titre: "Voici " + pubs.length + (pubs.length > 1 ? " savoir-faire choisis pour vous" : " savoir-faire choisi pour vous"),
      explication: "Sélection basée sur le domaine, votre niveau et le temps disponible. Chaque publication détaille les étapes, les conseils du professionnel et les avis des personnes qui ont testé." +
        (relaxed ? " Peu de publications correspondaient exactement, nous avons donc élargi la sélection." : ""),
      cta: { label: "Voir tous les savoir-faire", href: "savoir-faire.html" },
      sections: [{ titre: "Nos suggestions", items: pubs.map(knowhowResult) }]
    };
  }

  /* ---- Gabarits d'éléments de résultat ---- */
  function offerResult(o) {
    return {
      titre: o.titre,
      meta: o.entrepriseNom + " · " + o.ville + " · " + o.contrat +
        (SS.teletravailLabel(o.teletravail) ? " · " + SS.teletravailLabel(o.teletravail) : ""),
      href: "offre-detail.html?id=" + encodeURIComponent(o.id),
      action: "Voir l'offre"
    };
  }

  function companyResult(data) {
    return function (c) {
      var count = data.offers.filter(function (o) { return o.entrepriseId === c.id; }).length;
      return {
        titre: c.nom,
        meta: c.activite + " · " + c.ville +
          (count ? " · " + count + (count > 1 ? " offres actives" : " offre active") : ""),
        href: "entreprise-detail.html?id=" + encodeURIComponent(c.id),
        action: "Voir la fiche"
      };
    };
  }

  function knowhowResult(p) {
    var note = p.notes && p.notes.criteres ? p.notes.criteres.generale : null;
    return {
      titre: p.titre,
      meta: p.auteur.nom + " · " + p.metier + " · " + p.difficulteLabel +
        (note ? " · ★ " + note + "/5" : ""),
      href: "savoir-faire-detail.html?id=" + encodeURIComponent(p.id),
      action: "Voir les étapes"
    };
  }

  function articleResult(ar) {
    return {
      titre: ar.titre,
      meta: ar.categorie + " · " + ar.tempsLecture + " de lecture",
      href: "article.html?id=" + encodeURIComponent(ar.id),
      action: "Lire"
    };
  }

  /* ---- Affichage des résultats ---- */
  function renderResults(results) {
    var e = SS.escapeHtml;

    var chips = Object.keys(state.labels).map(function (key) {
      return '<span class="badge badge--neutral">' + e(state.labels[key]) + "</span>";
    }).join(" ");

    root.innerHTML =
      '<div class="gs-screen gs-results">' +
        '<h3 class="gs-question" id="gs-results-title" tabindex="-1">' + e(results.titre) + "</h3>" +
        (chips ? '<div class="gs-summary"><span class="gs-summary__label">Vos réponses :</span> ' + chips + "</div>" : "") +
        '<p class="gs-help">' + e(results.explication) + "</p>" +
        results.sections.map(function (section) {
          return '<div class="gs-section"><h4>' + e(section.titre) + "</h4>" +
            '<div class="gs-results-list">' +
            section.items.map(function (item) {
              return '<article class="gs-result">' +
                "<div><h5>" + e(item.titre) + "</h5>" +
                '<p class="gs-result__meta">' + e(item.meta) + "</p></div>" +
                '<a class="btn btn-outline btn-sm" href="' + e(item.href) + '">' + e(item.action) + "</a>" +
              "</article>";
            }).join("") +
            "</div></div>";
        }).join("") +
        '<div class="gs-cta">' +
          '<a class="btn btn-accent btn-lg" href="' + e(results.cta.href) + '">' + e(results.cta.label) + "</a>" +
        "</div>" +
        '<div class="gs-footer">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-gs-modify>Modifier mes réponses</button>' +
          '<div class="gs-footer__right">' +
            '<button type="button" class="btn btn-ghost btn-sm" data-gs-restart>Recommencer</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-gs-quit>Quitter</button>' +
          "</div>" +
        "</div>" +
        '<p class="gs-disclaimer">Suggestions calculées automatiquement à partir de vos réponses — rien d\'obligatoire, tout le site reste ouvert.</p>' +
      "</div>";

    root.querySelector("[data-gs-modify]").addEventListener("click", function () {
      /* Retour à la première question du parcours, réponses effacées
         (le besoin principal est conservé). */
      var besoin = state.answers.besoin;
      var besoinLabel = state.labels.besoin;
      var firstStep = state.history.length > 1 ? state.history[1] : quiz.start;
      resetState();
      if (besoin && firstStep !== quiz.start) {
        state.answers.besoin = besoin;
        state.labels.besoin = besoinLabel;
        state.history = [quiz.start];
        state.stepId = firstStep;
      } else {
        state.stepId = quiz.start;
      }
      saveState();
      renderStep();
    });
    root.querySelector("[data-gs-restart]").addEventListener("click", function () {
      resetState();
      state.stepId = quiz.start;
      saveState();
      renderStep();
    });
    root.querySelector("[data-gs-quit]").addEventListener("click", quitQuiz);
    focusQuestion();
  }
})();
